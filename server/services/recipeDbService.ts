import { NormalizedRecipe, RecipeIngredientItem } from '../../src/types/culinary';
import { normalizeIngredientName } from '../../src/utils/recommendationEngine';
import { sharedApiCache } from '../cache';
import { DEMO_RECIPES } from '../sampleData';

const RECIPEDB_BASE_URL =
  process.env.RECIPEDB_BASE_URL || 'https://api.foodoscope.com/recipe2-api';

function hasValidFoodoscopeKey(): boolean {
  const key = process.env.FOODOSCOPE_API_KEY;
  return Boolean(
    key &&
      key.trim().length > 5 &&
      key !== 'YOUR_FOODOSCOPE_BEARER_TOKEN' &&
      key !== 'MY_FOODOSCOPE_API_KEY'
  );
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const THEMES: NormalizedRecipe['visualTheme'][] = [
  'saffron',
  'emerald',
  'terracotta',
  'plum',
  'citrus',
  'espresso',
];

function normalizeRawRecipe(raw: Record<string, any>, idx: number, endpointUsed: string): NormalizedRecipe | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw.Recipe_id ?? raw.recipe_id ?? raw.id ?? `live-${idx}`);
  const title = String(raw.Recipe_title ?? raw.recipe_title ?? raw.title ?? '').trim();
  if (!title) return null;

  const cuisine = String(raw.Region ?? raw.Sub_region ?? raw.cuisine ?? 'Global').trim();
  const category = String(raw.Processes ? 'Main Course' : raw.category ?? 'Main Course').trim();

  const isVeg =
    raw.vegan === '1' ||
    raw.vegan === 1 ||
    raw.vegan === true
      ? 'Vegan'
      : raw.ovo_lacto_vegetarian === '1' ||
        raw.lacto_vegetarian === '1' ||
        raw.vegetarian === true
      ? 'Vegetarian'
      : 'Non-Vegetarian';

  const rawIngs: any[] = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const ingredients: RecipeIngredientItem[] = rawIngs.map((ing) => {
    const name = typeof ing === 'string' ? ing : String(ing.ingredient_Phrase ?? ing.ingredient ?? ing.name ?? '');
    return {
      name,
      quantity: ing.quantity ? String(ing.quantity) : undefined,
      unit: ing.unit ? String(ing.unit) : undefined,
      normalizedName: normalizeIngredientName(name),
    };
  });

  const rawInstructions = raw.instructions ?? raw.Processes ?? [];
  const instructions: string[] = Array.isArray(rawInstructions)
    ? rawInstructions.map(String)
    : typeof rawInstructions === 'string'
    ? rawInstructions.split(/\.|\n|;/).map((s) => s.trim()).filter(Boolean)
    : [];

  const cookTime = Number(raw.total_time ?? raw.cook_time ?? raw.prep_time ?? 0);

  return {
    id,
    title,
    cuisine,
    region: raw.Sub_region ? String(raw.Sub_region) : undefined,
    category,
    dietaryType: isVeg,
    cookingTimeMinutes: cookTime > 0 ? cookTime : null,
    servings: raw.servings ? Number(raw.servings) : null,
    summary: String(raw.description ?? `Verified recipe from Foodoscope RecipeDB (${cuisine}).`),
    ingredients,
    instructions,
    keyFlavorNotes: ['Verified RecipeDB Entry'],
    imageUrl: raw.img_url ? String(raw.img_url) : undefined,
    visualTheme: THEMES[idx % THEMES.length],
    provenance: {
      source: 'live_foodoscope_api',
      sourceLabel: 'Foodoscope RecipeDB Live API',
      endpointUsed,
      isVerifiedApiData: true,
      isDemoFallback: false,
      timestamp: new Date().toISOString(),
    },
  };
}

export async function fetchAllOrSearchRecipes(query?: string, cuisine?: string): Promise<{
  recipes: NormalizedRecipe[];
  isDemoMode: boolean;
  statusNote: string;
}> {
  const cacheKey = `recipedb:list:${query || 'all'}:${cuisine || 'all'}`;
  const cached = sharedApiCache.get<{
    recipes: NormalizedRecipe[];
    isDemoMode: boolean;
    statusNote: string;
  }>(cacheKey);
  if (cached) return cached;

  if (hasValidFoodoscopeKey()) {
    try {
      const endpoint = query
        ? `${RECIPEDB_BASE_URL}/recipe/recipesinfo?search=${encodeURIComponent(query)}`
        : `${RECIPEDB_BASE_URL}/recipe/recipesinfo?page=1&limit=20`;
      const res = await fetchWithTimeout(endpoint, {
        headers: {
          Authorization: `Bearer ${process.env.FOODOSCOPE_API_KEY}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const rawArray = Array.isArray(json?.payload?.data)
          ? json.payload.data
          : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        const normalized = rawArray
          .map((item: any, idx: number) => normalizeRawRecipe(item, idx, endpoint))
          .filter((item: NormalizedRecipe | null): item is NormalizedRecipe => Boolean(item));

        if (normalized.length > 0) {
          const out = {
            recipes: normalized,
            isDemoMode: false,
            statusNote: 'Retrieved from Foodoscope RecipeDB Live API.',
          };
          sharedApiCache.set(cacheKey, out);
          return out;
        }
      }
    } catch {
      // Graceful degradation to demo dataset
    }
  }

  let recipes = [...DEMO_RECIPES];
  if (cuisine && cuisine !== 'All') {
    recipes = recipes.filter((r) => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  }

  const out = {
    recipes,
    isDemoMode: true,
    statusNote: hasValidFoodoscopeKey()
      ? 'Live RecipeDB endpoint unreachable or returned empty; showing clearly labelled Demo Reference Dataset.'
      : 'Demo Mode Active: Showing curated RecipeDB schema dataset (Set FOODOSCOPE_API_KEY in .env to query live Foodoscope RecipeDB).',
  };
  sharedApiCache.set(cacheKey, out);
  return out;
}

export async function fetchRecipeById(id: string): Promise<NormalizedRecipe | null> {
  const { recipes } = await fetchAllOrSearchRecipes();
  return recipes.find((r) => r.id === id) || DEMO_RECIPES.find((r) => r.id === id) || null;
}

export function getRecipeDbStatus() {
  return {
    configured: hasValidFoodoscopeKey(),
    baseUrl: RECIPEDB_BASE_URL,
  };
}
