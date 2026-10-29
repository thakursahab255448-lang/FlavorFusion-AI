import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { sharedApiCache } from './server/cache';
import {
  getFlavorDbStatus,
  getFlavorEntityById,
  searchFlavorEntities,
} from './server/services/flavorDbService';
import {
  fetchAllOrSearchRecipes,
  fetchRecipeById,
  getRecipeDbStatus,
} from './server/services/recipeDbService';
import {
  getCocktailDbStatus,
  searchBotanicalDrinks,
} from './server/services/cocktailDbService';
import {
  generateAiGroundedFusionIdea,
  getGeminiStatus,
} from './server/services/geminiService';
import {
  compareIngredients,
  findIngredientSubstitutes,
  generateRuleBasedFusionIdeas,
  normalizeIngredientName,
  scoreAndRankRecipes,
} from './src/utils/recommendationEngine';
import { ApiHealthStatus, FusionRequest, UserPreferences } from './src/types/culinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // 1. Health & API Status Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const rStatus = getRecipeDbStatus();
    const fStatus = getFlavorDbStatus();
    const gStatus = getGeminiStatus();
    const cStatus = getCocktailDbStatus();

    const health: ApiHealthStatus = {
      status: 'healthy',
      mode: rStatus.configured && fStatus.configured ? 'live_api' : 'demo_mode',
      services: {
        recipeDb: {
          configured: rStatus.configured,
          reachable: rStatus.configured,
          baseUrl: rStatus.baseUrl,
          statusMessage: rStatus.configured
            ? 'Foodoscope RecipeDB Bearer token configured.'
            : 'Demo Reference Mode (Configure FOODOSCOPE_API_KEY in .env for live Foodoscope RecipeDB queries).',
        },
        flavorDb: {
          configured: fStatus.configured,
          cosylabPublicReachable: true,
          baseUrl: fStatus.baseUrl,
          statusMessage: fStatus.configured
            ? 'Foodoscope FlavorDB Bearer token configured + CoSyLab IIIT-Delhi JSON adapter active.'
            : 'CoSyLab IIIT-Delhi JSON adapter + Curated FlavorDB Entity Schema Reference active.',
        },
        geminiAi: {
          configured: gStatus.configured,
          model: gStatus.model,
          statusMessage: gStatus.configured
            ? 'Server-side Gemini 3.8 Flash synthesis active for Fusion Lab.'
            : 'Rule-based culinary synthesis engine active (GEMINI_API_KEY optional).',
        },
        cocktailDb: {
          enabled: cStatus.enabled,
          baseUrl: cStatus.baseUrl,
          statusMessage: 'Optional Botanical Drink & Mocktail Explorer module available.',
        },
      },
      cacheStats: sharedApiCache.getStats(),
      timestamp: new Date().toISOString(),
    };

    res.json(health);
  });

  // 2. FlavorDB Search & Listing
  app.get('/api/flavors/search', async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const result = await searchFlavorEntities(q);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to search flavor entities.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 3. FlavorDB Single Entity Lookup
  app.get('/api/flavors/entity/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid FlavorDB entity ID.' });
        return;
      }
      const entity = await getFlavorEntityById(id);
      if (!entity) {
        res.status(404).json({ error: `FlavorDB entity #${id} not found.` });
        return;
      }
      res.json({ entity });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to fetch FlavorDB entity.',
        message: err?.message || 'Internal error',
      });
    }
  });

  // 4. Flavor Compatibility & Pairings Analysis
  app.post('/api/flavors/pairings', async (req: Request, res: Response) => {
    try {
      const { primaryIngredient, comparedIngredients } = req.body || {};
      if (!primaryIngredient || typeof primaryIngredient !== 'string') {
        res.status(400).json({ error: 'primaryIngredient string is required.' });
        return;
      }
      const compList: string[] = Array.isArray(comparedIngredients)
        ? comparedIngredients.map(String).filter(Boolean)
        : [];
      if (compList.length === 0) {
        res.status(400).json({ error: 'At least one comparison ingredient is required.' });
        return;
      }

      const { entities } = await searchFlavorEntities('');
      const findBestEntity = (name: string) => {
        const norm = normalizeIngredientName(name);
        return (
          entities.find((e) => normalizeIngredientName(e.name) === norm) ||
          entities.find((e) => e.synonyms.some((s) => normalizeIngredientName(s) === norm)) ||
          entities.find((e) => normalizeIngredientName(e.name).includes(norm)) ||
          null
        );
      };

      const primaryEntity = findBestEntity(primaryIngredient);
      if (!primaryEntity) {
        res.status(404).json({
          error: `No documented FlavorDB entity found for "${primaryIngredient}".`,
          suggestion: 'Try searching for Garlic, Ginger, Tomato, Basil, Saffron, Paneer, Shiitake Mushroom, Miso, Cumin, Lemon, or Butter.',
        });
        return;
      }

      const matchedCompared = compList
        .map((c) => findBestEntity(c))
        .filter((e): e is NonNullable<typeof e> => Boolean(e) && e.entityId !== primaryEntity.entityId);

      if (matchedCompared.length === 0) {
        res.status(404).json({
          error: 'None of the selected comparison ingredients matched a distinct FlavorDB entity.',
        });
        return;
      }

      const comparison = compareIngredients(primaryEntity, matchedCompared);
      res.json(comparison);
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to compute ingredient compatibility.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 5. RecipeDB Search & Filtering
  app.get('/api/recipes/search', async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const cuisine = typeof req.query.cuisine === 'string' ? req.query.cuisine.trim() : '';
      const ingredientsParam = typeof req.query.ingredients === 'string' ? req.query.ingredients : '';
      const diet = typeof req.query.diet === 'string' ? req.query.diet : 'All';
      const excludeParam = typeof req.query.exclude === 'string' ? req.query.exclude : '';
      const category = typeof req.query.category === 'string' ? req.query.category : '';

      const queryIngredients = ingredientsParam
        ? ingredientsParam.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const avoidIngredients = excludeParam
        ? excludeParam.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const [{ recipes, isDemoMode, statusNote }, { entities }] = await Promise.all([
        fetchAllOrSearchRecipes(q, cuisine),
        searchFlavorEntities(''),
      ]);

      const preferences: UserPreferences = {
        dietaryPreference:
          diet === 'Vegetarian' || diet === 'Vegan' || diet === 'Non-Vegetarian' ? diet : 'All',
        preferredCuisines: cuisine && cuisine !== 'All' ? [cuisine] : [],
        exploreIngredients: [],
        avoidIngredients,
        preferredCategories: category && category !== 'All' ? [category] : [],
      };

      let scored = scoreAndRankRecipes(recipes, queryIngredients, preferences, entities, q);
      if (category && category !== 'All') {
        scored = scored.filter(
          (s) => s.recipe.category.toLowerCase() === category.toLowerCase()
        );
      }

      res.json({
        results: scored,
        isDemoMode,
        statusNote,
        totalCount: scored.length,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to search recipes.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 6. RecipeDB Single Recipe Detail
  app.get('/api/recipes/:id', async (req: Request, res: Response) => {
    try {
      const recipe = await fetchRecipeById(String(req.params.id));
      if (!recipe) {
        res.status(404).json({ error: `Recipe "${req.params.id}" not found.` });
        return;
      }
      const { entities } = await searchFlavorEntities('');
      const linkedEntities = entities.filter((e) =>
        recipe.ingredients.some(
          (ri) =>
            ri.normalizedName === normalizeIngredientName(e.name) ||
            ri.normalizedName.includes(normalizeIngredientName(e.name))
        )
      );
      res.json({ recipe, linkedEntities });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to retrieve recipe details.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 7. Intelligent Recommendation Engine Endpoint
  app.post('/api/recommendations', async (req: Request, res: Response) => {
    try {
      const { ingredients = [], preferences = {}, searchQuery = '' } = req.body || {};
      const [{ recipes, isDemoMode, statusNote }, { entities }] = await Promise.all([
        fetchAllOrSearchRecipes(searchQuery),
        searchFlavorEntities(''),
      ]);

      const userPrefs: UserPreferences = {
        dietaryPreference: preferences.dietaryPreference || 'All',
        preferredCuisines: Array.isArray(preferences.preferredCuisines)
          ? preferences.preferredCuisines
          : [],
        exploreIngredients: Array.isArray(preferences.exploreIngredients)
          ? preferences.exploreIngredients
          : [],
        avoidIngredients: Array.isArray(preferences.avoidIngredients)
          ? preferences.avoidIngredients
          : [],
        preferredCategories: Array.isArray(preferences.preferredCategories)
          ? preferences.preferredCategories
          : [],
      };

      const ranked = scoreAndRankRecipes(
        recipes,
        Array.isArray(ingredients) ? ingredients : [],
        userPrefs,
        entities,
        searchQuery
      );

      res.json({
        recommendations: ranked,
        isDemoMode,
        statusNote,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to compute recommendations.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 8. Fusion Lab Discovery Endpoint
  app.post('/api/fusion/generate', async (req: Request, res: Response) => {
    try {
      const {
        baseIngredient,
        additionalIngredients = [],
        targetCuisine = 'Cross-Cultural',
        dietaryPreference = 'Vegetarian',
        useAiSynthesis = false,
      } = req.body || {};

      if (!baseIngredient || typeof baseIngredient !== 'string') {
        res.status(400).json({ error: 'Please select or enter a base ingredient.' });
        return;
      }

      const [{ recipes, isDemoMode }, { entities }] = await Promise.all([
        fetchAllOrSearchRecipes(),
        searchFlavorEntities(''),
      ]);

      const fusionReq: FusionRequest = {
        baseIngredient,
        additionalIngredients: Array.isArray(additionalIngredients)
          ? additionalIngredients.map(String).filter(Boolean)
          : [],
        targetCuisine,
        dietaryPreference,
        useAiSynthesis: Boolean(useAiSynthesis),
      };

      const ruleIdeas = generateRuleBasedFusionIdeas(fusionReq, recipes, entities);

      if (useAiSynthesis && ruleIdeas.length > 0) {
        const matchedEntities = entities.filter((e) => {
          const n = normalizeIngredientName(e.name);
          return (
            n.includes(normalizeIngredientName(baseIngredient)) ||
            fusionReq.additionalIngredients.some((ai) =>
              n.includes(normalizeIngredientName(ai))
            )
          );
        });
        const aiIdea = await generateAiGroundedFusionIdea(
          fusionReq,
          recipes,
          matchedEntities.length > 0 ? matchedEntities : entities.slice(0, 3),
          ruleIdeas[0]
        );
        if (aiIdea) {
          ruleIdeas.unshift(aiIdea);
        }
      }

      res.json({
        ideas: ruleIdeas,
        isDemoMode,
        aiUsed: Boolean(useAiSynthesis && ruleIdeas[0]?.generationMethod.startsWith('AI-Assisted')),
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to generate fusion concepts.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 9. Smart Ingredient Alternatives (Ingredient Swap)
  app.post('/api/ingredients/substitutes', async (req: Request, res: Response) => {
    try {
      const {
        ingredient,
        cookingContext = 'All',
        dietaryPreference = 'All',
      } = req.body || {};

      if (!ingredient || typeof ingredient !== 'string' || !ingredient.trim()) {
        res.status(400).json({ error: 'Please provide an ingredient name to find alternatives.' });
        return;
      }

      const { entities } = await searchFlavorEntities('');
      const result = findIngredientSubstitutes(
        ingredient.trim(),
        cookingContext,
        dietaryPreference,
        entities
      );

      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to find ingredient substitutes.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // 10. Optional CocktailDB / Botanical Drinks Discovery
  app.get('/api/cocktails/search', async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const data = await searchBotanicalDrinks(q);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to fetch botanical drink pairings.',
        message: err?.message || 'Internal server error',
      });
    }
  });

  // Mount Vite Dev Server or Production Static Assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlavorFusion server listening on http://localhost:${PORT}`);
  });
}

startServer();
