/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { Navbar } from './components/Navbar';
import { PersonalizationModal } from './components/PersonalizationModal';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { HomePage } from './pages/HomePage';
import { FlavorExplorerPage } from './pages/FlavorExplorerPage';
import { FindRecipesPage } from './pages/FindRecipesPage';
import { FusionLabPage } from './pages/FusionLabPage';
import { IngredientSwapPage } from './pages/IngredientSwapPage';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { ApiHealthStatus, NormalizedRecipe } from './types/culinary';

const AppShell: React.FC = () => {
  const { darkMode } = usePreferences();
  const [selectedRecipe, setSelectedRecipe] = useState<NormalizedRecipe | null>(null);
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => {});
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col bg-[#F7F6F2] dark:bg-[#0B1911] text-[#0F2419] dark:text-[#F7F6F2] transition-colors">
        <Navbar />

        {/* Honest API / Demo Data Mode Transparency Strip */}
        <div className="bg-[#E8E6DF] dark:bg-[#11261B] border-b border-[#0F2419]/10 dark:border-white/10 px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-mono font-semibold text-[#0F2419] dark:text-[#A3E635]">
                {health?.mode === 'live_api'
                  ? 'LIVE FOODOSCOPE API MODE'
                  : 'DEMO DATA & COSYLAB ADAPTER MODE'}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="text-[#0F2419]/75 dark:text-[#F7F6F2]/75">
                {health?.mode === 'live_api'
                  ? 'Connected to live RecipeDB and FlavorDB endpoints.'
                  : 'Showing clearly labelled CoSyLab/Foodoscope schema reference dataset (Set FOODOSCOPE_API_KEY in .env for live enterprise queries).'}
              </span>
            </div>
            <Link
              to="/about"
              className="font-medium underline text-[#0F2419] dark:text-[#A3E635] whitespace-nowrap"
            >
              API Docs & Provenance →
            </Link>
          </div>
        </div>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage onOpenRecipe={setSelectedRecipe} />} />
            <Route path="/flavor-explorer" element={<FlavorExplorerPage />} />
            <Route
              path="/find-recipes"
              element={<FindRecipesPage onOpenRecipe={setSelectedRecipe} />}
            />
            <Route path="/fusion-lab" element={<FusionLabPage />} />
            <Route path="/ingredient-swap" element={<IngredientSwapPage />} />
            <Route path="/about" element={<AboutProjectPage />} />
          </Routes>
        </main>

        {/* Quiet Editorial Footer */}
        <footer className="border-t border-[#0F2419]/10 dark:border-white/10 bg-[#F7F6F2] dark:bg-[#0B1911] px-6 py-8 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#0F2419]/70 dark:text-[#F7F6F2]/70">
            <div>
              <span className="font-display font-bold text-[#0F2419] dark:text-[#F7F6F2]">
                FlavorFusion
              </span>
              <span aria-hidden="true"> · </span>
              <span>Discover Flavors. Create Connections. Reinvent Food.</span>
              <span aria-hidden="true"> · </span>
              <span>Foodoscope Fork It Challenge 2026 (IIIT Delhi)</span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <Link to="/flavor-explorer" className="hover:underline">
                Flavor Explorer
              </Link>
              <Link to="/find-recipes" className="hover:underline">
                Find Recipes
              </Link>
              <Link to="/fusion-lab" className="hover:underline">
                Fusion Lab
              </Link>
              <Link to="/ingredient-swap" className="hover:underline">
                Ingredient Swap
              </Link>
              <Link to="/about" className="hover:underline">
                Architecture & Pitch Deck
              </Link>
            </div>
          </div>
        </footer>

        <PersonalizationModal onSelectSavedRecipe={(rec) => setSelectedRecipe(rec)} />
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PreferencesProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </PreferencesProvider>
  );
}
