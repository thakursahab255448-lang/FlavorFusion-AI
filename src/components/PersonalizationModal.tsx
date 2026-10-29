import React, { useState } from 'react';
import { Bookmark, Moon, RotateCcw, Sun, Trash2, X } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { NormalizedRecipe } from '../types/culinary';

interface PersonalizationModalProps {
  onSelectSavedRecipe?: (recipe: NormalizedRecipe) => void;
}

const CUISINE_OPTIONS = ['Indian', 'Italian', 'Japanese', 'Mediterranean'];
const CATEGORY_OPTIONS = ['Main Course', 'Starter', 'Risotto & Rice', 'Noodles & Pasta'];
const COMMON_INGREDIENTS = [
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

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  onSelectSavedRecipe,
}) => {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
    savedRecipes,
    toggleSaveRecipe,
    darkMode,
    toggleDarkMode,
    isPersonalizeOpen,
    setIsPersonalizeOpen,
  } = usePreferences();

  const [customAvoid, setCustomAvoid] = useState('');
  const [customExplore, setCustomExplore] = useState('');

  if (!isPersonalizeOpen) return null;

  const toggleItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const handleAddAvoid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customAvoid.trim();
    if (!val) return;
    if (!preferences.avoidIngredients.includes(val)) {
      updatePreferences({ avoidIngredients: [...preferences.avoidIngredients, val] });
    }
    setCustomAvoid('');
  };

  const handleAddExplore = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customExplore.trim();
    if (!val) return;
    if (!preferences.exploreIngredients.includes(val)) {
      updatePreferences({ exploreIngredients: [...preferences.exploreIngredients, val] });
    }
    setCustomExplore('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalize-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg h-full bg-[#F7F6F2] dark:bg-[#0F2419] text-[#0F2419] dark:text-[#F7F6F2] shadow-2xl overflow-y-auto p-6 flex flex-col justify-between border-l border-[#0F2419]/10 dark:border-white/10">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#0F2419]/10 dark:border-white/10 pb-4">
            <div>
              <h2 id="personalize-modal-title" className="font-display text-xl font-semibold">
                Personalized Discovery & Saved Recipes
              </h2>
              <p className="text-xs text-[#0F2419]/65 dark:text-[#F7F6F2]/65 mt-0.5">
                Stored locally in your browser. No account required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPersonalizeOpen(false)}
              aria-label="Close Taste Profile drawer"
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center justify-between py-2 border-b border-[#0F2419]/10 dark:border-white/10">
            <div>
              <div className="text-sm font-semibold">Interface Appearance</div>
              <div className="text-xs text-[#0F2419]/65 dark:text-[#F7F6F2]/65">
                Switch between Warm Botanical Off-White and Deep Forest Dark
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#0F2419]/15 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer whitespace-nowrap shrink-0"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#A3E635]" />
                  <span>Light Surface</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Forest</span>
                </>
              )}
            </button>
          </div>

          {/* 1. Dietary Preference */}
          <div>
            <label className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2">
              Dietary Preference
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#E8E6DF] dark:bg-[#08130D] rounded-lg">
              {(['All', 'Vegetarian', 'Vegan', 'Non-Vegetarian'] as const).map((diet) => (
                <button
                  key={diet}
                  type="button"
                  onClick={() => updatePreferences({ dietaryPreference: diet })}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap truncate ${
                    preferences.dietaryPreference === diet
                      ? 'bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911]'
                      : 'text-[#0F2419]/75 dark:text-[#F7F6F2]/75 hover:text-[#0F2419]'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Preferred Cuisines */}
          <div>
            <label className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2">
              Preferred Cuisines
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => {
                const active = preferences.preferredCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        preferredCuisines: toggleItem(preferences.preferredCuisines, cuisine),
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0F2419] text-[#F7F6F2] border-[#0F2419] dark:bg-[#A3E635] dark:text-[#0B1911] dark:border-[#A3E635]'
                        : 'border-[#0F2419]/15 dark:border-white/15 hover:border-[#0F2419]/40'
                    }`}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Preferred Discovery Categories */}
          <div>
            <label className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2">
              Preferred Dish Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const active = preferences.preferredCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        preferredCategories: toggleItem(preferences.preferredCategories, cat),
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0F2419] text-[#F7F6F2] border-[#0F2419] dark:bg-[#A3E635] dark:text-[#0B1911] dark:border-[#A3E635]'
                        : 'border-[#0F2419]/15 dark:border-white/15 hover:border-[#0F2419]/40'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ingredients to Explore */}
          <div>
            <label
              htmlFor="explore-ing-input"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-1.5"
            >
              Ingredients You Want to Explore
            </label>
            <form onSubmit={handleAddExplore} className="flex gap-2 mb-2">
              <input
                id="explore-ing-input"
                type="text"
                value={customExplore}
                onChange={(e) => setCustomExplore(e.target.value)}
                placeholder="e.g., Saffron, Miso, Basil..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F2419] text-white dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {preferences.exploreIngredients.map((ing) => (
                <button
                  key={ing}
                  type="button"
                  onClick={() =>
                    updatePreferences({
                      exploreIngredients: preferences.exploreIngredients.filter((i) => i !== ing),
                    })
                  }
                  aria-label={`Remove explore ingredient ${ing}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-emerald-900/10 dark:bg-emerald-400/15 text-[#0F2419] dark:text-[#A3E635] cursor-pointer"
                >
                  <span>{ing}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* 5. Ingredients to Avoid / Exclude */}
          <div>
            <label
              htmlFor="avoid-ing-input"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-1.5"
            >
              Ingredients to Avoid (Excludes matching recipes)
            </label>
            <form onSubmit={handleAddAvoid} className="flex gap-2 mb-2">
              <input
                id="avoid-ing-input"
                type="text"
                value={customAvoid}
                onChange={(e) => setCustomAvoid(e.target.value)}
                placeholder="Add ingredient to exclude (e.g., Butter, Paneer)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-red-800 text-white rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Exclude
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_INGREDIENTS.slice(0, 6).map((item) => {
                const isExcluded = preferences.avoidIngredients.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        avoidIngredients: toggleItem(preferences.avoidIngredients, item),
                      })
                    }
                    className={`px-2 py-1 text-xs rounded border cursor-pointer ${
                      isExcluded
                        ? 'bg-red-900/15 border-red-700 text-red-800 dark:text-red-300 font-semibold'
                        : 'border-[#0F2419]/15 dark:border-white/15 opacity-75'
                    }`}
                  >
                    {isExcluded ? `Excluded: ${item}` : `+ Exclude ${item}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Saved Recipes List */}
          <div className="border-t border-[#0F2419]/10 dark:border-white/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" />
                <span>Saved Recipes ({savedRecipes.length})</span>
              </h3>
            </div>
            {savedRecipes.length === 0 ? (
              <p className="text-xs text-[#0F2419]/60 dark:text-[#F7F6F2]/60">
                No saved recipes yet. Click "Save Recipe" on any recipe card or detail modal to bookmark it here.
              </p>
            ) : (
              <div className="space-y-2">
                {savedRecipes.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#0F2419]/10 dark:border-white/10 bg-white dark:bg-[#0B1911]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsPersonalizeOpen(false);
                        onSelectSavedRecipe?.(rec);
                      }}
                      className="text-left text-xs font-medium hover:underline cursor-pointer pr-2"
                    >
                      <div className="font-semibold text-[#0F2419] dark:text-[#F7F6F2]">
                        {rec.title}
                      </div>
                      <div className="text-[#0F2419]/60 dark:text-[#F7F6F2]/60">
                        {rec.cuisine} · {rec.dietaryType}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSaveRecipe(rec)}
                      aria-label={`Remove saved recipe ${rec.title}`}
                      className="p-1.5 text-red-700 dark:text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#0F2419]/10 dark:border-white/10 pt-4 mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetPreferences}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F2419]/75 dark:text-[#F7F6F2]/75 hover:text-[#0F2419] cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPersonalizeOpen(false)}
            className="px-5 py-2 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
