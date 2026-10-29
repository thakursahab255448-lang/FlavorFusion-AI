import React, { createContext, useContext, useEffect, useState } from 'react';
import { NormalizedRecipe, UserPreferences } from '../types/culinary';

interface PreferencesContextValue {
  preferences: UserPreferences;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  savedRecipes: NormalizedRecipe[];
  toggleSaveRecipe: (recipe: NormalizedRecipe) => void;
  isRecipeSaved: (id: string) => boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isPersonalizeOpen: boolean;
  setIsPersonalizeOpen: (open: boolean) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dietaryPreference: 'All',
  preferredCuisines: [],
  exploreIngredients: ['Garlic', 'Ginger', 'Saffron'],
  avoidIngredients: [],
  preferredCategories: [],
};

const STORAGE_KEY_PREFS = 'flavorfusion_preferences_v1';
const STORAGE_KEY_SAVED = 'flavorfusion_saved_recipes_v1';
const STORAGE_KEY_THEME = 'flavorfusion_dark_mode_v1';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PREFERENCES;
  });

  const [savedRecipes, setSavedRecipes] = useState<NormalizedRecipe[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVED);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) === 'true';
    } catch {
      return false;
    }
  });

  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedRecipes));
    } catch {
      // ignore
    }
  }, [savedRecipes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, String(darkMode));
    } catch {
      // ignore
    }
  }, [darkMode]);

  const updatePreferences = (partial: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const toggleSaveRecipe = (recipe: NormalizedRecipe) => {
    setSavedRecipes((prev) => {
      const exists = prev.some((r) => r.id === recipe.id);
      if (exists) {
        return prev.filter((r) => r.id !== recipe.id);
      }
      return [recipe, ...prev];
    });
  };

  const isRecipeSaved = (id: string) => savedRecipes.some((r) => r.id === id);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        resetPreferences,
        savedRecipes,
        toggleSaveRecipe,
        isRecipeSaved,
        darkMode,
        toggleDarkMode,
        isPersonalizeOpen,
        setIsPersonalizeOpen,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}
