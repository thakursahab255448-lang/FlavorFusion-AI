import React, { useEffect, useState } from 'react';
import { AlertCircle, FlaskConical, Plus, RefreshCw, Sparkles, X } from 'lucide-react';
import { FlavorEntity, FusionCandidateIdea } from '../types/culinary';
import { usePreferences } from '../context/PreferencesContext';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

const CUISINE_TARGETS = [
  'Indo-Italian',
  'Japanese-Mediterranean',
  'Indo-Japanese',
  'Modern Indian',
  'Mediterranean',
  'Pan-Asian',
];

export const FusionLabPage: React.FC = () => {
  const { preferences } = usePreferences();

  const [entities, setEntities] = useState<FlavorEntity[]>([]);
  const [baseIngredient, setBaseIngredient] = useState('Paneer');
  const [additionalIngredients, setAdditionalIngredients] = useState<string[]>([
    'Basil',
    'Saffron',
  ]);
  const [targetCuisine, setTargetCuisine] = useState('Indo-Italian');
  const [dietaryPreference, setDietaryPreference] = useState<
    'All' | 'Vegetarian' | 'Vegan' | 'Non-Vegetarian'
  >(preferences.dietaryPreference === 'All' ? 'Vegetarian' : preferences.dietaryPreference);
  const [useAiSynthesis, setUseAiSynthesis] = useState(false);

  const [ideas, setIdeas] = useState<FusionCandidateIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerateFusion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!baseIngredient.trim()) {
      setError('Please select a base ingredient.');
      return;
    }
    if (additionalIngredients.length === 0) {
      setError('Please select at least one partner ingredient for fusion.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fusion/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseIngredient,
          additionalIngredients,
          targetCuisine,
          dietaryPreference,
          useAiSynthesis,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to synthesize fusion concepts.');
      } else {
        setIdeas(Array.isArray(data?.ideas) ? data.ideas : []);
      }
    } catch {
      setError('Network error while contacting the Fusion Lab engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateFusion();
  }, []);

  const toggleAdditional = (name: string) => {
    if (name === baseIngredient) return;
    if (additionalIngredients.includes(name)) {
      if (additionalIngredients.length > 1) {
        setAdditionalIngredients(additionalIngredients.filter((i) => i !== name));
      }
    } else {
      setAdditionalIngredients([...additionalIngredients, name]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#0F2419]/10 dark:border-white/10 pb-6">
        <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
          CORE FEATURE 03 · EXPLAINABLE CROSS-CULTURAL SYNTHESIS
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Fusion Lab</h1>
        <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 mt-1 max-w-2xl">
          Combine a base ingredient, partner aromatics, a target culinary style, and dietary
          constraints. FlavorFusion identifies documented molecular bridges from FlavorDB, locates
          reference recipes in RecipeDB, and generates transparent candidate fusion concepts.
        </p>
      </div>

      {/* Configuration Panel */}
      <form
        onSubmit={handleGenerateFusion}
        className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Base Ingredient */}
          <div>
            <label
              htmlFor="fusion-base-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2"
            >
              1. Base Ingredient
            </label>
            <select
              id="fusion-base-select"
              value={baseIngredient}
              onChange={(e) => {
                const next = e.target.value;
                setBaseIngredient(next);
                setAdditionalIngredients((prev) =>
                  prev.filter((i) => i !== next).length > 0
                    ? prev.filter((i) => i !== next)
                    : ['Garlic']
                );
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

          {/* 2. Target Cuisine */}
          <div>
            <label
              htmlFor="fusion-cuisine-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2"
            >
              2. Target Fusion Direction
            </label>
            <select
              id="fusion-cuisine-select"
              value={targetCuisine}
              onChange={(e) => setTargetCuisine(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
            >
              {CUISINE_TARGETS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Dietary Preference */}
          <div>
            <label
              htmlFor="fusion-diet-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2"
            >
              3. Dietary Requirement
            </label>
            <select
              id="fusion-diet-select"
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="All">All / Flexible</option>
            </select>
          </div>
        </div>

        {/* Partner Ingredients */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80">
              4. Additional Partner Ingredients (Select 1 or more)
            </span>
            <span className="text-xs font-mono text-stone-500">
              {additionalIngredients.join(' + ')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entities
              .filter((e) => e.name !== baseIngredient)
              .map((ent) => {
                const active = additionalIngredients.includes(ent.name);
                return (
                  <button
                    key={ent.entityId}
                    type="button"
                    onClick={() => toggleAdditional(ent.name)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0F2419] text-[#F7F6F2] border-[#0F2419] dark:bg-[#A3E635] dark:text-[#0B1911] dark:border-[#A3E635]'
                        : 'border-[#0F2419]/15 dark:border-white/15 hover:border-[#0F2419]/40'
                    }`}
                  >
                    {active ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{ent.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Engine Mode & Submit */}
        <div className="pt-4 border-t border-[#0F2419]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={useAiSynthesis}
              onChange={(e) => setUseAiSynthesis(e.target.checked)}
              className="rounded border-stone-400"
            />
            <span className="font-medium">
              Include optional Server-Side Gemini AI Synthesis (Grounded in FlavorDB + RecipeDB)
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-xl hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
          >
            {useAiSynthesis ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <FlaskConical className="w-4 h-4" />
            )}
            <span>{loading ? 'Synthesizing Fusion Concepts...' : 'Synthesize Fusion Concepts'}</span>
          </button>
        </div>
      </form>

      {/* Transparency Warning */}
      <div className="p-4 rounded-xl bg-amber-950/10 dark:bg-amber-400/10 border border-amber-800/20 text-xs text-[#0F2419] dark:text-[#F7F6F2]">
        <strong>Candidate Idea Disclosure:</strong> Fusion Lab concepts are generated candidate
        ideas created by FlavorFusion’s culinary synthesis logic (using documented FlavorDB aroma
        bridges and RecipeDB templates). They are explicitly labelled as candidate ideas and are
        never presented as pre-existing verified traditional recipes.
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-stone-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Mapping molecular bridges and generating fusion candidates...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-900/10 border border-red-800/20 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateFusion()}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-white rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {ideas.map((idea) => (
            <article
              key={idea.id}
              className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-6"
            >
              {/* Top Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#0F2419]/10 dark:border-white/10 pb-5">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
                    CANDIDATE FUSION CONCEPT · {idea.generationMethod.toUpperCase()}
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold">
                    {idea.title}
                  </h2>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{idea.subtitle}</p>
                  <div className="pt-1">
                    <ProvenanceBadge provenance={idea.provenance} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/10 dark:border-white/10 text-right font-mono tabular-nums shrink-0">
                  <div className="text-2xl font-bold text-[#0F2419] dark:text-[#A3E635]">
                    {idea.scoreBreakdown.overallSynergyScore}%
                  </div>
                  <div className="text-[11px] text-stone-500">App Synergy Est.</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Mol: {idea.scoreBreakdown.molecularOverlapComponent}% · Role:{' '}
                    {idea.scoreBreakdown.culinaryRoleBalanceComponent}%
                  </div>
                </div>
              </div>

              {/* Why This Suggestion Was Made + Molecular Bridges */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-3">
                  <h3 className="text-sm font-semibold">Why This Fusion Suggestion Works</h3>
                  <p className="text-sm text-[#0F2419]/80 dark:text-[#F7F6F2]/80 leading-relaxed">
                    {idea.whyItWorks}
                  </p>
                  <div className="text-xs font-mono text-stone-500 pt-1">
                    {idea.scoreBreakdown.formulaNote}
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-3">
                  <h3 className="text-sm font-semibold">Documented FlavorDB Molecular Bridges</h3>
                  <div className="space-y-2.5">
                    {idea.molecularBridges.map((bridge, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/10 dark:border-white/10 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>
                            {bridge.fromIngredient} ↔ {bridge.toIngredient}
                          </span>
                          <span className="font-mono text-emerald-800 dark:text-[#A3E635]">
                            {bridge.sharedMolecules.join(', ')}
                          </span>
                        </div>
                        <p className="text-[#0F2419]/75 dark:text-[#F7F6F2]/75">
                          {bridge.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Proposed Ingredients & Preparation Steps */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-[#0F2419]/10 dark:border-white/10">
                <div className="md:col-span-5 space-y-3">
                  <h3 className="text-sm font-semibold">Proposed Component Matrix</h3>
                  <ul className="space-y-2 text-xs">
                    {idea.proposedIngredients.map((item, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0B1911] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-sm">{item.name}</div>
                          <div className="text-stone-500">{item.role}</div>
                        </div>
                        <span className="font-mono tabular-nums text-stone-600 dark:text-stone-300 shrink-0">
                          {item.quantityHint}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <h3 className="text-sm font-semibold">Candidate Execution Steps</h3>
                  <ol className="space-y-2.5 text-sm">
                    {idea.preparationSteps.map((step, i) => (
                      <li key={i} className="flex gap-3 leading-relaxed">
                        <span className="font-mono text-xs font-semibold text-emerald-800 dark:text-[#A3E635] pt-0.5 tabular-nums shrink-0">
                          0{i + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Referenced Source Recipes */}
                  <div className="pt-4 mt-4 border-t border-[#0F2419]/10 dark:border-white/10">
                    <div className="text-xs font-semibold text-stone-500 mb-1.5">
                      Grounded in Source Recipes from RecipeDB:
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {idea.sourceRecipesReferenced.map((sr) => (
                        <span
                          key={sr.id}
                          className="font-medium text-[#0F2419] dark:text-[#A3E635]"
                        >
                          {sr.title} ({sr.cuisine})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
