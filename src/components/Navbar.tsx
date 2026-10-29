import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, SlidersHorizontal, X } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { setIsPersonalizeOpen, savedRecipes, preferences } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Flavor Explorer', path: '/flavor-explorer' },
    { label: 'Find Recipes', path: '/find-recipes' },
    { label: 'Fusion Lab', path: '/fusion-lab' },
    { label: 'Ingredient Swap', path: '/ingredient-swap' },
    { label: 'About Project', path: '/about' },
  ];

  const activeFiltersCount =
    (preferences.dietaryPreference !== 'All' ? 1 : 0) +
    preferences.preferredCuisines.length +
    preferences.avoidIngredients.length +
    savedRecipes.length;

  return (
    <header className="sticky top-0 z-40 bg-[#F7F6F2]/95 dark:bg-[#0B1911]/95 backdrop-blur-md border-b border-[#0F2419]/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Brand Title (single text element, one line) */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-[#0F2419] dark:text-[#F7F6F2] whitespace-nowrap shrink-0"
        >
          FlavorFusion
        </Link>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                  isActive
                    ? 'text-[#0F2419] dark:text-[#A3E635] border-b-2 border-[#0F2419] dark:border-[#A3E635] font-semibold'
                    : 'text-[#0F2419]/70 dark:text-[#F7F6F2]/75 hover:text-[#0F2419] dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsPersonalizeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Taste Profile {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-lg text-[#0F2419] dark:text-[#F7F6F2] hover:bg-black/5 dark:hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-[#0F2419]/10 dark:border-white/10 bg-[#F7F6F2] dark:bg-[#0B1911] px-6 py-4 space-y-2"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  isActive
                    ? 'text-[#0F2419] dark:text-[#A3E635] font-semibold'
                    : 'text-[#0F2419]/75 dark:text-[#F7F6F2]/75'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
};
