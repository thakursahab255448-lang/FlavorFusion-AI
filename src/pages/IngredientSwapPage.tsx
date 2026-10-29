import React, { useEffect, useState } from 'react';
import { AlertTriangle, GlassWater, RefreshCw, Repeat } from 'lucide-react';
import {
  CocktailItem,
  FlavorEntity,
  SubstituteSearchResponse,
} from '../types/culinary';
import { usePreferences } from '../context/PreferencesContext';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

const COOKING_CONTEXTS = [
  'All',
  'Curry & Simmered Gravy',
  'Sauté & Stir-Fry',
  'Baking & Emulsion',
  'Raw Garnish & Dressing',
];

export const IngredientSwapPage: React.FC = () => {
  const { preferences } = usePreferences();

  const [entities, setEntities] = useState<FlavorEntity[]>([]);
  const [targetIngredient, setTargetIngredient] = useState('Butter');
  const [customQuery, setCustomQuery] = useState('');
  const [cookingContext, setCookingContext] = useState('All');
  const [dietaryPreference, setDietaryPreference] = useState<
    'All' | 'Vegetarian' | 'Vegan' | 'Non-Vegetarian'
  >(preferences.dietaryPreference);

  const [subResponse, setSubResponse] = useState<SubstituteSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional CocktailDB / Botanical Drink extension state
  const [showDrinkExtension, setShowDrinkExtension] = useState(false);
  const [drinks, setDrinks] = useState<CocktailItem[]>([]);

  useEffect(() => {
    fetch('/api/flavors/search')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.entities)) {
          setEntities(data.entities);
        }
      })
      .catch(() => {});
  }, []);

  const fetchSubstitutes = async (ingToSearch: string) => {
    if (!ingToSearch.trim()) {
      setError('Please select or enter an ingredient name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ingredients/substitutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient: ingToSearch,
          cookingContext,
          dietaryPreference,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not compute substitutes.');
        setSubResponse(null);
      } else {
        setSubResponse(data);
      }
    } catch {
      setError('Network error while querying Ingredient Swap service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstitutes(targetIngredient);
  }, [targetIngredient, cookingContext, dietaryPreference]);

  useEffect(() => {
    if (showDrinkExtension) {
      fetch(`/api/cocktails/search?q=${encodeURIComponent(targetIngredient)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data?.drinks)) {
            setDrinks(data.drinks);
          }
        })
        .catch(() => {});
    }
  }, [showDrinkExtension, targetIngredient]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) {
      setError('Please enter an ingredient name before searching.');
      return;
    }
    fetchSubstitutes(customQuery.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#0F2419]/10 dark:border-white/10 pb-6">
        <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
          CORE FEATURE 04 · FUNCTIONAL ROLE & AROMA SUBSTITUTION
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          Smart Ingredient Swap
        </h1>
        <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 mt-1 max-w-2xl">
          Find context-aware culinary alternatives ranked by shared aroma molecules, sensory vector
          similarity, and functional role—with transparent taste-shift notes and allergen guidance.
        </p>
      </div>

      {/* Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Select Known Ingredient */}
          <div className="md:col-span-4">
            <label
              htmlFor="swap-ingredient-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-1.5"
            >
              1. Select Ingredient to Replace
            </label>
            <select
              id="swap-ingredient-select"
              value={targetIngredient}
              onChange={(e) => {
                setTargetIngredient(e.target.value);
                setCustomQuery('');
              }}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
            >
              {entities.map((ent) => (
                <option key={ent.entityId} value={ent.name}>
                  {ent.name} ({ent.category})
                </option>
              ))}
            </select>
          </div>

          {/* Cooking Context */}
          <div className="md:col-span-4">
            <label
              htmlFor="swap-context-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-1.5"
            >
              2. Culinary Application Context
            </label>
            <select
              id="swap-context-select"
              value={cookingContext}
              onChange={(e) => setCookingContext(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
            >
              {COOKING_CONTEXTS.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Filter */}
          <div className="md:col-span-4">
            <label
              htmlFor="swap-diet-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-1.5"
            >
              3. Substitute Dietary Filter
            </label>
            <select
              id="swap-diet-select"
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
            >
              <option value="All">All Compatible Substitutes</option>
              <option value="Vegetarian">Vegetarian Substitutes Only</option>
              <option value="Vegan">Vegan / Dairy-Free Substitutes Only</option>
            </select>
          </div>
        </div>

        {/* Custom Ingredient Query Form (Tests Valid & Invalid Input Handling) */}
        <form
          onSubmit={handleCustomSubmit}
          className="pt-4 border-t border-[#0F2419]/10 dark:border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
        >
          <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
            <label htmlFor="custom-swap-search" className="sr-only">
              Search any custom ingredient for substitutes
            </label>
            <input
              id="custom-swap-search"
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Or type any ingredient name to test availability (e.g., Paneer, Garlic, Dragonfruit)..."
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
            />
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-xl cursor-pointer whitespace-nowrap shrink-0"
            >
              Find Substitutes
            </button>
          </div>
        </form>
      </div>

      {/* Mandatory Allergen & Nutritional Disclaimer */}
      {subResponse && (
        <div className="p-4 rounded-xl bg-amber-950/10 dark:bg-amber-400/10 border border-amber-800/25 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#0F2419] dark:text-[#F7F6F2]">
              {subResponse.allergenAndNutritionDisclaimer}
            </p>
            <p className="font-mono text-stone-500">{subResponse.formulaDisclosure}</p>
          </div>
        </div>
      )}

      {/* Results Area */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-stone-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Analyzing culinary roles and aroma molecule overlap...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-900/10 border border-red-800/20 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      ) : subResponse && subResponse.substitutes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-3">
          <h2 className="font-display text-xl font-semibold">
            No Verified Substitute Identified for "{subResponse.targetIngredient}"
          </h2>
          <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 max-w-2xl">
            {subResponse.formulaDisclosure} Try selecting a documented ingredient from the dropdown
            (such as Butter, Paneer, Garlic, Ginger, Lemon, or Miso) or relaxing the dietary filter.
          </p>
        </div>
      ) : subResponse ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Recommended Alternatives for {subResponse.targetIngredient}
              </h2>
              {subResponse.targetEntity && (
                <p className="text-xs text-stone-500">
                  Target Roles:{' '}
                  {subResponse.targetEntity.culinaryRole.map((r) => r.replace(/_/g, ' ')).join(', ')}{' '}
                  · Primary Molecules:{' '}
                  {subResponse.targetEntity.molecules
                    .slice(0, 3)
                    .map((m) => m.commonName)
                    .join(', ')}
                </p>
              )}
            </div>
            <ProvenanceBadge provenance={subResponse.provenance} compact />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subResponse.substitutes.map((sub) => (
              <div
                key={sub.substituteName}
                className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 border-b border-[#0F2419]/10 dark:border-white/10 pb-3">
                    <div>
                      <div className="text-xs text-stone-500">
                        <span>{sub.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{sub.dietaryFlags.isVegan ? 'Vegan' : sub.dietaryFlags.isVegetarian ? 'Vegetarian' : 'Standard'}</span>
                      </div>
                      <h3 className="font-display text-xl font-semibold mt-0.5 flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-emerald-700 dark:text-[#A3E635]" />
                        <span>{sub.substituteName}</span>
                      </h3>
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <div className="text-xl font-bold text-emerald-800 dark:text-[#A3E635]">
                        {sub.suitabilityScore}%
                      </div>
                      <div className="text-[11px] text-stone-500">App Suitability Est.</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold">Why Suggested: </span>
                      <span className="text-[#0F2419]/80 dark:text-[#F7F6F2]/80">
                        {sub.reasonForSuggestion}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Taste & Recipe Impact: </span>
                      <span className="text-[#0F2419]/80 dark:text-[#F7F6F2]/80">
                        {sub.tasteAndTextureImpact}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Suggested Ratio: </span>
                      <span className="font-mono">{sub.recommendedRatio}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#0F2419]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-stone-500">
                    {sub.sharedMolecules.length > 0
                      ? `Shared: ${sub.sharedMolecules.join(', ')}`
                      : `Roles: ${sub.sharedCulinaryRoles.join(', ')}`}
                  </span>
                  {sub.dietaryFlags.commonAllergens.length > 0 ? (
                    <span className="text-amber-800 dark:text-amber-300 font-semibold">
                      Allergen Note: {sub.dietaryFlags.commonAllergens.join(', ')}
                    </span>
                  ) : (
                    <span className="text-stone-500">Check product label for allergens</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Optional Extension: CocktailDB Botanical Drink Discovery */}
      <section className="pt-6 border-t border-[#0F2419]/10 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10">
          <div className="space-y-1">
            <div className="text-xs font-mono text-stone-500">
              OPTIONAL EXTENSION · COCKTAILDB BOTANICAL BEVERAGE MODULE
            </div>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <GlassWater className="w-5 h-5 text-emerald-700 dark:text-[#A3E635]" />
              <span>Botanical Drink & Mocktail Flavor Connections</span>
            </h2>
            <p className="text-xs text-[#0F2419]/75 dark:text-[#F7F6F2]/75">
              Optional module connecting culinary ingredients (Ginger, Saffron, Lemon, Basil, Cumin)
              to zero-proof botanical drink recipes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDrinkExtension(!showDrinkExtension)}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-xl cursor-pointer whitespace-nowrap shrink-0"
          >
            {showDrinkExtension ? 'Hide Botanical Drinks' : 'Explore Botanical Drinks'}
          </button>
        </div>

        {showDrinkExtension && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drinks.map((drink) => (
              <div
                key={drink.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-3"
              >
                <div className="text-xs text-stone-500">
                  {drink.category} · {drink.alcoholic} · {drink.glass}
                </div>
                <h3 className="font-display text-lg font-semibold">{drink.name}</h3>
                <p className="text-xs text-[#0F2419]/80 dark:text-[#F7F6F2]/80 leading-relaxed">
                  {drink.instructions}
                </p>
                <div className="text-xs space-y-1 pt-2 border-t border-[#0F2419]/10 dark:border-white/10">
                  <div className="font-semibold">Ingredients:</div>
                  {drink.ingredients.map((i, idx) => (
                    <div key={idx} className="flex justify-between font-mono text-[11px]">
                      <span>{i.name}</span>
                      <span>{i.measure}</span>
                    </div>
                  ))}
                </div>
                <ProvenanceBadge provenance={drink.provenance} compact />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
