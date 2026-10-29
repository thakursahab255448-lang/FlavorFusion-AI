# FlavorFusion — AI-Powered Culinary Intelligence

> **“Discover Flavors. Create Connections. Reinvent Food.”**  
> Built for the **Foodoscope Fork It Challenge 2026 by IIIT Delhi (CoSyLab)**.

---

## 1. Project Overview

**FlavorFusion** is a full-stack computational gastronomy application that combines **Foodoscope RecipeDB** and **FlavorDB** to help home cooks, chefs, and food innovators:
1. **Explore Flavor Compatibility:** Inspect shared volatile aroma molecules (such as *Allicin*, *Linalool*, *Safranal*, *Zingiberene*, and *Glutamic acid*) and compare 6-dimensional sensory vectors across multiple ingredients.
2. **Find Recipes Intelligently:** Rank candidate recipes using a transparent **60 / 25 / 15 formula** (60% Pantry Overlap + 25% Dietary/Cuisine Preference + 15% Documented FlavorDB Molecular Bridge).
3. **Synthesize Cross-Cultural Fusion Concepts:** Generate candidate fusion dishes in the **Fusion Lab** using deterministic culinary rules (plus optional server-side Gemini 3.8 Flash synthesis grounded strictly in FlavorDB and RecipeDB records).
4. **Discover Smart Ingredient Substitutes:** Identify functional and chemical alternatives in **Ingredient Swap**, complete with expected taste/texture shifts and allergen disclaimers.
5. **Personalize Without Friction:** Filter discovery by Vegetarian, Vegan, or Non-Vegetarian diets, preferred cuisines, and excluded ingredients using lightweight local storage.

---

## 2. System Architecture

```text
[User Interface: React 19 + TypeScript + Tailwind CSS + Recharts + React Router]
       │
       ▼
[Express Backend Gateway (server.ts)]
       ├── Input Validation, Timeout Guards (3.5s - 4.0s) & Error Handling
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
       ├──► Optional CocktailDB Adapter (server/services/cocktailDbService.ts)
       │      └─ Connects botanical culinary ingredients to zero-proof mocktail/drink recipes
       │
       └──► Intelligent Recommendation Engine (src/utils/recommendationEngine.ts)
              ├─ Ingredient Canonicalization & Synonym Resolution
              ├─ 60% Overlap + 25% Preference + 15% Molecular Bridge Scorer
              ├─ Rule-Based + Optional Server-Side Gemini 3.8 Flash Fusion Synthesizer
              └─ Functional Role & Aroma Compound Substitute Analyzer
```

---

## 3. API Integration Documentation

### A. Foodoscope RecipeDB (`server/services/recipeDbService.ts`)
- **Base URL:** `https://api.foodoscope.com/recipe2-api` (configurable via `RECIPEDB_BASE_URL`).
- **Authentication:** Server-side `Authorization: Bearer <FOODOSCOPE_API_KEY>` header.
- **Normalization:** Maps upstream fields (`Recipe_id`, `Recipe_title`, `Region`, `Processes`, `ingredients`, `instructions`) into our `NormalizedRecipe` structure.
- **Honest Fallback:** When `FOODOSCOPE_API_KEY` is unconfigured or upstream times out, the service returns curated RecipeDB schema records explicitly badged with `Demo Data · Reference Schema`.

### B. Foodoscope & CoSyLab FlavorDB (`server/services/flavorDbService.ts`)
- **Enterprise Base URL:** `https://api.foodoscope.com/flavordb` (`FLAVORDB_BASE_URL`).
- **CoSyLab IIIT-Delhi JSON Endpoint:** `https://cosylab.iiitd.edu.in/flavordb/entities_json?id={id}` (`COSYLAB_FLAVORDB_URL`).
- **Normalization:** Extracts `entity_id`, `entity_alias_readable`, `category_readable`, `entity_alias_synonyms`, and `molecules` (common name, PubChem ID, functional groups, flavor profile).

### C. Application Backend Endpoints (`server.ts`)
- `GET /api/health` — Returns adapter status, live vs demo mode indicator, and cache statistics.
- `GET /api/flavors/search?q=<query>` — Searches normalized FlavorDB entities and aroma molecules.
- `GET /api/flavors/entity/:id` — Queries a specific FlavorDB entity by integer ID (e.g., `356` for Garlic).
- `POST /api/flavors/pairings` — Computes multi-ingredient molecular overlap, Jaccard similarity, 6-axis sensory cosine alignment, and compatibility score.
- `GET /api/recipes/search` — Filters and ranks recipes by query, pantry ingredients, diet, cuisine, category, and excluded ingredients.
- `GET /api/recipes/:id` — Retrieves full recipe details and linked FlavorDB entities.
- `POST /api/recommendations` — Full recommendation engine endpoint.
- `POST /api/fusion/generate` — Generates candidate fusion concepts (Rule-Based + optional Gemini AI).
- `POST /api/ingredients/substitutes` — Ranks culinary substitutes with taste-shift notes and allergen warnings.
- `GET /api/cocktails/search` — Optional botanical beverage discovery endpoint.

---

## 4. Local Setup & Installation Instructions

### Prerequisites
- Node.js 20+ and npm

### Step 1: Clone & Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and populate your credentials:
```bash
cp .env.example .env
```
- `FOODOSCOPE_API_KEY`: Your Bearer token from [https://www.foodoscope.com/](https://www.foodoscope.com/).
- `GEMINI_API_KEY`: Optional key for server-side Gemini 3.8 Flash fusion ideation.

### Step 3: Run Unit Tests
```bash
npx --yes tsx --test src/utils/recommendationEngine.test.ts
```

### Step 4: Start the Full-Stack Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Deployment Instructions

1. **Build Frontend Assets:**
   ```bash
   npm run build
   ```
2. **Start Production Server:**
   ```bash
   NODE_ENV=production npm run start
   ```
3. **Hosting Platforms (Cloud Run / Render / Railway):**
   - Set build command to `npm install && npm run build`.
   - Set start command to `npm run start`.
   - Configure `FOODOSCOPE_API_KEY` and `GEMINI_API_KEY` in the platform's secret manager.

---

## 6. Hackathon Deliverables: 3–5 Minute Demo Flow & 7-Slide Pitch Outline

### 3–5 Minute Video Demonstration Script
1. **0:00 – 0:45 (Home & Problem Framing):** Show the FlavorFusion hero, explain the gap between keyword recipe portals and molecular gastronomy, and search `Garlic`.
2. **0:45 – 1:45 (Flavor Explorer):** Compare `Garlic` against `Ginger` and `Tomato`. Highlight the Recharts 6-axis sensory radar chart, the shared `Linalool` compound in the molecule table, and the transparent formula box.
3. **1:45 – 2:45 (Smart Recipe Finder):** Toggle pantry ingredients (`Garlic`, `Tomato`, `Saffron`), filter by `Vegetarian`, inspect the `60 / 25 / 15` match score breakdown on *Golden Saffron & Heirloom Tomato Risotto*, and open the full recipe modal to copy/save it.
4. **2:45 – 3:45 (Fusion Lab):** Select `Paneer` + `Basil` + `Saffron` under `Indo-Italian` fusion. Walk through the documented molecular bridges and candidate execution steps.
5. **3:45 – 4:30 (Ingredient Swap & Taste Profile):** Search substitutes for `Butter` with a `Vegan` filter (`Olive Oil`, `Coconut Milk`), pointing out taste shifts and the mandatory allergen disclaimer.

### 7-Slide Presentation Outline
- **Slide 1 — Project Introduction:** FlavorFusion — AI-Powered Culinary Intelligence (“Discover Flavors. Create Connections. Reinvent Food.”).
- **Slide 2 — Problem Statement:** Rigidity of keyword recipe search, wasted pantry ingredients, and failed dietary substitutions.
- **Slide 3 — Proposed Solution:** Graph-driven culinary intelligence uniting RecipeDB and FlavorDB with explainable formulas.
- **Slide 4 — Main Features:** Flavor Explorer, Smart Recipe Finder, Fusion Lab, Smart Ingredient Swap, and Local Personalization.
- **Slide 5 — Technology Stack & Actual API Endpoints:** React 19, TypeScript, Tailwind CSS, Recharts, Express (`server.ts`), Foodoscope `recipe2-api` & `flavordb`, CoSyLab `entities_json`.
- **Slide 6 — Differentiation, Feasibility & Scalability:** Zero black-box scores, strict provenance badges, TTL caching, and graceful demo fallback.
- **Slide 7 — Working Demo & Future Scope:** Live walkthrough + roadmap for gas-chromatography concentration weighting and SpiceRx health integration.
