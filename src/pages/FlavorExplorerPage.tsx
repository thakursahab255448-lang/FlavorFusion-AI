import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { AlertCircle, Plus, RefreshCw, Search, X } from 'lucide-react';
import {
  FlavorEntity,
  IngredientComparisonResult,
  SensoryVector,
} from '../types/culinary';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const FlavorExplorerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialIng = searchParams.get('ingredient') || 'Garlic';

  const [allEntities, setAllEntities] = useState<FlavorEntity[]>([]);
  const [primaryName, setPrimaryName] = useState<string>(initialIng);
  const [comparedNames, setComparedNames] = useState<string[]>(['Ginger', 'Tomato']);
  const [searchFilter, setSearchFilter] = useState('');
  const [comparison, setComparison] = useState<IngredientComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLookupId, setLiveLookupId] = useState<string>('');
  const [liveLookupMsg, setLiveLookupMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/flavors/search')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.entities)) {
          setAllEntities(data.entities);
        }
      })
      .catch(() => {});
  }, []);

  const runComparison = async (primary: string, targets: string[]) => {
    if (!primary.trim()) {
      setError('Please select a primary ingredient.');
      return;
    }
    if (targets.length === 0) {
      setError('Please select at least one comparison ingredient.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flavors/pairings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryIngredient: primary,
          comparedIngredients: targets,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not compare selected ingredients.');
        setComparison(null);
      } else {
        setComparison(data);
      }
    } catch {
      setError('Network error while contacting the FlavorDB comparison service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison(primaryName, comparedNames);
  }, [primaryName, comparedNames]);

  const handleToggleCompared = (name: string) => {
    if (name.toLowerCase() === primaryName.toLowerCase()) return;
    if (comparedNames.includes(name)) {
      if (comparedNames.length > 1) {
        setComparedNames(comparedNames.filter((n) => n !== name));
      }
    } else {
      setComparedNames([...comparedNames, name]);
    }
  };

  const handleLookupById = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number(liveLookupId.trim());
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setLiveLookupMsg('Please enter a valid positive integer FlavorDB ID (e.g., 356 for Garlic, 378 for Ginger).');
      return;
    }
    setLiveLookupMsg(`Querying FlavorDB Entity #${idNum}...`);
    try {
      const res = await fetch(`/api/flavors/entity/${idNum}`);
      const data = await res.json();
      if (res.ok && data?.entity) {
        const fetched: FlavorEntity = data.entity;
        setAllEntities((prev) =>
          prev.some((e) => e.entityId === fetched.entityId) ? prev : [fetched, ...prev]
        );
        setPrimaryName(fetched.name);
        setLiveLookupMsg(
          `Loaded "${fetched.name}" (#${fetched.entityId}) via ${fetched.provenance.sourceLabel}.`
        );
      } else {
        setLiveLookupMsg(data?.error || `Entity #${idNum} not found.`);
      }
    } catch {
      setLiveLookupMsg('Failed to query FlavorDB entity endpoint.');
    }
  };

  const filteredEntities = allEntities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.molecules.some((m) => m.commonName.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Build Recharts Radar Data
  const sensoryAxes: { key: keyof SensoryVector; label: string }[] = [
    { key: 'umami', label: 'Umami' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'bitter', label: 'Bitter' },
    { key: 'sour', label: 'Sour' },
    { key: 'spicy', label: 'Spicy' },
    { key: 'aromatic', label: 'Aromatic' },
  ];

  const radarData = comparison
    ? sensoryAxes.map((axis) => {
        const row: Record<string, any> = {
          attribute: axis.label,
          [comparison.primaryIngredient.name]: comparison.primaryIngredient.sensoryVector[axis.key],
        };
        comparison.comparedIngredients.forEach((ci) => {
          row[ci.name] = ci.sensoryVector[axis.key];
        });
        return row;
      })
    : [];

  const barData = comparison
    ? comparison.pairwiseAnalyses.map((pa) => ({
        pair: `${pa.ingredientA} + ${pa.ingredientB}`,
        sharedCompounds: pa.sharedMoleculeCount,
        compatibilityEstimate: pa.estimatedCompatibilityScore,
        sensoryAlignment: pa.sensoryAlignmentScore,
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0F2419]/10 dark:border-white/10 pb-6">
        <div>
          <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">
            CORE FEATURE 01 · FLAVORDB MOLECULAR GRAPH
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            Flavor Compatibility Explorer
          </h1>
          <p className="text-sm text-[#0F2419]/75 dark:text-[#F7F6F2]/75 mt-1 max-w-2xl">
            Inspect documented aroma compounds, compare multi-ingredient sensory vectors, and
            evaluate chemical flavor bridges with full formula transparency.
          </p>
        </div>

        {/* Direct FlavorDB Entity ID Inspector */}
        <form onSubmit={handleLookupById} className="flex items-center gap-2 shrink-0">
          <label htmlFor="flavordb-id-input" className="sr-only">
            FlavorDB Entity ID
          </label>
          <input
            id="flavordb-id-input"
            type="number"
            min={1}
            value={liveLookupId}
            onChange={(e) => setLiveLookupId(e.target.value)}
            placeholder="FlavorDB ID (e.g. 356)"
            className="w-52 px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#0F2419] border border-[#0F2419]/20 dark:border-white/20"
          />
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold bg-[#0F2419] text-[#F7F6F2] dark:bg-[#A3E635] dark:text-[#0B1911] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            Fetch Entity ID
          </button>
        </form>
      </div>

      {liveLookupMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/10 dark:bg-emerald-400/10 border border-emerald-800/20 text-xs font-mono">
          {liveLookupMsg}
        </div>
      )}

      {/* Selection Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Primary & Comparison Selectors */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-5">
          <div>
            <label
              htmlFor="primary-ing-select"
              className="block text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80 mb-2"
            >
              1. Primary Anchor Ingredient
            </label>
            <select
              id="primary-ing-select"
              value={primaryName}
              onChange={(e) => {
                const nextPrimary = e.target.value;
                setPrimaryName(nextPrimary);
                setComparedNames((prev) =>
                  prev.filter((n) => n.toLowerCase() !== nextPrimary.toLowerCase()).length > 0
                    ? prev.filter((n) => n.toLowerCase() !== nextPrimary.toLowerCase())
                    : allEntities
                        .filter((ent) => ent.name !== nextPrimary)
                        .slice(0, 2)
                        .map((ent) => ent.name)
                );
              }}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/20 dark:border-white/20"
            >
              {allEntities.map((ent) => (
                <option key={ent.entityId} value={ent.name}>
                  {ent.name} ({ent.category} · FlavorDB #{ent.entityId})
                </option>
              ))}
            </select>
          </div>

          {/* Search & Toggle Comparison Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="filter-flavor-entities"
                className="text-xs font-semibold text-[#0F2419]/80 dark:text-[#F7F6F2]/80"
              >
                2. Compare With (Select 1 or more)
              </label>
              <span className="text-xs font-mono text-stone-500">
                {comparedNames.length} selected
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-flavor-entities"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by ingredient or molecule (e.g. Linalool)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/15 dark:border-white/15"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
              {filteredEntities
                .filter((e) => e.name.toLowerCase() !== primaryName.toLowerCase())
                .map((ent) => {
                  const isSelected = comparedNames.includes(ent.name);
                  return (
                    <button
                      key={ent.entityId}
                      type="button"
                      onClick={() => handleToggleCompared(ent.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-[#0F2419] text-[#F7F6F2] border-[#0F2419] dark:bg-[#A3E635] dark:text-[#0B1911] dark:border-[#A3E635]'
                          : 'border-[#0F2419]/15 dark:border-white/15 hover:border-[#0F2419]/40'
                      }`}
                    >
                      {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{ent.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Primary Ingredient Summary Card */}
          {comparison && (
            <div className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/10 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>ANCHOR ENTITY #{comparison.primaryIngredient.entityId}</span>
                <span>{comparison.primaryIngredient.category}</span>
              </div>
              <div className="font-display text-lg font-semibold">
                {comparison.primaryIngredient.name}
              </div>
              <div className="text-xs text-[#0F2419]/75 dark:text-[#F7F6F2]/75">
                Synonyms: {comparison.primaryIngredient.synonyms.join(', ') || 'None listed'}
              </div>
              <div className="text-xs text-[#0F2419]/75 dark:text-[#F7F6F2]/75">
                Documented Pairings:{' '}
                <span className="font-medium">
                  {comparison.primaryIngredient.documentedPairings.join(' · ')}
                </span>
              </div>
              <div className="pt-1">
                <ProvenanceBadge provenance={comparison.primaryIngredient.provenance} compact />
              </div>
            </div>
          )}
        </div>

        {/* Right: Sensory Profile Radar & Overlap Charts */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 flex flex-col justify-between space-y-6">
          {loading ? (
            <div className="h-80 flex items-center justify-center text-sm text-stone-500 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Computing molecular overlap and sensory vectors...</span>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-900/10 border border-red-800/20 space-y-3">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-semibold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => runComparison(primaryName, comparedNames)}
                className="px-4 py-2 text-xs font-semibold bg-[#0F2419] text-white rounded-lg cursor-pointer"
              >
                Retry Analysis
              </button>
            </div>
          ) : comparison ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0F2419]/10 dark:border-white/10 pb-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    6-Axis Sensory Profile & Compatibility Comparison
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Comparing {comparison.primaryIngredient.name} against{' '}
                    {comparison.comparedIngredients.map((c) => c.name).join(', ')}
                  </p>
                </div>
                <ProvenanceBadge provenance={comparison.provenance} compact />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* RadarChart */}
                <div className="h-64 w-full" data-testid="flavor-radar-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                      <PolarAngleAxis
                        dataKey="attribute"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      <Radar
                        name={comparison.primaryIngredient.name}
                        dataKey={comparison.primaryIngredient.name}
                        stroke="#15803d"
                        fill="#15803d"
                        fillOpacity={0.35}
                      />
                      {comparison.comparedIngredients.map((ci, idx) => {
                        const colors = ['#d97706', '#2563eb', '#9333ea', '#dc2626'];
                        const color = colors[idx % colors.length];
                        return (
                          <Radar
                            key={ci.entityId}
                            name={ci.name}
                            dataKey={ci.name}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.2}
                          />
                        );
                      })}
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* BarChart of Pairwise Synergy */}
                <div className="h-64 w-full" data-testid="flavor-bar-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                      <XAxis dataKey="pair" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        dataKey="compatibilityEstimate"
                        name="App Compatibility Est. (%)"
                        fill="#0F2419"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="sensoryAlignment"
                        name="Sensory Alignment (%)"
                        fill="#84cc16"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Formula Transparency Notice */}
              <div className="p-3.5 rounded-xl bg-[#F7F6F2] dark:bg-[#0B1911] border border-[#0F2419]/10 dark:border-white/10 text-xs space-y-1">
                <div className="font-semibold text-[#0F2419] dark:text-[#A3E635]">
                  Formula Disclosure (Application-Generated Estimate)
                </div>
                <p className="text-[#0F2419]/75 dark:text-[#F7F6F2]/75 font-mono">
                  {comparison.pairwiseAnalyses[0]?.formulaExplanation}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Pairwise Relationship Explanations & Shared Molecules Table */}
      {comparison && (
        <div className="space-y-8">
          {/* Pairwise Cards */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold">
              Pairwise Flavor Relationship Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparison.pairwiseAnalyses.map((pa) => (
                <div
                  key={`${pa.ingredientA}-${pa.ingredientB}`}
                  className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[#0F2419]/10 dark:border-white/10 pb-3">
                    <div>
                      <div className="text-xs font-mono text-emerald-800 dark:text-[#A3E635]">
                        {pa.synergyClassification}
                      </div>
                      <h3 className="font-display text-xl font-semibold mt-0.5">
                        {pa.ingredientA} + {pa.ingredientB}
                      </h3>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-2xl font-bold text-[#0F2419] dark:text-[#A3E635]">
                        {pa.estimatedCompatibilityScore}%
                      </div>
                      <div className="text-[11px] text-stone-500">App Est. Score</div>
                    </div>
                  </div>

                  <p className="text-sm text-[#0F2419]/80 dark:text-[#F7F6F2]/80 leading-relaxed">
                    {pa.relationshipExplanation}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#0F2419]/10 dark:border-white/10 text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-stone-500">Shared Molecules</div>
                      <div className="font-semibold text-sm">{pa.sharedMoleculeCount}</div>
                    </div>
                    <div>
                      <div className="text-stone-500">Jaccard Overlap</div>
                      <div className="font-semibold text-sm">{pa.jaccardOverlapPercent}%</div>
                    </div>
                    <div>
                      <div className="text-stone-500">Sensory Cosine</div>
                      <div className="font-semibold text-sm">{pa.sensoryAlignmentScore}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documented Aroma Molecules Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0F2419] border border-[#0F2419]/10 dark:border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Documented Aroma Compounds Across Selected Ingredients
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Showing shared and primary volatile flavor molecules from FlavorDB records
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-800 dark:text-[#A3E635]">
                {comparison.sharedMolecules.length} Shared Bridge Compound(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#0F2419]/15 dark:border-white/15 text-stone-500 dark:text-stone-400">
                    <th className="py-2.5 pr-4 font-semibold">Compound Name</th>
                    <th className="py-2.5 px-4 font-semibold">PubChem ID</th>
                    <th className="py-2.5 px-4 font-semibold">Functional Groups</th>
                    <th className="py-2.5 px-4 font-semibold">Sensory Notes</th>
                    <th className="py-2.5 pl-4 font-semibold">Present In Selected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F2419]/10 dark:divide-white/10">
                  {[
                    ...comparison.sharedMolecules,
                    ...comparison.primaryIngredient.molecules
                      .filter(
                        (pm) =>
                          !comparison.sharedMolecules.some(
                            (sm) => sm.molecule.commonName === pm.commonName
                          )
                      )
                      .map((molecule) => ({
                        molecule,
                        presentIn: [comparison.primaryIngredient.name],
                      })),
                  ].map((item) => {
                    const isShared = item.presentIn.length >= 2;
                    return (
                      <tr key={item.molecule.commonName} className="hover:bg-black/2 dark:hover:bg-white/5">
                        <td className="py-3 pr-4 font-medium">
                          {item.molecule.commonName}
                          {isShared && (
                            <span className="ml-2 text-[11px] font-mono text-emerald-700 dark:text-[#A3E635]">
                              [Shared Bridge]
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-stone-500">
                          {item.molecule.pubchemId || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-300">
                          {item.molecule.functionalGroups.join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          {item.molecule.flavorProfile.join(' · ')}
                        </td>
                        <td className="py-3 pl-4 font-semibold">
                          {item.presentIn.join(' + ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
