export type DataProvenanceSource =
  | 'live_foodoscope_api'
  | 'cosylab_public_api'
  | 'demo_dataset'
  | 'app_recommendation_engine'
  | 'gemini_ai_synthesis';

export interface DataProvenance {
  source: DataProvenanceSource;
  sourceLabel: string;
  endpointUsed?: string;
  isVerifiedApiData: boolean;
  isDemoFallback: boolean;
  timestamp: string;
  note?: string;
}

export interface FlavorMolecule {
  commonName: string;
  iupacName?: string;
  pubchemId?: string;
  casNumber?: string;
  flavorProfile: string[]; // e.g., ["pungent", "savory", "sulfurous", "umami"]
  functionalGroups: string[]; // e.g., ["organosulfur", "terpene", "aldehyde", "phenol"]
  molecularWeight?: number;
}

export interface SensoryVector {
  umami: number;      // 0 - 100 scale based on documented compound concentration/profile
  sweet: number;
  bitter: number;
  sour: number;
  spicy: number;
  aromatic: number;
}

export interface FlavorEntity {
  entityId: number;
  name: string;
  category: string; // e.g., "Vegetable", "Spice", "Herb", "Dairy", "Fungus", "Fruit", "Grain", "Protein"
  synonyms: string[];
  naturalSource?: string;
  molecules: FlavorMolecule[];
  sensoryVector: SensoryVector;
  culinaryRole: string[]; // e.g., ["aromatic_base", "acid_brightener", "fat_carrier", "umami_anchor", "structural_protein"]
  dietaryFlags: {
    isVegetarian: boolean;
    isVegan: boolean;
    commonAllergens: string[];
  };
  documentedPairings: string[];
  provenance: DataProvenance;
}

export interface IngredientComparisonResult {
  primaryIngredient: FlavorEntity;
  comparedIngredients: FlavorEntity[];
  sharedMolecules: {
    molecule: FlavorMolecule;
    presentIn: string[];
  }[];
  pairwiseAnalyses: {
    ingredientA: string;
    ingredientB: string;
    sharedMoleculeCount: number;
    totalUniqueMolecules: number;
    jaccardOverlapPercent: number;
    sensoryAlignmentScore: number;
    estimatedCompatibilityScore: number;
    formulaExplanation: string;
    sharedCompoundNames: string[];
    synergyClassification: 'High Molecular Synergy' | 'Moderate Bridge Pairing' | 'Contrasting Balance';
    relationshipExplanation: string;
  }[];
  provenance: DataProvenance;
}

export interface RecipeIngredientItem {
  name: string;
  quantity?: string;
  unit?: string;
  preparation?: string;
  normalizedName: string;
}

export interface NormalizedRecipe {
  id: string;
  title: string;
  cuisine: string;
  region?: string;
  category: string; // e.g., "Main Course", "Starter", "Risotto & Rice", "Noodles & Pasta", "Soup & Broth"
  dietaryType: 'Vegetarian' | 'Vegan' | 'Non-Vegetarian';
  cookingTimeMinutes: number | null; // null if not reliably available
  servings: number | null;
  summary: string;
  ingredients: RecipeIngredientItem[];
  instructions: string[];
  keyFlavorNotes: string[];
  imageUrl?: string;
  visualTheme: 'saffron' | 'emerald' | 'terracotta' | 'plum' | 'citrus' | 'espresso';
  provenance: DataProvenance;
}

export interface ScoredRecipeResult {
  recipe: NormalizedRecipe;
  matchBreakdown: {
    totalScore: number; // 0 - 100
    ingredientOverlapScore: number; // 0 - 100
    preferenceMatchScore: number; // 0 - 100
    flavorRelationshipScore: number | null; // null if flavor data unavailable
    weightsUsed: {
      ingredientWeight: number;
      preferenceWeight: number;
      flavorWeight: number;
    };
    matchedIngredients: string[];
    missingIngredients: string[];
    flavorBridgeIngredients: string[];
    explanation: string;
    formulaDisclosure: string;
  };
}

export interface UserPreferences {
  dietaryPreference: 'All' | 'Vegetarian' | 'Vegan' | 'Non-Vegetarian';
  preferredCuisines: string[];
  exploreIngredients: string[];
  avoidIngredients: string[];
  preferredCategories: string[];
}

export interface FusionRequest {
  baseIngredient: string;
  additionalIngredients: string[];
  targetCuisine: string;
  dietaryPreference: 'All' | 'Vegetarian' | 'Vegan' | 'Non-Vegetarian';
  useAiSynthesis?: boolean;
}

export interface FusionCandidateIdea {
  id: string;
  title: string;
  subtitle: string;
  fusionType: string; // e.g., "Indo-Italian Molecular Bridge", "Japanese-Mediterranean Umami Synthesis"
  dietaryType: 'Vegetarian' | 'Vegan' | 'Non-Vegetarian';
  generationMethod: 'Rule-Based Culinary Engine' | 'AI-Assisted Synthesis (Grounded in FlavorDB + RecipeDB)';
  isVerifiedExistingRecipe: false; // Strictly false per requirements unless confirmed
  molecularBridges: {
    fromIngredient: string;
    toIngredient: string;
    sharedMolecules: string[];
    explanation: string;
  }[];
  whyItWorks: string;
  proposedIngredients: {
    name: string;
    role: string;
    quantityHint: string;
  }[];
  preparationSteps: string[];
  sourceRecipesReferenced: {
    id: string;
    title: string;
    cuisine: string;
  }[];
  scoreBreakdown: {
    overallSynergyScore: number;
    molecularOverlapComponent: number;
    culinaryRoleBalanceComponent: number;
    formulaNote: string;
  };
  provenance: DataProvenance;
}

export interface IngredientSubstituteSuggestion {
  substituteName: string;
  entityId?: number;
  category: string;
  suitabilityScore: number; // Application-generated estimate 0-100
  sharedMolecules: string[];
  sharedCulinaryRoles: string[];
  reasonForSuggestion: string;
  tasteAndTextureImpact: string;
  recommendedRatio: string;
  bestForContexts: string[];
  dietaryFlags: {
    isVegetarian: boolean;
    isVegan: boolean;
    commonAllergens: string[];
  };
}

export interface SubstituteSearchResponse {
  targetIngredient: string;
  targetEntity: FlavorEntity | null;
  cookingContext: string;
  substitutes: IngredientSubstituteSuggestion[];
  allergenAndNutritionDisclaimer: string;
  formulaDisclosure: string;
  provenance: DataProvenance;
}

export interface CocktailItem {
  id: string;
  name: string;
  category: string;
  alcoholic: 'Non-Alcoholic' | 'Alcoholic' | 'Optional';
  glass: string;
  instructions: string;
  ingredients: { name: string; measure: string }[];
  linkedFlavorEntities: string[];
  provenance: DataProvenance;
}

export interface ApiHealthStatus {
  status: 'healthy' | 'degraded';
  mode: 'live_api' | 'hybrid_cosylab' | 'demo_mode';
  services: {
    recipeDb: {
      configured: boolean;
      reachable: boolean;
      baseUrl: string;
      statusMessage: string;
    };
    flavorDb: {
      configured: boolean;
      cosylabPublicReachable: boolean;
      baseUrl: string;
      statusMessage: string;
    };
    geminiAi: {
      configured: boolean;
      model: string;
      statusMessage: string;
    };
    cocktailDb: {
      enabled: boolean;
      baseUrl: string;
      statusMessage: string;
    };
  };
  cacheStats: {
    entries: number;
    hits: number;
    misses: number;
  };
  timestamp: string;
}
