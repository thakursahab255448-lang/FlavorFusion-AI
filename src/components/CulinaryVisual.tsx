import React, { useState } from 'react';
import { NormalizedRecipe } from '../types/culinary';

interface CulinaryVisualProps {
  title: string;
  subtitle?: string;
  theme?: NormalizedRecipe['visualTheme'];
  imageUrl?: string;
  className?: string;
  variant?: 'hero' | 'card' | 'detail';
  molecules?: string[];
}

const THEME_PALETTES: Record<
  NonNullable<NormalizedRecipe['visualTheme']>,
  { bg: string; accent: string; stroke: string; label: string }
> = {
  saffron: {
    bg: 'from-[#132A1E] via-[#1B3B2B] to-[#2C2214]',
    accent: '#F59E0B',
    stroke: '#FDE68A',
    label: 'Safranal · Beta-Ionone',
  },
  emerald: {
    bg: 'from-[#0D2117] via-[#153525] to-[#1E4631]',
    accent: '#A3E635',
    stroke: '#BEF264',
    label: 'Linalool · Eugenol',
  },
  terracotta: {
    bg: 'from-[#1F1916] via-[#2D221C] to-[#14291E]',
    accent: '#FB923C',
    stroke: '#FDBA74',
    label: 'Cuminaldehyde · Gingerol',
  },
  plum: {
    bg: 'from-[#191522] via-[#231D30] to-[#12261C]',
    accent: '#C084FC',
    stroke: '#E9D5FF',
    label: 'Diacetyl · Estragole',
  },
  citrus: {
    bg: 'from-[#11261B] via-[#1B3928] to-[#263818]',
    accent: '#FACC15',
    stroke: '#FEF08A',
    label: 'Citral · Limonene',
  },
  espresso: {
    bg: 'from-[#141715] via-[#1E2420] to-[#29231E]',
    accent: '#34D399',
    stroke: '#A7F3D0',
    label: 'Glutamate · Lenthionine',
  },
};

export const CulinaryVisual: React.FC<CulinaryVisualProps> = ({
  title,
  subtitle,
  theme = 'emerald',
  imageUrl,
  className = '',
  variant = 'card',
  molecules = [],
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.emerald;

  if (imageUrl && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#12261A] ${className}`}>
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${palette.bg} text-[#F7F6F2] select-none ${className}`}
    >
      <svg
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover opacity-35"
        aria-hidden="true"
      >
        <path
          d="M0 80H600M0 160H600M0 240H600M0 320H600M120 0V400M240 0V400M360 0V400M480 0V400"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        <polygon
          points="420,90 470,118 470,175 420,204 370,175 370,118"
          stroke={palette.stroke}
          strokeWidth="2"
          fill="none"
        />
        <polygon
          points="420,104 458,125 458,168 420,190 382,168 382,125"
          stroke={palette.stroke}
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
        />
        <polygon
          points="520,147 570,175 570,232 520,260 470,232 470,175"
          stroke={palette.accent}
          strokeWidth="2"
          fill="none"
        />
        <line x1="370" y1="118" x2="315" y2="90" stroke={palette.stroke} strokeWidth="2" />
        <line x1="420" y1="204" x2="420" y2="265" stroke={palette.stroke} strokeWidth="2" />
        <line x1="315" y1="90" x2="260" y2="122" stroke={palette.accent} strokeWidth="1.5" />
        <circle cx="420" cy="90" r="5" fill={palette.accent} />
        <circle cx="470" cy="175" r="5" fill={palette.stroke} />
        <circle cx="315" cy="90" r="6" fill={palette.accent} />
        <circle cx="260" cy="122" r="4" fill={palette.stroke} />
        <circle cx="420" cy="265" r="5" fill={palette.accent} />
        <path
          d="M90 330 C 120 220, 220 180, 310 210 C 260 290, 170 340, 90 330 Z"
          stroke={palette.accent}
          strokeWidth="1.75"
          fill={palette.accent}
          fillOpacity="0.08"
        />
        <path
          d="M90 330 C 160 280, 230 240, 310 210"
          stroke={palette.stroke}
          strokeOpacity="0.6"
          strokeWidth="1.25"
        />
      </svg>

      <div className="relative z-10 h-full w-full flex flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-2 text-xs font-mono tracking-tight text-[#D6E2DA]/85">
          <span>{molecules.length > 0 ? molecules.slice(0, 2).join(' · ') : palette.label}</span>
          {subtitle && <span>{subtitle}</span>}
        </div>

        {variant === 'hero' ? (
          <div className="my-auto py-6">
            <p className="text-xs font-mono text-[#A3E635] mb-2">
              COMPUTATIONAL GASTRONOMY MATRIX · IIIT-D SCHEMA
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white max-w-lg leading-snug">
              {title}
            </h3>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/15 pt-4 text-xs">
              <div>
                <div className="text-white/60">Bridge Molecules</div>
                <div className="font-mono text-sm font-semibold text-[#A3E635] tabular-nums whitespace-nowrap">
                  Allicin · Linalool
                </div>
              </div>
              <div>
                <div className="text-white/60">Match Weights</div>
                <div className="font-mono text-sm font-semibold text-white tabular-nums whitespace-nowrap">
                  60 / 25 / 15
                </div>
              </div>
              <div>
                <div className="text-white/60">Provenance</div>
                <div className="font-mono text-sm font-semibold text-emerald-300 whitespace-nowrap">
                  API + Formula
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-6">
            <div className="text-xs text-[#A3E635] font-medium mb-1">
              Culinary Specimen
            </div>
            <div className="font-display text-base font-medium text-white line-clamp-2 leading-snug">
              {title}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
