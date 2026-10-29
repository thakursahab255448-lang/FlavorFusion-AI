import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, FlaskConical, Repeat, Search, Utensils } from 'lucide-react';
import { ApiHealthStatus, NormalizedRecipe } from '../types/culinary';
import { CulinaryVisual } from '../components/CulinaryVisual';
import { usePreferences } from '../context/PreferencesContext';

interface HomePageProps {
  onOpenRecipe: (recipe: NormalizedRecipe) => void;
}

const QUICK_INGREDIENTS = ['Garlic', 'Ginger', 'Saffron', 'Tomato', 'Shiitake Mushroom', 'Basil', 'Paneer', 'Miso'];

export const HomePage: React.FC<HomePageProps> = ({ onOpenRecipe }) => {
  const navigate = useNavigate();
  const { preferences, setIsPersonalizeOpen } = usePreferences();
  const [heroQuery, setHeroQuery] = useState('');
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [featuredRecipes, setFeaturedRecipes] = useState<NormalizedRecipe[]>([]);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => {});

    fetch('/api/recipes/search')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.results)) {
          setFeaturedRecipes(data.results.slice(0, 3).map((item: any) => item.recipe));
        }
      })
      .catch(() => {});
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim() || 'Garlic';
    navigate(`/flavor-explorer?ingredient=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="pt-8 sm:pt-12 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 bg-[#0F2419] text-[#F7F6F2] rounded-2xl p-8 sm:p-10 border border-[#0F2419]">
            <div className="space-y-4">
              <div className="text-xs font-mono text-[#A3E635] tracking-wide">
                FOODOSCOPE FORK IT CHALLENGE 2026 · IIIT DELHI
              </div>
              <h1
                className="font-display text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.12] text-white"
                style={{ textWrap: 'balance' }}
              >
                Discover Flavors. Create Connections. Reinvent Food.
              </h1>
              <p className="text-base text-[#D6E2DA] max-w-2xl leading-relaxed">
                FlavorFusion bridges Foodoscope’s RecipeDB and FlavorDB to map molecular aroma
                compounds, rank recipes by pantry overlap, synthesize explainable cross-cultural
                fusion concepts, and identify reliable ingredient substitutes.
              </p>
            </div>

            {/* Prominent Ingredient Search Box */}
            <div className="pt-2 space-y-3">
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <label htmlFor="hero-ingredient-search" className="sr-only">
                    Search an ingredient or flavor profile
                  </label>
                  <Search
                    className="w-4 h-4 text-[#D6E2DA]/60 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-ingredient-search"
                    type="text"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Enter an ingredient (e.g., Garlic, Saffron, Shiitake, Miso)..."
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-[#163324] text-white placeholder-[#D6E2DA]/55 border border-white/15 focus:outline-none focus:border-[#A3E635]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold bg-[#A3E635] text-[#0B1911] rounded-xl hover:bg-[#bef264] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Explore Flavor Profile
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#D6E2DA]/80">
                <span>Quick jump:</span>
                {QUICK_INGREDIENTS.map((ing) => (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => navigate(`/flavor-explorer?ingredient=${encodeURIComponent(ing)}`)}
                    className="underline decoration-white/30 hover:decoration-[#A3E635] hover:text-[#A3E635] transition-colors cursor-pointer"
                  >
                    {ing}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column Visual Specimen */}
          <div className="lg:col-span-5 flex">
            <CulinaryVisual
              variant="hero"
              theme="emerald"
              title="Molecular Flavor Graph & Recipe Intelligence"
              subtitle="CoSyLab / Foodoscope Schema"
              className="w-full rounded-2xl min-h-[340px] border border-[#0F2419]/15"
            />
          </div>
        </div>
      </section>

      {/* 2. Problem & Solution Statement */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10">
          <div className="space-y-3">
            <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
              01. THE CULINARY CHALLENGE
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Why Traditional Recipe Search Falls Short
            </h2>
            <p className="text-sm text-[#0F2419]/80 dark:text-[#F7F6F2]/80 leading-relaxed">
              Home cooks and culinary R&D teams routinely struggle to discover creative ingredient
              combinations, use partial pantry items without rigid recipe lock-in, adapt dishes
              across global cuisines, or find substitutes when a key ingredient is unavailable—because
              standard recipe portals treat ingredients as isolated text strings rather than chemical
              flavor networks.
            </p>
          </div>
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-[#0F2419]/10 dark:border-white/10 pt-6 md:pt-0 md:pl-8">
            <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
              02. THE FLAVORFUSION SOLUTION
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Explainable Computational Gastronomy
            </h2>
            <p className="text-sm text-[#0F2419]/80 dark:text-[#F7F6F2]/80 leading-relaxed">
              FlavorFusion connects structured recipe steps from <strong>RecipeDB</strong> with
              aroma compound profiles from <strong>FlavorDB</strong> (such as Allicin, Linalool,
              Safranal, and Glutamic acid). Every pairing score, recipe rank, and substitute
              recommendation shows its exact mathematical formula and data provenance.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Core Tools Bento Grid */}
      <section className="px-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
              CORE WORKFLOWS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">
              Four Integrated Culinary Intelligence Engines
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsPersonalizeOpen(true)}
            className="text-xs font-semibold text-[#0F2419] dark:text-[#A3E635] underline cursor-pointer self-start sm:self-auto"
          >
            Active Filter: {preferences.dietaryPreference} Diet · Customize Taste Profile →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Flavor Explorer (col-span-7) */}
          <div className="md:col-span-7 p-7 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>01. FLAVOR COMPATIBILITY EXPLORER</span>
                <span className="font-mono">FlavorDB Entities & Molecules</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">
                Multi-Ingredient Molecular Overlap & Sensory Radar
              </h3>
              <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                Compare two or more ingredients side-by-side. Inspect shared aroma compounds (e.g.,
                Linalool between Garlic, Ginger, and Basil), view 6-axis sensory vectors, and examine
                documented culinary pairings with transparent formula disclosure.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/flavor-explorer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Compass className="w-4 h-4" />
                <span>Open Flavor Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Smart Recipe Finder (col-span-5) */}
          <div className="md:col-span-5 p-7 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>02. SMART RECIPE FINDER</span>
                <span className="font-mono">60 / 25 / 15 Ranking</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">
                Pantry & Flavor-Bridge Recipe Discovery
              </h3>
              <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                Search by dish name, available ingredients, dietary rules, and excluded items.
                Recipes are ranked by 60% ingredient overlap, 25% preference match, and 15%
                documented flavor bridges.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/find-recipes"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Utensils className="w-4 h-4" />
                <span>Find Matching Recipes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Fusion Lab (col-span-5) */}
          <div className="md:col-span-5 p-7 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>03. FUSION LAB</span>
                <span className="font-mono">Rule Engine + Optional AI</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">
                Cross-Cultural Culinary Synthesis
              </h3>
              <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                Combine a base ingredient, partner aromatics, and a target cuisine to synthesize
                candidate fusion dishes grounded in verified RecipeDB templates and shared flavor
                molecules.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/fusion-lab"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Launch Fusion Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Ingredient Swap (col-span-7) */}
          <div className="md:col-span-7 p-7 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>04. SMART INGREDIENT SWAP</span>
                <span className="font-mono">Role + Aroma Matching</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">
                Context-Aware Substitutes & Taste Shift Analysis
              </h3>
              <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                Missing an ingredient or adapting for vegan/dairy-free cooking? Discover ranked
                alternatives based on shared functional roles and aroma molecules, complete with
                expected taste shifts and allergen verification reminders.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/ingredient-swap"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Repeat className="w-4 h-4" />
                <span>Explore Substitutes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Culinary Specimens */}
      {featuredRecipes.length > 0 && (
        <section className="px-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
                RECIPEDB + FLAVORDB SPECIMENS
              </div>
              <h2 className="font-display text-2xl font-semibold">
                Featured Molecular-Mapped Recipes
              </h2>
            </div>
            <Link
              to="/find-recipes"
              className="text-xs font-semibold underline hover:opacity-80 whitespace-nowrap"
            >
              View All Recipes →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRecipes.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <CulinaryVisual
                    title={rec.title}
                    subtitle={rec.cuisine}
                    theme={rec.visualTheme}
                    imageUrl={rec.imageUrl}
                    molecules={rec.keyFlavorNotes}
                    className="h-44"
                  />
                  <div className="p-5 space-y-2">
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      <span>{rec.cuisine}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{rec.dietaryType}</span>
                      {rec.cookingTimeMinutes && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{rec.cookingTimeMinutes} min</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold leading-snug">{rec.title}</h3>
                    <p className="text-xs text-[#0F2419]/75 dark:text-[#F7F6F2]/75 line-clamp-2 leading-relaxed">
                      {rec.summary}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-[#0F2419]/5 dark:border-white/5">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                    {rec.ingredients.length} ingredients
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenRecipe(rec)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    View Full Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. How It Works Pipeline */}
      <section className="px-6 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
            SYSTEM PIPELINE
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">
            How FlavorFusion Processes Culinary Data
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01. Ingest & Normalize',
              title: 'Adapter Layer & Canonicalization',
              desc: 'Queries RecipeDB and FlavorDB via server-side Express adapters, stripping unit noise and mapping regional aliases (e.g., Lasun → Garlic, Coriander → Cilantro).',
            },
            {
              step: '02. Map Aroma Compounds',
              title: 'Molecular Graph Construction',
              desc: 'Extracts shared chemical compounds (Allicin, Linalool, Zingiberene, Glutamic acid) and computes 6-dimensional sensory vectors.',
            },
            {
              step: '03. Rank & Synthesize',
              title: 'Transparent 60 / 25 / 15 Scoring',
              desc: 'Calculates recipe matches using 60% pantry overlap, 25% dietary/cuisine preference, and 15% documented flavor bridge relationships.',
            },
            {
              step: '04. Verify Provenance',
              title: 'Honest Attribution & Disclaimers',
              desc: 'Clearly distinguishes live Foodoscope API responses, CoSyLab JSON records, reference demo data, and application-computed estimates.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-2"
            >
              <div className="text-xs font-mono font-semibold text-emerald-800 dark:text-[#A3E635]">
                {item.step}
              </div>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="text-xs text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Technology & API Integration Status Section */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0F2419]/10 dark:border-white/10 pb-4">
            <div>
              <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                ARCHITECTURE & DATA TRANSPARENCY
              </div>
              <h2 className="font-display text-2xl font-semibold">
                Foodoscope API Adapter Status & Provenance
              </h2>
            </div>
            <Link
              to="/about"
              className="px-4 py-2 text-xs font-semibold border border-[#0F2419]/20 dark:border-white/20 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap self-start"
            >
              View Architecture & Pitch Deck →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1.5">
              <div className="font-semibold text-sm">RecipeDB Adapter (`recipeDbService.ts`)</div>
              <div className="font-mono text-stone-500 dark:text-stone-400">
                Base: {health?.services.recipeDb.baseUrl || 'https://api.foodoscope.com/recipe2-api'}
              </div>
              <p className="text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                {health?.services.recipeDb.statusMessage ||
                  'Configured with server-side Bearer token authentication and transparent fallback to labelled Demo Reference Dataset.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-sm">FlavorDB Adapter (`flavorDbService.ts`)</div>
              <div className="font-mono text-stone-500 dark:text-stone-400">
                Base: {health?.services.flavorDb.baseUrl || 'https://api.foodoscope.com/flavordb'}
              </div>
              <p className="text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                {health?.services.flavorDb.statusMessage ||
                  'Supports both Foodoscope FlavorDB Bearer API and CoSyLab IIIT-Delhi entities_json endpoint.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-sm">Recommendation & Synthesis Engine</div>
              <div className="font-mono text-stone-500 dark:text-stone-400">
                Mode: {health?.services.geminiAi.configured ? 'Rule Engine + Gemini 3.8 Flash' : 'Deterministic Rule Engine'}
              </div>
              <p className="text-[#0F2419]/75 dark:text-[#F7F6F2]/75 leading-relaxed">
                Operates 100% deterministically without requiring generative AI, with optional
                server-side Gemini synthesis grounded in FlavorDB records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0F2419] text-[#F7F6F2] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Ready to Test Molecular Pairings or Synthesize a Fusion Dish?
            </h2>
            <p className="text-sm text-[#D6E2DA]">
              Explore documented aroma compounds in Flavor Explorer or build a custom cross-cultural
              recipe in the Fusion Lab.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/flavor-explorer"
              className="px-5 py-3 text-xs font-semibold bg-[#A3E635] text-[#0B1911] rounded-xl hover:bg-[#bef264] transition-colors whitespace-nowrap"
            >
              Launch Flavor Explorer
            </Link>
            <Link
              to="/fusion-lab"
              className="px-5 py-3 text-xs font-semibold bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Open Fusion Lab
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
