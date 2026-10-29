import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIngredientName,
  computeSensoryAlignment,
  compareIngredients,
  scoreAndRankRecipes,
  generateRuleBasedFusionIdeas,
  findIngredientSubstitutes,
} from './recommendationEngine';
import { FlavorEntity, NormalizedRecipe, UserPreferences } from '../types/culinary';

const mockProvenance = {
  source: 'demo_dataset' as const,
  sourceLabel: 'Test Dataset',
  isVerifiedApiData: false,
  isDemoFallback: true,
  timestamp: '2026-10-27T00:00:00Z',
};

const sampleEntities: FlavorEntity[] = [
  {
    entityId: 101,
    name: 'Garlic',
    category: 'Vegetable',
    synonyms: ['lasun', 'allium sativum'],
    molecules: [
      { commonName: 'Allicin', flavorProfile: ['pungent', 'savory'], functionalGroups: ['organosulfur'] },
      { commonName: 'Diallyl disulfide', flavorProfile: ['garlic', 'sulfurous'], functionalGroups: ['organosulfur'] },
      { commonName: 'Linalool', flavorProfile: ['floral', 'citrus'], functionalGroups: ['terpene'] },
    ],
    sensoryVector: { umami: 75, sweet: 25, bitter: 20, sour: 10, spicy: 65, aromatic: 95 },
    culinaryRole: ['aromatic_base', 'umami_booster'],
    dietaryFlags: { isVegetarian: true, isVegan: true, commonAllergens: [] },
    documentedPairings: ['Ginger', 'Tomato', 'Olive Oil', 'Basil'],
    provenance: mockProvenance,
  },
  {
    entityId: 102,
    name: 'Ginger',
    category: 'Spice',
    synonyms: ['adrak', 'zingiber officinale'],
    molecules: [
      { commonName: 'Zingiberene', flavorProfile: ['warm', 'spicy'], functionalGroups: ['terpene'] },
      { commonName: 'Linalool', flavorProfile: ['floral', 'citrus'], functionalGroups: ['terpene'] },
      { commonName: 'Cineole', flavorProfile: ['fresh', 'camphoraceous'], functionalGroups: ['terpene'] },
    ],
    sensoryVector: { umami: 40, sweet: 30, bitter: 25, sour: 20, spicy: 85, aromatic: 92 },
    culinaryRole: ['aromatic_base', 'spice_warmth'],
    dietaryFlags: { isVegetarian: true, isVegan: true, commonAllergens: [] },
    documentedPairings: ['Garlic', 'Scallion', 'Miso', 'Mushroom'],
    provenance: mockProvenance,
  },
  {
    entityId: 103,
    name: 'Shallot',
    category: 'Vegetable',
    synonyms: ['allium ascalonicum'],
    molecules: [
      { commonName: 'Allicin', flavorProfile: ['pungent', 'savory'], functionalGroups: ['organosulfur'] },
      { commonName: 'Diallyl disulfide', flavorProfile: ['garlic', 'sulfurous'], functionalGroups: ['organosulfur'] },
    ],
    sensoryVector: { umami: 70, sweet: 45, bitter: 15, sour: 10, spicy: 45, aromatic: 85 },
    culinaryRole: ['aromatic_base', 'umami_booster'],
    dietaryFlags: { isVegetarian: true, isVegan: true, commonAllergens: [] },
    documentedPairings: ['Garlic', 'Butter', 'Mushroom'],
    provenance: mockProvenance,
  },
];

const sampleRecipes: NormalizedRecipe[] = [
  {
    id: 'rec-1',
    title: 'Roasted Garlic & Ginger Stir-Fry',
    cuisine: 'Asian',
    category: 'Main Course',
    dietaryType: 'Vegan',
    cookingTimeMinutes: 25,
    servings: 2,
    summary: 'Aromatic stir-fry featuring garlic and ginger.',
    ingredients: [
      { name: 'Fresh Garlic cloves', normalizedName: 'garlic' },
      { name: 'Minced Ginger', normalizedName: 'ginger' },
      { name: 'Soy Sauce', normalizedName: 'soy sauce' },
    ],
    instructions: ['Heat pan.', 'Stir-fry garlic and ginger.'],
    keyFlavorNotes: ['Savory', 'Pungent'],
    visualTheme: 'emerald',
    provenance: mockProvenance,
  },
  {
    id: 'rec-2',
    title: 'Classic Butter Chicken',
    cuisine: 'Indian',
    category: 'Main Course',
    dietaryType: 'Non-Vegetarian',
    cookingTimeMinutes: 45,
    servings: 4,
    summary: 'Rich tomato and butter curry.',
    ingredients: [
      { name: 'Chicken', normalizedName: 'chicken' },
      { name: 'Butter', normalizedName: 'butter' },
      { name: 'Garlic', normalizedName: 'garlic' },
    ],
    instructions: ['Marinate chicken.', 'Simmer in tomato gravy.'],
    keyFlavorNotes: ['Rich', 'Spiced'],
    visualTheme: 'terracotta',
    provenance: mockProvenance,
  },
];

test('normalizeIngredientName strips descriptors and canonicalizes plurals', () => {
  assert.equal(normalizeIngredientName('Fresh chopped Tomatoes (2 cups)'), 'tomato');
  assert.equal(normalizeIngredientName('Roasted Garlic Cloves'), 'garlic');
  assert.equal(normalizeIngredientName('Extra Virgin Olive Oil'), 'olive oil');
  assert.equal(normalizeIngredientName('Coriander leaves'), 'cilantro');
});

test('computeSensoryAlignment calculates cosine similarity accurately', () => {
  const identical = computeSensoryAlignment(
    sampleEntities[0].sensoryVector,
    sampleEntities[0].sensoryVector
  );
  assert.equal(identical, 100);

  const alignment = computeSensoryAlignment(
    sampleEntities[0].sensoryVector,
    sampleEntities[1].sensoryVector
  );
  assert.ok(alignment > 70 && alignment <= 100);
});

test('compareIngredients identifies shared molecules and calculates transparent formula', () => {
  const result = compareIngredients(sampleEntities[0], [sampleEntities[1]]);
  assert.equal(result.sharedMolecules.length, 1);
  assert.equal(result.sharedMolecules[0].molecule.commonName, 'Linalool');
  assert.equal(result.pairwiseAnalyses.length, 1);
  assert.ok(result.pairwiseAnalyses[0].estimatedCompatibilityScore > 0);
  assert.ok(result.pairwiseAnalyses[0].formulaExplanation.includes('Application-Generated Estimate'));
});

test('scoreAndRankRecipes filters by diet/exclusions and computes 60/25/15 ranking', () => {
  const prefs: UserPreferences = {
    dietaryPreference: 'Vegetarian',
    preferredCuisines: ['Asian'],
    exploreIngredients: [],
    avoidIngredients: [],
    preferredCategories: [],
  };

  const ranked = scoreAndRankRecipes(sampleRecipes, ['Garlic'], prefs, sampleEntities);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].recipe.id, 'rec-1');
  assert.ok(ranked[0].matchBreakdown.totalScore > 60);
  assert.ok(ranked[0].matchBreakdown.flavorBridgeIngredients.includes('Minced Ginger'));
});

test('generateRuleBasedFusionIdeas creates explainable candidate ideas marked non-verified', () => {
  const ideas = generateRuleBasedFusionIdeas(
    {
      baseIngredient: 'Garlic',
      additionalIngredients: ['Ginger'],
      targetCuisine: 'Indo-Italian',
      dietaryPreference: 'Vegetarian',
    },
    sampleRecipes,
    sampleEntities
  );
  assert.ok(ideas.length >= 2);
  assert.equal(ideas[0].isVerifiedExistingRecipe, false);
  assert.ok(ideas[0].molecularBridges.length > 0);
});

test('findIngredientSubstitutes ranks substitutes and includes allergen disclaimer', () => {
  const subResult = findIngredientSubstitutes('Garlic', 'Sauté & Stir-Fry', 'Vegan', sampleEntities);
  assert.equal(subResult.targetIngredient, 'Garlic');
  assert.ok(subResult.substitutes.length >= 1);
  assert.equal(subResult.substitutes[0].substituteName, 'Shallot');
  assert.ok(subResult.allergenAndNutritionDisclaimer.includes('ALLERGEN & NUTRITIONAL NOTICE'));
});
