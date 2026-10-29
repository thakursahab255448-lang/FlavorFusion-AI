import React, { useEffect, useState } from 'react';
import { ApiHealthStatus } from '../types/culinary';

const PITCH_SLIDES = [
  {
    slide: 'Slide 01',
    title: 'Project Introduction — FlavorFusion',
    points: [
      'Tagline: “Discover Flavors. Create Connections. Reinvent Food.”',
      'Built for the Foodoscope Fork It Challenge 2026 by IIIT Delhi (CoSyLab).',
      'Full-stack computational gastronomy platform unifying RecipeDB and FlavorDB.',
    ],
  },
  {
    slide: 'Slide 02',
    title: 'Problem Statement',
    points: [
      'Home cooks and food innovators struggle to pair unfamiliar ingredients or cook from partial pantries.',
      'Existing recipe sites rely on keyword matching rather than underlying chemical aroma compatibility.',
      'Dietary substitutions often fail because they ignore functional culinary roles and volatile flavor shifts.',
    ],
  },
  {
    slide: 'Slide 03',
    title: 'Proposed Solution',
    points: [
      'Graph-driven culinary intelligence linking RecipeDB preparation templates with FlavorDB aroma compounds.',
      'Explainable 60/25/15 ranking engine that scores ingredient overlap, dietary preferences, and molecular bridges.',
      'Strict provenance labelling separating verified API data from application formulas and AI synthesis.',
    ],
  },
  {
    slide: 'Slide 04',
    title: 'Main Features',
    points: [
      '1. Flavor Explorer: Multi-ingredient 6-axis sensory radar & shared compound overlap (Allicin, Linalool, Safranal).',
      '2. Smart Recipe Finder: Pantry-based search with dietary/exclusion filters and match score breakdowns.',
      '3. Fusion Lab & 4. Smart Ingredient Swap: Rule-based + optional Gemini AI cross-cultural dish synthesis & role-matched substitutes.',
    ],
  },
  {
    slide: 'Slide 05',
    title: 'Technology Stack & Actual API Endpoints',
    points: [
      'Frontend: React 19, TypeScript, Tailwind CSS, Recharts, React Router, Lucide Icons.',
      'Backend: Node.js + Express (`server.ts`) with TTL caching (`server/cache.ts`) and dedicated service adapters.',
      'Endpoints: Foodoscope `https://api.foodoscope.com/recipe2-api`, `https://api.foodoscope.com/flavordb`, and CoSyLab `https://cosylab.iiitd.edu.in/flavordb/entities_json?id={id}`.',
    ],
  },
  {
    slide: 'Slide 06',
    title: 'Differentiation, Feasibility & Scalability',
    points: [
      'Zero black-box hallucinations: Every score discloses its exact weighting formula.',
      'Graceful degradation: Works seamlessly with live Foodoscope Bearer tokens, CoSyLab JSON endpoints, or clearly labelled Demo Reference Data.',
      'Stateless server caching reduces upstream API rate-limit pressure.',
    ],
  },
  {
    slide: 'Slide 07',
    title: 'Working Demo & Future Scope',
    points: [
      'End-to-end live walkthrough across all 5 core modules on Desktop and Mobile.',
      'Future Scope: Quantitative gas-chromatography concentration weighting, regional Indian dialect ingredient NLP, and SpiceRx biomedical links.',
    ],
  },
];

export const AboutProjectPage: React.FC = () => {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-[#0F2419]/10 dark:border-white/10 pb-6">
        <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
          HACKATHON DELIVERABLES · ARCHITECTURE & DOCUMENTATION
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">
          About FlavorFusion — IIIT Delhi Fork It Challenge 2026
        </h1>
        <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 mt-1 max-w-3xl">
          Complete technical architecture, Foodoscope API adapter documentation, QA verification
          report, 3–5 minute judge demonstration script, and 7-slide presentation outline.
        </p>
      </div>

      {/* 1. System Architecture Diagram */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-4">
        <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
          01. TECHNICAL ARCHITECTURE
        </div>
        <h2 className="font-display text-2xl font-semibold">
          End-to-End Data & Recommendation Pipeline
        </h2>
        <pre className="p-5 rounded-xl bg-[#0F2419] text-[#D6E2DA] font-mono text-xs overflow-x-auto leading-relaxed">
{`[User Interface: React 19 + TypeScript + Recharts + Tailwind CSS]
       │  (REST JSON Requests + LocalStorage Taste Profile)
       ▼
[Express Backend Gateway (server.ts)]
       ├── Input Validation, Timeout Guards (3.5s - 4.0s) & Central Error Handler
       ├── Rate-Limit-Aware In-Memory TTL Cache (server/cache.ts)
       │
       ├──► RecipeDB Service Adapter (server/services/recipeDbService.ts)
       │      ├─ Primary: https://api.foodoscope.com/recipe2-api (Bearer Token)
       │      └─ Fallback: Clearly Labelled RecipeDB Schema Reference Dataset
       │
       ├──► FlavorDB Service Adapter (server/services/flavorDbService.ts)
       │      ├─ Primary: https://api.foodoscope.com/flavordb (Bearer Token)
       │      ├─ Secondary: https://cosylab.iiitd.edu.in/flavordb/entities_json?id={id}
       │      └─ Fallback: Clearly Labelled FlavorDB Entity & Molecule Reference Dataset
       │
       └──► Intelligent Recommendation & Synthesis Engine (src/utils/recommendationEngine.ts)
              ├─ Ingredient Canonicalization & Synonym Resolution
              ├─ 60% Overlap + 25% Preference + 15% Molecular Bridge Scorer
              ├─ Rule-Based + Optional Server-Side Gemini 3.8 Flash Fusion Synthesizer
              └─ Functional Role & Aroma Compound Substitute Analyzer`}
        </pre>
      </section>

      {/* 2. Live Backend & API Adapter Inspection */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
              02. API INTEGRATION & ADAPTER STATUS
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Backend Routes & Upstream Service Health
            </h2>
          </div>
          {health && (
            <span className="text-xs font-mono text-stone-500 tabular-nums">
              Cache Hits: {health.cacheStats.hits} · Entries: {health.cacheStats.entries}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#0F2419]/15 dark:border-white/15 text-stone-500">
                <th className="py-2.5 pr-4 font-semibold">Application Route</th>
                <th className="py-2.5 px-4 font-semibold">Method</th>
                <th className="py-2.5 px-4 font-semibold">Upstream Adapter / Logic</th>
                <th className="py-2.5 pl-4 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F2419]/10 dark:divide-white/10 font-mono">
              <tr>
                <td className="py-2.5 pr-4">/api/health</td>
                <td className="py-2.5 px-4">GET</td>
                <td className="py-2.5 px-4">All Service Adapters + Cache</td>
                <td className="py-2.5 pl-4 font-sans">Reports live vs demo status and cache metrics</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">/api/flavors/search</td>
                <td className="py-2.5 px-4">GET</td>
                <td className="py-2.5 px-4">flavorDbService.ts</td>
                <td className="py-2.5 pl-4 font-sans">Searches FlavorDB entities, synonyms, and molecules</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">/api/flavors/entity/:id</td>
                <td className="py-2.5 px-4">GET</td>
                <td className="py-2.5 px-4">Foodoscope / CoSyLab entities_json</td>
                <td className="py-2.5 pl-4 font-sans">Fetches entity by numeric FlavorDB ID (e.g., 356)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">/api/flavors/pairings</td>
                <td className="py-2.5 px-4">POST</td>
                <td className="py-2.5 px-4">compareIngredients()</td>
                <td className="py-2.5 pl-4 font-sans">Computes shared aroma compounds & 6-axis sensory vectors</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">/api/recipes/search</td>
                <td className="py-2.5 px-4">GET</td>
                <td className="py-2.5 px-4">recipeDbService + scoreAndRankRecipes()</td>
                <td className="py-2.5 pl-4 font-sans">Ranks recipes using 60/25/15 formula & exclusions</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">/api/fusion/generate</td>
                <td className="py-2.5 px-4">POST</td>
                <td className="py-2.5 px-4">Rule Engine + geminiService.ts</td>
                <td className="py-2.5 pl-4 font-sans">Generates candidate fusion recipes grounded in API data</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">/api/ingredients/substitutes</td>
                <td className="py-2.5 px-4">POST</td>
                <td className="py-2.5 px-4">findIngredientSubstitutes()</td>
                <td className="py-2.5 pl-4 font-sans">Identifies role- and molecule-matched alternatives</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Seven-Slide Hackathon Presentation Outline */}
      <section className="space-y-4">
        <div>
          <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
            03. SEVEN-SLIDE PITCH DECK OUTLINE
          </div>
          <h2 className="font-display text-2xl font-semibold">
            IIIT Delhi Fork It Challenge Presentation Deck
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PITCH_SLIDES.map((s) => (
            <div
              key={s.slide}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-3"
            >
              <div className="text-xs font-mono font-semibold text-emerald-800 dark:text-[#A3E635]">
                {s.slide}
              </div>
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <ul className="space-y-1.5 text-xs text-[#0F2419]/80 dark:text-[#F7F6F2]/80 list-disc pl-4">
                {s.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 3-5 Minute Video Demo Flow & QA Test Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-4">
          <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
            04. DEMONSTRATION FLOW (3–5 MINUTE JUDGE WALKTHROUGH)
          </div>
          <h2 className="font-display text-xl font-semibold">
            Step-by-Step Live Pitch Script
          </h2>
          <ol className="space-y-3 text-xs leading-relaxed text-[#0F2419]/85 dark:text-[#F7F6F2]/85">
            <li>
              <strong>0:00 – 0:45 (Home & Problem Framing):</strong> Introduce FlavorFusion on the
              Homepage, highlight the Foodoscope adapter status, and enter <em>Garlic</em> in the
              hero search bar.
            </li>
            <li>
              <strong>0:45 – 1:45 (Flavor Explorer):</strong> Compare <em>Garlic</em> with{' '}
              <em>Ginger</em> and <em>Tomato</em>. Point out the 6-axis sensory radar chart, the
              shared <em>Linalool</em> aroma bridge in the molecule table, and the transparent
              55/30/15 compatibility formula disclosure. Test fetching Entity #356 directly.
            </li>
            <li>
              <strong>1:45 – 2:45 (Smart Recipe Finder):</strong> Open Find Recipes, toggle pantry
              ingredients (<em>Garlic, Tomato, Saffron</em>), set diet to <em>Vegetarian</em>,
              inspect the 60/25/15 match breakdown on <em>Golden Saffron & Heirloom Tomato Risotto</em>,
              and open the full recipe modal to copy/save it.
            </li>
            <li>
              <strong>2:45 – 3:45 (Fusion Lab):</strong> Combine <em>Paneer + Basil + Saffron</em>{' '}
              under <em>Indo-Italian</em> direction. Show how shared compounds bridge the cuisines
              and how candidate ideas are honestly labelled.
            </li>
            <li>
              <strong>3:45 – 4:30 (Ingredient Swap & Personalization):</strong> Swap <em>Butter</em>{' '}
              under a <em>Vegan</em> filter to reveal <em>Olive Oil</em> and <em>Coconut Milk</em>{' '}
              with taste shift notes and allergen disclaimers.
            </li>
          </ol>
        </section>

        <section className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-4">
          <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
            05. QA TEST REPORT & KNOWN LIMITATIONS
          </div>
          <h2 className="font-display text-xl font-semibold">
            Verified Features & Credential Requirements
          </h2>
          <div className="space-y-3 text-xs leading-relaxed text-[#0F2419]/85 dark:text-[#F7F6F2]/85">
            <div>
              <strong>Verified via Automated Unit Tests (`node:test`) & Browser Checks:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Ingredient canonicalization & plural/synonym normalization (`recommendationEngine.test.ts`).</li>
                <li>Cosine sensory alignment & Jaccard compound overlap calculations.</li>
                <li>60/25/15 recipe ranking formula & dynamic re-weighting when flavor queries are empty.</li>
                <li>Dietary & exclusion filtering, empty/error states, and responsive mobile/desktop layouts.</li>
                <li>Zero-secret frontend bundle verification (all API keys stay strictly inside Express `server.ts`).</li>
              </ul>
            </div>
            <div>
              <strong>Known Limitations & External API Access:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>
                  Live enterprise queries to `https://api.foodoscope.com/recipe2-api` and
                  `/flavordb` require an active `FOODOSCOPE_API_KEY` Bearer token in `.env`. When
                  not supplied, the backend automatically serves the clearly labelled CoSyLab/Foodoscope
                  Reference Dataset without faking live API success.
                </li>
                <li>
                  Compatibility and suitability scores are transparent application-generated
                  estimates, not clinical or nutritional equivalence guarantees.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
