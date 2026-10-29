import {
  FlavorEntity,
  FlavorMolecule,
  FusionCandidateIdea,
  FusionRequest,
  IngredientComparisonResult,
  IngredientSubstituteSuggestion,
  NormalizedRecipe,
  ScoredRecipeResult,
  SensoryVector,
  SubstituteSearchResponse,
  UserPreferences,
} from '../types/culinary';

/**
 * Normalizes an ingredient string by stripping punctuation, quantities,
 * parenthetical notes, and converting common plural forms to singular.
 */
export function normalizeIngredientName(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\b(fresh|dried|organic|chopped|minced|sliced|diced|grated|crushed|ground|whole|extra|virgin|raw|roasted|toasted|leaves|cloves|pods|threads|seeds|powder|paste|extract)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common culinary plural/synonym canonicalization
  const aliasMap: Record<string, string> = {
    tomatoes: 'tomato',
    cherry_tomatoes: 'tomato',
    'cherry tomatoes': 'tomato',
    'heirloom tomatoes': 'tomato',
    potatoes: 'potato',
    onions: 'onion',
    'red onion': 'onion',
    'spring onions': 'scallion',
    scallions: 'scallion',
    mushrooms: 'mushroom',
    'shiitake mushrooms': 'shiitake mushroom',
    shiitake: 'shiitake mushroom',
    'olive oil': 'olive oil',
    chilies: 'chili pepper',
    chillies: 'chili pepper',
    'red chili': 'chili pepper',
    'chili flakes': 'chili pepper',
    coriander: 'cilantro',
    dhaniya: 'cilantro',
    curd: 'yogurt',
    dahi: 'yogurt',
    cottage_cheese: 'paneer',
    'cottage cheese': 'paneer',
    parmigiano: 'parmesan',
    'parmesan cheese': 'parmesan',
    lemons: 'lemon',
    limes: 'lime',
  };

  if (aliasMap[cleaned]) {
    return aliasMap[cleaned];
  }

  if (cleaned.endsWith('ies') && cleaned.length > 4) {
    cleaned = cleaned.slice(0, -3) + 'y';
  } else if (cleaned.endsWith('oes') && cleaned.length > 4) {
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.endsWith('s') && !cleaned.endsWith('ss') && cleaned.length > 3) {
    cleaned = cleaned.slice(0, -1);
  }

  if (aliasMap[cleaned]) {
    return aliasMap[cleaned];
  }

  return cleaned;
}

/**
 * Computes cosine similarity (0-100) between two 6-dimensional sensory vectors.
 */
export function computeSensoryAlignment(vecA: SensoryVector, vecB: SensoryVector): number {
  const keys: (keyof SensoryVector)[] = ['umami', 'sweet', 'bitter', 'sour', 'spicy', 'aromatic'];
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const k of keys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  const cosine = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return Math.round(Math.max(0, Math.min(1, cosine)) * 100);
}

/**
 * Compares a primary ingredient against one or more comparison ingredients,
 * calculating shared flavor molecules, Jaccard chemical overlap, sensory vector alignment,
 * and an explicit application-generated compatibility estimate.
 */
export function compareIngredients(
  primary: FlavorEntity,
  compared: FlavorEntity[]
): IngredientComparisonResult {
  const allEntities = [primary, ...compared];
  const moleculePresenceMap = new Map<string, { molecule: FlavorMolecule; presentIn: Set<string> }>();

  for (const entity of allEntities) {
    for (const mol of entity.molecules) {
      const key = mol.commonName.toLowerCase();
      if (!moleculePresenceMap.has(key)) {
        moleculePresenceMap.set(key, { molecule: mol, presentIn: new Set([entity.name]) });
      } else {
        moleculePresenceMap.get(key)!.presentIn.add(entity.name);
      }
    }
  }

  const sharedMolecules = Array.from(moleculePresenceMap.values())
    .filter((entry) => entry.presentIn.size >= 2)
    .map((entry) => ({
      molecule: entry.molecule,
      presentIn: Array.from(entry.presentIn),
    }))
    .sort((a, b) => b.presentIn.length - a.presentIn.length);

  const pairwiseAnalyses = compared.map((target) => {
    const primaryMols = new Map(primary.molecules.map((m) => [m.commonName.toLowerCase(), m]));
    const targetMols = new Map(target.molecules.map((m) => [m.commonName.toLowerCase(), m]));

    const sharedNames: string[] = [];
    for (const [key, mol] of primaryMols.entries()) {
      if (targetMols.has(key)) {
        sharedNames.push(mol.commonName);
      }
    }

    const unionSize = new Set([...primaryMols.keys(), ...targetMols.keys()]).size;
    const jaccardPercent = unionSize > 0 ? Math.round((sharedNames.length / unionSize) * 100) : 0;
    const sensoryAlignment = computeSensoryAlignment(primary.sensoryVector, target.sensoryVector);

    const documentedBonus =
      primary.documentedPairings.some(
        (p) => normalizeIngredientName(p) === normalizeIngredientName(target.name)
      ) ||
      target.documentedPairings.some(
        (p) => normalizeIngredientName(p) === normalizeIngredientName(primary.name)
      )
        ? 15
        : 0;

    // Application-generated compatibility estimate formula:
    // 55% normalized molecular overlap (scaled where >= 3 shared key aroma compounds reaches high molecular bridge)
    // + 30% sensory vector cosine alignment + 15% documented culinary pairing bonus
    const molecularBridgeComponent = Math.min(100, Math.round((sharedNames.length / Math.max(1, Math.min(primaryMols.size, targetMols.size))) * 100));
    const rawEstimate = Math.round(
      0.55 * molecularBridgeComponent + 0.30 * sensoryAlignment + documentedBonus
    );
    const estimatedCompatibilityScore = Math.max(5, Math.min(99, rawEstimate));

    let synergyClassification: 'High Molecular Synergy' | 'Moderate Bridge Pairing' | 'Contrasting Balance' =
      'Contrasting Balance';
    if (sharedNames.length >= 2 || estimatedCompatibilityScore >= 72) {
      synergyClassification = 'High Molecular Synergy';
    } else if (sharedNames.length === 1 || estimatedCompatibilityScore >= 48) {
      synergyClassification = 'Moderate Bridge Pairing';
    }

    const relationshipExplanation =
      sharedNames.length > 0
        ? `${primary.name} and ${target.name} share ${sharedNames.length} documented flavor compound${sharedNames.length > 1 ? 's' : ''} (${sharedNames.join(', ')}), creating an aromatic bridge across their ${primary.category.toLowerCase()} and ${target.category.toLowerCase()} profiles.`
        : `${primary.name} and ${target.name} have no overlapping primary aroma compounds in the current dataset, functioning instead as a contrasting sensory pairing (${sensoryAlignment}% taste profile alignment).`;

    return {
      ingredientA: primary.name,
      ingredientB: target.name,
      sharedMoleculeCount: sharedNames.length,
      totalUniqueMolecules: unionSize,
      jaccardOverlapPercent: jaccardPercent,
      sensoryAlignmentScore: sensoryAlignment,
      estimatedCompatibilityScore,
      formulaExplanation:
        'Application-Generated Estimate = 55% Directional Compound Overlap + 30% Sensory Vector Cosine Similarity + 15% Documented Culinary Co-occurrence (Not an official FlavorDB score).',
      sharedCompoundNames: sharedNames,
      synergyClassification,
      relationshipExplanation,
    };
  });

  return {
    primaryIngredient: primary,
    comparedIngredients: compared,
    sharedMolecules,
    pairwiseAnalyses,
    provenance: {
      source: primary.provenance.source,
      sourceLabel: `${primary.provenance.sourceLabel} + FlavorFusion Compatibility Engine`,
      isVerifiedApiData: primary.provenance.isVerifiedApiData,
      isDemoFallback: primary.provenance.isDemoFallback,
      timestamp: new Date().toISOString(),
      note: 'Molecular lists originate from FlavorDB records; compatibility percentages are calculated by the FlavorFusion application formula.',
    },
  };
}

/**
 * Ranks and explains candidate recipes using the transparent 60/25/15 recommendation formula:
 * - 60% Ingredient Overlap
 * - 25% User Preference Match (Dietary, Cuisine, Category)
 * - 15% Supported Flavor Relationship Match (or dynamically re-weighted to 70% Ingredient + 30% Preference if flavor entities are unavailable).
 */
export function scoreAndRankRecipes(
  recipes: NormalizedRecipe[],
  queryIngredients: string[],
  preferences: UserPreferences,
  flavorEntities: FlavorEntity[],
  searchQuery?: string
): ScoredRecipeResult[] {
  const normalizedQueryIngs = queryIngredients
    .map((i) => normalizeIngredientName(i))
    .filter(Boolean);
  const normalizedAvoid = preferences.avoidIngredients
    .map((i) => normalizeIngredientName(i))
    .filter(Boolean);
  const normalizedExplore = preferences.exploreIngredients
    .map((i) => normalizeIngredientName(i))
    .filter(Boolean);

  const entityByNormName = new Map<string, FlavorEntity>();
  for (const entity of flavorEntities) {
    entityByNormName.set(normalizeIngredientName(entity.name), entity);
    for (const syn of entity.synonyms) {
      entityByNormName.set(normalizeIngredientName(syn), entity);
    }
  }

  // Filter out recipes containing excluded/avoided ingredients or violating strict dietary preference
  const eligibleRecipes = recipes.filter((recipe) => {
    if (preferences.dietaryPreference === 'Vegetarian') {
      if (recipe.dietaryType !== 'Vegetarian' && recipe.dietaryType !== 'Vegan') return false;
    } else if (preferences.dietaryPreference === 'Vegan') {
      if (recipe.dietaryType !== 'Vegan') return false;
    } else if (preferences.dietaryPreference === 'Non-Vegetarian') {
      if (recipe.dietaryType !== 'Non-Vegetarian') return false;
    }

    const recipeIngNorms = recipe.ingredients.map((i) => i.normalizedName || normalizeIngredientName(i.name));
    for (const avoid of normalizedAvoid) {
      if (recipeIngNorms.some((ri) => ri.includes(avoid) || avoid.includes(ri))) {
        return false;
      }
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = recipe.title.toLowerCase().includes(q);
      const cuisineMatch = recipe.cuisine.toLowerCase().includes(q);
      const summaryMatch = recipe.summary.toLowerCase().includes(q);
      const ingMatch = recipeIngNorms.some((ri) => ri.includes(normalizeIngredientName(q)));
      if (!titleMatch && !cuisineMatch && !summaryMatch && !ingMatch) {
        return false;
      }
    }

    return true;
  });

  const hasFlavorData = flavorEntities.length > 0 && normalizedQueryIngs.length > 0;

  return eligibleRecipes
    .map((recipe) => {
      const recipeIngNorms = recipe.ingredients.map(
        (i) => i.normalizedName || normalizeIngredientName(i.name)
      );

      // 1. Ingredient Overlap Score (0-100)
      const matchedIngredients: string[] = [];
      const missingIngredients: string[] = [];

      for (const recIng of recipe.ingredients) {
        const norm = recIng.normalizedName || normalizeIngredientName(recIng.name);
        const isMatched = normalizedQueryIngs.some(
          (qi) => norm === qi || norm.includes(qi) || qi.includes(norm)
        );
        if (isMatched) {
          matchedIngredients.push(recIng.name);
        } else {
          missingIngredients.push(recIng.name);
        }
      }

      let ingredientOverlapScore = 0;
      if (normalizedQueryIngs.length > 0) {
        const userQueryHits = normalizedQueryIngs.filter((qi) =>
          recipeIngNorms.some((rn) => rn === qi || rn.includes(qi) || qi.includes(rn))
        ).length;
        const queryCoverage = userQueryHits / normalizedQueryIngs.length;
        const recipeCoverage = matchedIngredients.length / Math.max(1, recipe.ingredients.length);
        ingredientOverlapScore = Math.round((0.7 * queryCoverage + 0.3 * recipeCoverage) * 100);
      } else {
        // When browsing without specific pantry ingredients, check overlap with user's explore list
        if (normalizedExplore.length > 0) {
          const exploreHits = normalizedExplore.filter((ei) =>
            recipeIngNorms.some((rn) => rn === ei || rn.includes(ei))
          ).length;
          ingredientOverlapScore = Math.min(100, 65 + Math.round((exploreHits / normalizedExplore.length) * 35));
        } else {
          ingredientOverlapScore = 75;
        }
      }

      // 2. Preference Match Score (0-100)
      let preferencePoints = 60; // Base score for passing dietary filter
      if (
        preferences.preferredCuisines.length === 0 ||
        preferences.preferredCuisines.some((c) => c.toLowerCase() === recipe.cuisine.toLowerCase())
      ) {
        preferencePoints += 25;
      }
      if (
        preferences.preferredCategories.length === 0 ||
        preferences.preferredCategories.some((cat) =>
          recipe.category.toLowerCase().includes(cat.toLowerCase())
        )
      ) {
        preferencePoints += 15;
      }
      const preferenceMatchScore = Math.min(100, preferencePoints);

      // 3. Flavor Relationship Score (0-100 or null)
      let flavorRelationshipScore: number | null = null;
      const flavorBridgeIngredients: string[] = [];

      if (hasFlavorData) {
        const queryEntities = normalizedQueryIngs
          .map((qi) => entityByNormName.get(qi))
          .filter((e): e is FlavorEntity => Boolean(e));

        if (queryEntities.length > 0) {
          const queryMolecules = new Set<string>();
          const queryDocPairings = new Set<string>();
          for (const qe of queryEntities) {
            qe.molecules.forEach((m) => queryMolecules.add(m.commonName.toLowerCase()));
            qe.documentedPairings.forEach((p) => queryDocPairings.add(normalizeIngredientName(p)));
          }

          let bridgeCount = 0;
          for (const recIng of recipe.ingredients) {
            const norm = recIng.normalizedName || normalizeIngredientName(recIng.name);
            if (normalizedQueryIngs.includes(norm)) continue; // Already direct match
            const recEntity = entityByNormName.get(norm);
            const isDocPaired = queryDocPairings.has(norm);
            const sharesMolecule = recEntity
              ? recEntity.molecules.some((m) => queryMolecules.has(m.commonName.toLowerCase()))
              : false;

            if (isDocPaired || sharesMolecule) {
              bridgeCount++;
              flavorBridgeIngredients.push(recIng.name);
            }
          }

          flavorRelationshipScore = Math.min(
            100,
            Math.round(45 + (bridgeCount / Math.max(1, recipe.ingredients.length - matchedIngredients.length)) * 55)
          );
        }
      }

      // Compute final weighted score
      let weightsUsed = {
        ingredientWeight: 0.6,
        preferenceWeight: 0.25,
        flavorWeight: 0.15,
      };
      let totalScore = 0;
      let formulaDisclosure = '';

      if (flavorRelationshipScore !== null) {
        totalScore = Math.round(
          0.6 * ingredientOverlapScore +
            0.25 * preferenceMatchScore +
            0.15 * flavorRelationshipScore
        );
        formulaDisclosure =
          'Application Match Formula: 60% Ingredient Overlap + 25% Dietary/Cuisine Preference + 15% FlavorDB Molecular Bridge.';
      } else {
        weightsUsed = {
          ingredientWeight: 0.7,
          preferenceWeight: 0.3,
          flavorWeight: 0,
        };
        totalScore = Math.round(0.7 * ingredientOverlapScore + 0.3 * preferenceMatchScore);
        formulaDisclosure =
          'Application Match Formula (Adapted — No Flavor Query Active): 70% Ingredient Overlap + 30% Dietary/Cuisine Preference.';
      }

      const explanationParts: string[] = [];
      if (matchedIngredients.length > 0) {
        explanationParts.push(
          `Matches ${matchedIngredients.length} selected ingredient${matchedIngredients.length > 1 ? 's' : ''} (${matchedIngredients.slice(0, 4).join(', ')})`
        );
      }
      if (flavorBridgeIngredients.length > 0) {
        explanationParts.push(
          `contains ${flavorBridgeIngredients.slice(0, 3).join(', ')} which share documented flavor compounds with your selection`
        );
      }
      explanationParts.push(`aligns with ${recipe.dietaryType} ${recipe.cuisine} preferences.`);

      return {
        recipe,
        matchBreakdown: {
          totalScore: Math.max(1, Math.min(100, totalScore)),
          ingredientOverlapScore,
          preferenceMatchScore,
          flavorRelationshipScore,
          weightsUsed,
          matchedIngredients,
          missingIngredients,
          flavorBridgeIngredients,
          explanation: explanationParts.join('; '),
          formulaDisclosure,
        },
      };
    })
    .sort((a, b) => b.matchBreakdown.totalScore - a.matchBreakdown.totalScore);
}

/**
 * Generates transparent rule-based candidate fusion recipe ideas grounded in
 * documented flavor relationships and source recipes from RecipeDB.
 */
export function generateRuleBasedFusionIdeas(
  request: FusionRequest,
  recipes: NormalizedRecipe[],
  flavorEntities: FlavorEntity[]
): FusionCandidateIdea[] {
  const baseNorm = normalizeIngredientName(request.baseIngredient);
  const additionalNorms = request.additionalIngredients
    .map((i) => normalizeIngredientName(i))
    .filter(Boolean);
  const allRequestedNorms = [baseNorm, ...additionalNorms].filter(Boolean);

  const entityMap = new Map<string, FlavorEntity>();
  for (const e of flavorEntities) {
    entityMap.set(normalizeIngredientName(e.name), e);
  }

  const baseEntity =
    entityMap.get(baseNorm) ||
    flavorEntities.find((e) => normalizeIngredientName(e.name).includes(baseNorm)) ||
    flavorEntities[0];

  const partnerEntities = additionalNorms
    .map(
      (n) =>
        entityMap.get(n) ||
        flavorEntities.find((e) => normalizeIngredientName(e.name).includes(n))
    )
    .filter((e): e is FlavorEntity => Boolean(e));

  if (partnerEntities.length === 0 && flavorEntities.length > 1) {
    const fallbackPartner = flavorEntities.find((e) => e.entityId !== baseEntity?.entityId);
    if (fallbackPartner) partnerEntities.push(fallbackPartner);
  }

  // Compute molecular bridges between base and partner ingredients
  const molecularBridges: FusionCandidateIdea['molecularBridges'] = [];
  let totalSharedCompounds = 0;

  if (baseEntity) {
    const baseMols = new Set(baseEntity.molecules.map((m) => m.commonName.toLowerCase()));
    for (const partner of partnerEntities) {
      const shared = partner.molecules
        .filter((m) => baseMols.has(m.commonName.toLowerCase()))
        .map((m) => m.commonName);
      totalSharedCompounds += shared.length;

      molecularBridges.push({
        fromIngredient: baseEntity.name,
        toIngredient: partner.name,
        sharedMolecules: shared.length > 0 ? shared : [baseEntity.molecules[0]?.commonName || 'Aromatic Terpenes'],
        explanation:
          shared.length > 0
            ? `Shared ${shared.join(' & ')} creates a continuous chemical aroma profile between ${baseEntity.name} and ${partner.name}.`
            : `${baseEntity.name} (${baseEntity.culinaryRole[0] || 'base'}) and ${partner.name} (${partner.culinaryRole[0] || 'accent'}) provide complementary taste contrast.`,
      });
    }
  }

  // Find related source recipes from RecipeDB
  const relatedRecipes = recipes
    .filter((r) => {
      if (request.dietaryPreference === 'Vegetarian' && r.dietaryType === 'Non-Vegetarian') return false;
      if (request.dietaryPreference === 'Vegan' && r.dietaryType !== 'Vegan') return false;
      const rIngs = r.ingredients.map((i) => i.normalizedName);
      const matchesIng = allRequestedNorms.some((qn) => rIngs.some((rn) => rn.includes(qn) || qn.includes(rn)));
      const matchesCuisine =
        request.targetCuisine && request.targetCuisine !== 'Any'
          ? r.cuisine.toLowerCase().includes(request.targetCuisine.toLowerCase())
          : false;
      return matchesIng || matchesCuisine;
    })
    .slice(0, 4);

  const sourceRefs = (relatedRecipes.length > 0 ? relatedRecipes : recipes.slice(0, 2)).map((r) => ({
    id: r.id,
    title: r.title,
    cuisine: r.cuisine,
  }));

  const targetCuisineLabel =
    request.targetCuisine && request.targetCuisine !== 'Any' ? request.targetCuisine : 'Modern Cross-Cultural';
  const dietaryLabel: 'Vegetarian' | 'Vegan' | 'Non-Vegetarian' =
    request.dietaryPreference === 'Vegan'
      ? 'Vegan'
      : request.dietaryPreference === 'Non-Vegetarian'
      ? 'Non-Vegetarian'
      : 'Vegetarian';

  const baseDisplay = baseEntity ? baseEntity.name : request.baseIngredient || 'Garlic';
  const partnerDisplay =
    partnerEntities.length > 0
      ? partnerEntities.map((p) => p.name).join(' & ')
      : request.additionalIngredients.join(' & ') || 'Ginger';

  const molComponent = Math.min(100, 62 + totalSharedCompounds * 12);
  const roleComponent = 84;
  const overallSynergy = Math.round(0.6 * molComponent + 0.4 * roleComponent);

  const idea1: FusionCandidateIdea = {
    id: `fusion-rule-1-${Date.now()}`,
    title: `${targetCuisineLabel} ${baseDisplay} & ${partnerDisplay} Glazed Bowl`,
    subtitle: `Candidate fusion concept bridging ${baseDisplay} aromatics with ${targetCuisineLabel} technique`,
    fusionType: `${targetCuisineLabel} Molecular Bridge`,
    dietaryType: dietaryLabel,
    generationMethod: 'Rule-Based Culinary Engine',
    isVerifiedExistingRecipe: false,
    molecularBridges,
    whyItWorks: `Combines the ${baseEntity?.culinaryRole.join('/') || 'savory base'} properties of ${baseDisplay} with ${partnerDisplay}. ${
      molecularBridges[0]?.explanation || ''
    } Grounded in preparation patterns from ${sourceRefs.map((s) => s.title).join(' and ')}.`,
    proposedIngredients: [
      {
        name: baseDisplay,
        role: 'Primary Flavor Anchor',
        quantityHint: '150g / 1 cup prepared',
      },
      ...partnerEntities.map((pe) => ({
        name: pe.name,
        role: `Aromatic Bridge (${pe.molecules[0]?.commonName || 'Flavor Compound'})`,
        quantityHint: '2 tbsp finely prepped',
      })),
      {
        name: dietaryLabel === 'Vegan' ? 'Cold-Pressed Olive or Sesame Oil' : 'Cultured Butter or Ghee',
        role: 'Fat-Soluble Aroma Carrier',
        quantityHint: '1.5 tbsp',
      },
      {
        name: 'Fresh Citrus Zest & Sea Salt',
        role: 'Acid & Mineral Balance',
        quantityHint: 'To taste',
      },
    ],
    preparationSteps: [
      ` Gently bloom ${partnerDisplay} in the fat carrier over medium-low heat for 60–90 seconds to extract fat-soluble volatile aroma molecules without scorching.`,
      `Introduce ${baseDisplay} and sear until caramelized edges develop, building Maillard depth alongside the ${targetCuisineLabel} aromatic base.`,
      `Deglaze the pan with a splash of vegetable stock or citrus reduction to emulsify the shared flavor compounds into a glossy coating.`,
      `Finish with fresh herbs and serve warm, preserving the top-note volatiles identified in FlavorDB.`,
    ],
    sourceRecipesReferenced: sourceRefs,
    scoreBreakdown: {
      overallSynergyScore: overallSynergy,
      molecularOverlapComponent: molComponent,
      culinaryRoleBalanceComponent: roleComponent,
      formulaNote:
        'Application-Generated Synergy Score = 60% Documented Molecular Bridge + 40% Culinary Role Balance (Base + Carrier + Acid + Accent). Candidate idea, not a pre-existing verified recipe.',
    },
    provenance: {
      source: 'app_recommendation_engine',
      sourceLabel: 'FlavorFusion Rule-Based Culinary Synthesis Engine (Grounded in RecipeDB & FlavorDB)',
      isVerifiedApiData: false,
      isDemoFallback: baseEntity ? baseEntity.provenance.isDemoFallback : true,
      timestamp: new Date().toISOString(),
      note: 'Generated by deterministic culinary rules using FlavorDB compound overlap and RecipeDB structural templates.',
    },
  };

  const idea2: FusionCandidateIdea = {
    id: `fusion-rule-2-${Date.now()}`,
    title: `Charred ${baseDisplay} Tartine with Whipped ${partnerDisplay} Emulsion`,
    subtitle: `High-contrast textural synthesis highlighting volatile top notes of ${partnerDisplay}`,
    fusionType: `Contemporary ${targetCuisineLabel} Small Plate`,
    dietaryType: dietaryLabel,
    generationMethod: 'Rule-Based Culinary Engine',
    isVerifiedExistingRecipe: false,
    molecularBridges,
    whyItWorks: `By separating ${baseDisplay} (high-heat roasted component) and ${partnerDisplay} (cool emulsified component), both heat-stable umami compounds and delicate volatile terpenes remain intact on the palate.`,
    proposedIngredients: [
      {
        name: baseDisplay,
        role: 'Roasted Structural Component',
        quantityHint: '200g sliced',
      },
      {
        name: partnerDisplay,
        role: 'Infused Emulsion Accent',
        quantityHint: '2 tbsp',
      },
      {
        name: dietaryLabel === 'Vegan' ? 'Silken Tofu or Cashew Cream' : 'Strained Greek Yogurt / Labneh',
        role: 'Creamy Emulsion Base',
        quantityHint: '1/2 cup',
      },
      {
        name: 'Artisanal Sourdough or Flatbread',
        role: 'Crisp Textural Foundation',
        quantityHint: '2 slices, toasted',
      },
    ],
    preparationSteps: [
      `Roast or char ${baseDisplay} at high heat until tender inside with crisp, smoky edges.`,
      `Whisk ${partnerDisplay} into the chilled creamy emulsion base with a pinch of salt so volatile aroma molecules infuse without thermal degradation.`,
      `Spread the infused emulsion across warm toasted flatbread or sourdough, layer the charred ${baseDisplay} on top, and drizzle with aromatic oil.`,
    ],
    sourceRecipesReferenced: sourceRefs,
    scoreBreakdown: {
      overallSynergyScore: Math.max(60, overallSynergy - 4),
      molecularOverlapComponent: molComponent,
      culinaryRoleBalanceComponent: 80,
      formulaNote:
        'Application-Generated Synergy Score = 60% Documented Molecular Bridge + 40% Culinary Role Balance. Candidate idea, not a pre-existing verified recipe.',
    },
    provenance: {
      source: 'app_recommendation_engine',
      sourceLabel: 'FlavorFusion Rule-Based Culinary Synthesis Engine',
      isVerifiedApiData: false,
      isDemoFallback: baseEntity ? baseEntity.provenance.isDemoFallback : true,
      timestamp: new Date().toISOString(),
    },
  };

  return [idea1, idea2];
}

/**
 * Finds explainable ingredient substitutes using documented flavor compounds,
 * sensory vector similarity, and culinary functional roles.
 */
export function findIngredientSubstitutes(
  targetIngredientName: string,
  cookingContext: string,
  dietaryPreference: 'All' | 'Vegetarian' | 'Vegan' | 'Non-Vegetarian',
  flavorEntities: FlavorEntity[]
): SubstituteSearchResponse {
  const normTarget = normalizeIngredientName(targetIngredientName);
  const targetEntity =
    flavorEntities.find((e) => normalizeIngredientName(e.name) === normTarget) ||
    flavorEntities.find((e) =>
      e.synonyms.some((s) => normalizeIngredientName(s) === normTarget)
    ) ||
    flavorEntities.find((e) => normalizeIngredientName(e.name).includes(normTarget)) ||
    null;

  const disclaimer =
    'IMPORTANT ALLERGEN & NUTRITIONAL NOTICE: Suggested substitutes are ranked by culinary role and flavor molecule similarity, NOT nutritional equivalence or medical safety. Always inspect product labels and verify allergen compatibility (especially dairy, soy, nuts, sesame, and gluten) before consumption.';

  if (!targetEntity) {
    return {
      targetIngredient: targetIngredientName,
      targetEntity: null,
      cookingContext,
      substitutes: [],
      allergenAndNutritionDisclaimer: disclaimer,
      formulaDisclosure:
        'No verified FlavorDB entity matched the queried ingredient.FlavorFusion does not invent unverified substitutes when source data is insufficient.',
      provenance: {
        source: 'app_recommendation_engine',
        sourceLabel: 'FlavorFusion Substitute Analyzer',
        isVerifiedApiData: false,
        isDemoFallback: false,
        timestamp: new Date().toISOString(),
        note: 'Insufficient verified data for the requested ingredient.',
      },
    };
  }

  const targetMols = new Set(targetEntity.molecules.map((m) => m.commonName.toLowerCase()));
  const targetRoles = new Set(targetEntity.culinaryRole);

  const candidates: IngredientSubstituteSuggestion[] = [];

  for (const candidate of flavorEntities) {
    if (candidate.entityId === targetEntity.entityId) continue;

    if (dietaryPreference === 'Vegetarian' && !candidate.dietaryFlags.isVegetarian) continue;
    if (dietaryPreference === 'Vegan' && !candidate.dietaryFlags.isVegan) continue;

    const sharedMolecules = candidate.molecules
      .filter((m) => targetMols.has(m.commonName.toLowerCase()))
      .map((m) => m.commonName);

    const sharedRoles = candidate.culinaryRole.filter((r) => targetRoles.has(r));
    const sensorySim = computeSensoryAlignment(targetEntity.sensoryVector, candidate.sensoryVector);

    // Must share at least one culinary role or shared molecule or belong to a compatible category
    const sameCategory = candidate.category.toLowerCase() === targetEntity.category.toLowerCase();
    if (sharedMolecules.length === 0 && sharedRoles.length === 0 && !sameCategory) {
      continue;
    }

    const roleScore =
      (sharedRoles.length / Math.max(1, targetEntity.culinaryRole.length)) * 100;
    const molScore = Math.min(100, sharedMolecules.length * 35);
    const categoryBonus = sameCategory ? 15 : 0;

    const suitabilityScore = Math.min(
      96,
      Math.round(0.45 * roleScore + 0.35 * sensorySim + 0.20 * molScore + categoryBonus * 0.4)
    );

    if (suitabilityScore < 38) continue;

    // Determine taste shifts
    const diffs: string[] = [];
    if (candidate.sensoryVector.umami - targetEntity.sensoryVector.umami > 15) {
      diffs.push('deeper umami resonance');
    } else if (targetEntity.sensoryVector.umami - candidate.sensoryVector.umami > 15) {
      diffs.push('milder savory depth');
    }
    if (candidate.sensoryVector.spicy - targetEntity.sensoryVector.spicy > 15) {
      diffs.push('higher pungent warmth');
    }
    if (candidate.sensoryVector.sour - targetEntity.sensoryVector.sour > 15) {
      diffs.push('brighter acidity');
    }
    if (candidate.sensoryVector.sweet - targetEntity.sensoryVector.sweet > 15) {
      diffs.push('sweeter finish');
    }

    const shiftText =
      diffs.length > 0
        ? `Introduces ${diffs.join(' and ')} compared to ${targetEntity.name}.`
        : `Closely mirrors the overall sensory balance of ${targetEntity.name}.`;

    const contextSuitability =
      cookingContext && cookingContext !== 'All'
        ? `Well-suited for ${cookingContext.toLowerCase()} applications where ${sharedRoles.join(' & ').replace(/_/g, ' ') || 'aromatic balance'} is needed.`
        : 'Versatile across sautéed, simmered, and finishing applications.';

    candidates.push({
      substituteName: candidate.name,
      entityId: candidate.entityId,
      category: candidate.category,
      suitabilityScore,
      sharedMolecules,
      sharedCulinaryRoles: sharedRoles.map((r) => r.replace(/_/g, ' ')),
      reasonForSuggestion:
        sharedMolecules.length > 0
          ? `Shares documented flavor compound${sharedMolecules.length > 1 ? 's' : ''} (${sharedMolecules.join(', ')}) and performs the ${sharedRoles.map((r) => r.replace(/_/g, ' ')).join(', ') || candidate.category.toLowerCase()} role.`
          : `Matches the ${sharedRoles.map((r) => r.replace(/_/g, ' ')).join(', ')} culinary function with ${sensorySim}% sensory profile alignment.`,
      tasteAndTextureImpact: `${shiftText} ${contextSuitability}`,
      recommendedRatio: '1 : 1 by volume (adjust seasoning to taste)',
      bestForContexts: ['Simmered Sauces & Curries', 'Sauté & Stir-Fry', 'Marinades & Dressings'],
      dietaryFlags: candidate.dietaryFlags,
    });
  }

  candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return {
    targetIngredient: targetEntity.name,
    targetEntity,
    cookingContext,
    substitutes: candidates.slice(0, 5),
    allergenAndNutritionDisclaimer: disclaimer,
    formulaDisclosure:
      'Application-Generated Suitability Estimate = 45% Culinary Role Match + 35% Sensory Vector Alignment + 20% Shared FlavorDB Aroma Compounds.',
    provenance: {
      source: targetEntity.provenance.source,
      sourceLabel: `${targetEntity.provenance.sourceLabel} + FlavorFusion Substitution Engine`,
      isVerifiedApiData: targetEntity.provenance.isVerifiedApiData,
      isDemoFallback: targetEntity.provenance.isDemoFallback,
      timestamp: new Date().toISOString(),
    },
  };
}
