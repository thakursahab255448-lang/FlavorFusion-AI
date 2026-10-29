import React from 'react';
import { DataProvenance } from '../types/culinary';

interface ProvenanceBadgeProps {
  provenance: DataProvenance;
  compact?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, compact = false }) => {
  const getLabelAndTone = () => {
    switch (provenance.source) {
      case 'live_foodoscope_api':
        return {
          text: 'Verified API · Foodoscope Live',
          tone: 'text-emerald-800 dark:text-emerald-300',
        };
      case 'cosylab_public_api':
        return {
          text: 'Verified API · CoSyLab IIIT-D JSON',
          tone: 'text-emerald-800 dark:text-emerald-300',
        };
      case 'gemini_ai_synthesis':
        return {
          text: 'AI Synthesis · Grounded in FlavorDB',
          tone: 'text-amber-800 dark:text-amber-300',
        };
      case 'app_recommendation_engine':
        return {
          text: 'Application Formula Estimate',
          tone: 'text-teal-800 dark:text-teal-300',
        };
      case 'demo_dataset':
      default:
        return {
          text: 'Demo Data · Reference Schema',
          tone: 'text-stone-600 dark:text-stone-400',
        };
    }
  };

  const { text, tone } = getLabelAndTone();

  if (compact) {
    return (
      <span className={`text-xs font-medium ${tone}`} title={provenance.note || provenance.sourceLabel}>
        {text}
      </span>
    );
  }

  return (
    <div className="text-xs text-stone-600 dark:text-stone-400 flex flex-wrap items-center gap-1.5">
      <span className={`font-semibold ${tone}`}>{text}</span>
      <span aria-hidden="true">·</span>
      <span>{provenance.sourceLabel}</span>
    </div>
  );
};
