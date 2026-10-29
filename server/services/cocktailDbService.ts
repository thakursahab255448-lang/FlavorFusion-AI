import { CocktailItem } from '../../src/types/culinary';
import { sharedApiCache } from '../cache';
import { DEMO_COCKTAILS } from '../sampleData';

const COCKTAILDB_BASE_URL =
  process.env.COCKTAILDB_BASE_URL || 'https://www.thecocktaildb.com/api/json/v1/1';

export async function searchBotanicalDrinks(ingredientQuery?: string): Promise<{
  drinks: CocktailItem[];
  isDemoMode: boolean;
}> {
  const q = (ingredientQuery || '').trim().toLowerCase();
  const cacheKey = `cocktaildb:${q || 'all'}`;
  const cached = sharedApiCache.get<{ drinks: CocktailItem[]; isDemoMode: boolean }>(cacheKey);
  if (cached) return cached;

  let filtered = DEMO_COCKTAILS;
  if (q) {
    filtered = DEMO_COCKTAILS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.linkedFlavorEntities.some((e) => e.toLowerCase().includes(q)) ||
        d.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
    if (filtered.length === 0) {
      filtered = DEMO_COCKTAILS;
    }
  }

  const res = {
    drinks: filtered,
    isDemoMode: true,
  };
  sharedApiCache.set(cacheKey, res);
  return res;
}

export function getCocktailDbStatus() {
  return {
    enabled: true,
    baseUrl: COCKTAILDB_BASE_URL,
  };
}
