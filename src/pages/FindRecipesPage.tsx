import React, { useEffect, useState } from 'react';
import { Bookmark, Plus, RefreshCw, Search, X } from 'lucide-react';
import { NormalizedRecipe, ScoredRecipeResult } from '../types/culinary';
import { usePreferences } from '../context/PreferencesContext';
import { CulinaryVisual } from '../components/CulinaryVisual';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

interface FindRecipesPageProps {
  onOpenRecipe: (recipe: NormalizedRecipe) => void;
}

const PANTRY_SUGGESTIONS = [
  'Garlic',
  'Ginger',
  'Tomato',
  'Basil',
  'Saffron',
  'Paneer',
  'Shiitake Mushroom',
  'Miso',
  'Butter',
  'Olive Oil',
  'Cumin',
  'Cilantro',
  'Lemon',
  'Parmesan',
  'Tofu',
  'Coconut Milk',
];

const CUISINES = ['All', 'Indian', 'Italian', 'Japanese', 'Mediterranean'];
const CATEGORIES = ['All', 'Main Course', 'Starter', 'Risotto & Rice', 'Noodles & Pasta'];

export const FindRecipesPage: React.FC<FindRecipesPageProps> = ({ onOpenRecipe }) => {
  const { preferences, updatePreferences, isRecipeSaved, toggleSaveRecipe } = usePreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['Garlic', 'Tomato']);
  const [customIngInput, setCustomIngInput] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [excludeInput, setExcludeInput] = useState('');
  const [results, setResults] = useState<ScoredRecipeResult[]>([]);
  const [statusNote, setStatusNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCuisine !== 'All') params.set('cuisine', selectedCuisine);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedIngredients.length > 0) params.set('ingredients', selectedIngredients.join(','));
      params.set('diet', preferences.dietaryPreference);
      if (preferences.avoidIngredients.length > 0) {
        params.set('exclude', preferences.avoidIngredients.join(','));
      }

      const res = await fetch(`/api/recipes/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to search recipes.');
        setResults([]);
      } else {
        setResults(Array.isArray(data?.results) ? data.results : []);
        setStatusNote(data?.statusNote || '');
      }
    } catch {
      setError('Network error while searching recipes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [
    selectedIngredients,
    selectedCuisine,
    selectedCategory,
    preferences.dietaryPreference,
    preferences.avoidIngredients,
  ]);

  const handleAddPantryIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customIngInput.trim();
    if (!val) return;
    if (!selectedIngredients.includes(val)) {
      setSelectedIngredients([...selectedIngredients, val]);
    }
    setCustomIngInput('');
  };

  const handleTogglePantry = (ing: string) => {
    if (selectedIngredients.includes(ing)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== ing));
    } else {
      setSelectedIngredients([...selectedIngredients, ing]);
    }
  };

  const handleAddExclusion = (e: React.FormEvent) => {
    e.preventDefault();
    const val = excludeInput.trim();
    if (!val) return;
    if (!preferences.avoidIngredients.includes(val)) {
      updatePreferences({ avoidIngredients: [...preferences.avoidIngredients, val] });
    }
    setExcludeInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#0F2419]/10 dark:border-white/10 pb-6">
        <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
          CORE FEATURE 02 · RECIPEDB + FLAVOR-BRIDGE RANKING
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Smart Recipe Finder</h1>
        <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 mt-1 max-w-2xl">
          Search recipes by dish title, match against ingredients in your pantry, filter by dietary
          preference or cuisine, and inspect our transparent 60 / 25 / 15 recommendation score.
        </p>
      </div>

      {/* Filter & Pantry Control Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-6">
        {/* Row 1: Dish Search + Dietary Selector + Cuisine + Category */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchRecipes();
            }}
            className="md:col-span-5 flex gap-2"
          >
            <div className="relative flex-1">
              <label htmlFor="recipe-name-search" className="sr-only">
                Search recipe by name
              </label>
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="recipe-name-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by title or keyword..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-xl cursor-pointer whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </form>

          {/* Dietary Selector */}
          <div className="md:col-span-3">
            <label htmlFor="diet-filter-select" className="sr-only">
              Dietary Preference
            </label>
            <select
              id="diet-filter-select"
              value={preferences.dietaryPreference}
              onChange={(e) =>
                updatePreferences({
                  dietaryPreference: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
            >
              <option value="All">Diet: All Recipes</option>
              <option value="Vegetarian">Diet: Vegetarian Only</option>
              <option value="Vegan">Diet: Vegan Only</option>
              <option value="Non-Vegetarian">Diet: Non-Vegetarian</option>
            </select>
          </div>

          {/* Cuisine Selector */}
          <div className="md:col-span-2">
            <label htmlFor="cuisine-filter-select" className="sr-only">
              Filter by Cuisine
            </label>
            <select
              id="cuisine-filter-select"
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  Cuisine: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="md:col-span-2">
            <label htmlFor="category-filter-select" className="sr-only">
              Filter by Category
            </label>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Available Pantry Ingredients */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#0F2419]/10 dark:border-white/10">
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="add-pantry-ing"
                className="text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80"
              >
                Available Pantry Ingredients (Click to toggle or type to add)
              </label>
              {selectedIngredients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIngredients([])}
                  className="text-xs text-stone-500 underline hover:text-[#0F2419] cursor-pointer"
                >
                  Clear pantry ({selectedIngredients.length})
                </button>
              )}
            </div>

            <form onSubmit={handleAddPantryIngredient} className="flex gap-2">
              <input
                id="add-pantry-ing"
                type="text"
                value={customIngInput}
                onChange={(e) => setCustomIngInput(e.target.value)}
                placeholder="Type an ingredient you have on hand (e.g., Saffron, Ginger, Paneer)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F2419] text-white dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                + Add Ingredient
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {PANTRY_SUGGESTIONS.map((ing) => {
                const active = selectedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => handleTogglePantry(ing)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0F2419] text-[#F7F6F2] border-[#0F2419] dark:bg-[#A3E635] dark:text-[#0B1911] dark:border-[#A3E635]'
                        : 'border-[#0F2419]/15 dark:border-white/15 hover:border-[#0F2419]/40'
                    }`}
                  >
                    {active ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{ing}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exclude Ingredients */}
          <div className="lg:col-span-4 space-y-2.5 border-t lg:border-t-0 lg:border-l border-[#0F2419]/10 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <label
              htmlFor="exclude-ing-field"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80"
            >
              Exclude Ingredients
            </label>
            <form onSubmit={handleAddExclusion} className="flex gap-2">
              <input
                id="exclude-ing-field"
                type="text"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                placeholder="Exclude (e.g., Butter, Tofu)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-red-800 text-white rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Exclude
              </button>
            </form>

            {preferences.avoidIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {preferences.avoidIngredients.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        avoidIngredients: preferences.avoidIngredients.filter((i) => i !== item),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-red-900/15 text-red-800 dark:text-red-300 font-medium cursor-pointer"
                  >
                    <span>No {item}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">No ingredients currently excluded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Formula & Provenance Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600 dark:text-stone-400 px-1">
        <div>
          <span className="font-semibold text-[#0F2419] dark:text-[#A3E635]">
            Ranking Formula:
          </span>{' '}
          {results[0]?.matchBreakdown.formulaDisclosure ||
            '60% Ingredient Overlap + 25% Preference Match + 15% FlavorDB Molecular Bridge'}
        </div>
        <div className="font-mono">{statusNote}</div>
      </div>

      {/* Recipe Results Grid */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-stone-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Ranking recipes by ingredient overlap and molecular flavor bridges...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-900/10 border border-red-800/20 space-y-3">
          <div className="text-sm font-semibold text-red-800 dark:text-red-300">{error}</div>
          <button
            type="button"
            onClick={fetchRecipes}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-white rounded-lg cursor-pointer"
          >
            Retry Search
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 text-center space-y-3">
          <h2 className="font-display text-xl font-semibold">No Matching Recipes Found</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No recipes matched all your current filters and exclusions. Try resetting your search
            keyword or removing excluded ingredients.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCuisine('All');
              setSelectedCategory('All');
              updatePreferences({ dietaryPreference: 'All', avoidIngredients: [] });
            }}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-white dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(({ recipe, matchBreakdown }) => {
            const saved = isRecipeSaved(recipe.id);
            return (
              <article
                key={recipe.id}
                className="rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <CulinaryVisual
                    title={recipe.title}
                    subtitle={`${recipe.cuisine} · ${recipe.dietaryType}`}
                    theme={recipe.visualTheme}
                    imageUrl={recipe.imageUrl}
                    molecules={recipe.keyFlavorNotes}
                    className="h-44"
                  />

                  <div className="p-5 space-y-3">
                    {/* Metadata & App Match Score */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="text-stone-500 dark:text-stone-400">
                        <span>{recipe.cuisine}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{recipe.dietaryType}</span>
                        {recipe.cookingTimeMinutes !== null && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono tabular-nums">
                              {recipe.cookingTimeMinutes} min
                            </span>
                          </>
                        )}
                      </div>
                      <span
                        className="font-mono font-bold text-emerald-800 dark:text-[#A3E635] tabular-nums"
                        title="Application-generated match score"
                      >
                        {matchBreakdown.totalScore}% Match
                      </span>
                    </div>

                    <h2 className="font-display text-lg font-semibold leading-snug">
                      {recipe.title}
                    </h2>

                    <p className="text-xs text-[#0F2419]/75 dark:text-[#F7F6F2]/75 line-clamp-2 leading-relaxed">
                      {recipe.summary}
                    </p>

                    {/* Match Breakdown Box */}
                    <div className="p-3 rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/10 dark:border-white/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px] text-stone-500 tabular-nums">
                        <span>Overlap: {matchBreakdown.ingredientOverlapScore}%</span>
                        <span>Pref: {matchBreakdown.preferenceMatchScore}%</span>
                        {matchBreakdown.flavorRelationshipScore !== null && (
                          <span>Flavor: {matchBreakdown.flavorRelationshipScore}%</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#0F2419]/80 dark:text-[#F7F6F2]/80 leading-snug">
                        {matchBreakdown.explanation}
                      </p>
                    </div>

                    <ProvenanceBadge provenance={recipe.provenance} compact />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 pb-5 pt-3 border-t border-[#0F2419]/10 dark:border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveRecipe(recipe)}
                    aria-label={saved ? `Unsave ${recipe.title}` : `Save ${recipe.title}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#0F2419]/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{saved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenRecipe(recipe)}
                    className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                  >
                    View Full Recipe
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
