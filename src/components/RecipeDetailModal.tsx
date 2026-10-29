import React, { useState } from 'react';
import { Bookmark, Check, Copy, X } from 'lucide-react';
import { NormalizedRecipe } from '../types/culinary';
import { usePreferences } from '../context/PreferencesContext';
import { CulinaryVisual } from './CulinaryVisual';
import { ProvenanceBadge } from './ProvenanceBadge';

interface RecipeDetailModalProps {
  recipe: NormalizedRecipe | null;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const { isRecipeSaved, toggleSaveRecipe } = usePreferences();
  const [copied, setCopied] = useState(false);

  if (!recipe) return null;

  const saved = isRecipeSaved(recipe.id);

  const handleCopyRecipe = async () => {
    const text = [
      `${recipe.title} (${recipe.cuisine} · ${recipe.dietaryType})`,
      recipe.cookingTimeMinutes ? `Cooking Time: ${recipe.cookingTimeMinutes} mins` : '',
      '',
      'Ingredients:',
      ...recipe.ingredients.map(
        (i) => `- ${[i.quantity, i.unit, i.name].filter(Boolean).join(' ')}`
      ),
      '',
      'Cooking Instructions:',
      ...recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`),
      '',
      `Source: ${recipe.provenance.sourceLabel}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-[#F7F6F2] dark:bg-[#0F2419] text-[#0F2419] dark:text-[#F7F6F2] rounded-2xl border border-[#0F2419]/15 dark:border-white/15 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Visual Banner */}
        <div className="relative h-48 sm:h-56 shrink-0">
          <CulinaryVisual
            title={recipe.title}
            subtitle={`${recipe.cuisine} · ${recipe.dietaryType}`}
            theme={recipe.visualTheme}
            imageUrl={recipe.imageUrl}
            molecules={recipe.keyFlavorNotes}
            className="w-full h-full"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recipe details"
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#0F2419]/10 dark:border-white/10 pb-4">
            <div>
              <div className="text-xs text-[#0F2419]/65 dark:text-[#F7F6F2]/70 mb-1">
                <span>{recipe.cuisine}</span>
                <span aria-hidden="true"> · </span>
                <span>{recipe.category}</span>
                <span aria-hidden="true"> · </span>
                <span>{recipe.dietaryType}</span>
                {recipe.cookingTimeMinutes !== null && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{recipe.cookingTimeMinutes} min</span>
                  </>
                )}
              </div>
              <h2 id="recipe-detail-title" className="font-display text-2xl font-semibold">
                {recipe.title}
              </h2>
              <div className="mt-2">
                <ProvenanceBadge provenance={recipe.provenance} />
              </div>
            </div>

            {/* Save & Copy Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleSaveRecipe(recipe)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  saved
                    ? 'bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] border-transparent'
                    : 'border-[#0F2419]/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{saved ? 'Saved' : 'Save Recipe'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRecipe}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#0F2419]/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A3E635]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Recipe</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#0F2419]/85 dark:text-[#F7F6F2]/85">
            {recipe.summary}
          </p>

          {/* Key Flavor Notes */}
          {recipe.keyFlavorNotes.length > 0 && (
            <div className="p-4 rounded-xl bg-[#E8E6DF]/60 dark:bg-white/5 border border-[#0F2419]/10 dark:border-white/10">
              <div className="text-xs font-semibold mb-1">
                Documented Flavor & Aroma Highlights
              </div>
              <div className="text-xs font-mono text-[#0F2419]/80 dark:text-[#A3E635]">
                {recipe.keyFlavorNotes.join('  ·  ')}
              </div>
            </div>
          )}

          {/* Two Column Ingredients + Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-3">
              <h3 className="text-sm font-semibold border-b border-[#0F2419]/10 dark:border-white/10 pb-2">
                Ingredients ({recipe.ingredients.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {recipe.ingredients.map((ing, i) => (
                  <li
                    key={`${ing.name}-${i}`}
                    className="flex items-baseline justify-between gap-2 py-1 border-b border-[#0F2419]/5 dark:border-white/5"
                  >
                    <span className="font-medium">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-xs font-mono text-[#0F2419]/65 dark:text-[#F7F6F2]/65 tabular-nums shrink-0">
                        {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-7 space-y-3">
              <h3 className="text-sm font-semibold border-b border-[#0F2419]/10 dark:border-white/10 pb-2">
                Cooking Instructions
              </h3>
              {recipe.instructions.length > 0 ? (
                <ol className="space-y-3 text-sm">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-3 leading-relaxed">
                      <span className="font-mono text-xs font-semibold text-[#0F2419]/60 dark:text-[#A3E635] pt-0.5 tabular-nums shrink-0">
                        0{idx + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-[#0F2419]/60 dark:text-[#F7F6F2]/60">
                  Detailed step-by-step instructions were not provided by the upstream API record.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
