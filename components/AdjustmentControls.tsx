
import React from 'react';
import { Adjustments, AiEffect, FilterEffect } from '../types';
import { ResetIcon } from './icons/ResetIcon';
import { FILTERS, FILTER_PREVIEW_IMAGE } from '../constants';
import { Button } from './Button';

interface AdjustmentControlsProps {
  adjustments: Adjustments;
  onAdjustmentChange: (adjustment: keyof Adjustments, value: number | AiEffect | FilterEffect | boolean) => void;
  onReset: () => void;
  showInterpolation?: boolean;
}

const AI_EFFECTS: { id: AiEffect, name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'dreamy', name: 'Dreamy' },
    { id: 'techno', name: 'Techno' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'noir', name: 'Noir' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'faded', name: 'Faded' },
];

const getTrustIndicator = (val: number) => {
    if (val < 30) return { text: 'Conservative', color: 'text-green-400' };
    if (val < 70) return { text: 'Balanced', color: 'text-yellow-400' };
    return { text: 'Creative', color: 'text-red-500' };
};


const AdjustmentControls: React.FC<AdjustmentControlsProps> = ({ adjustments, onAdjustmentChange, onReset, showInterpolation = true }) => {
  return (
    <div>
       <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255,255,255,0.1);
          border: 1px solid var(--border-color);
          transition: .4s;
          border-radius: 28px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-image: var(--primary-accent-gradient);
          border-color: var(--primary-accent-start);
        }
        input:focus-visible + .toggle-slider {
          outline: 2px solid var(--primary-accent-start);
          outline-offset: 2px;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
      `}</style>
      <div className="flex justify-end items-center mb-6 gap-4">
        <Button
            onClick={onReset}
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
            aria-label="Reset adjustments"
            icon={<ResetIcon className="w-4 h-4" />}
        >
            Reset
        </Button>
      </div>
     
        <div className="space-y-8 animate-enter">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">AI Detail Invention</h3>
              <div className="flex flex-col px-1">
                  <div className="flex items-center justify-between mb-2">
                      <label htmlFor="detail-invention" className="text-sm font-medium text-[var(--text-secondary)]">Level</label>
                      <span className={`text-xs font-bold ${getTrustIndicator(adjustments.detailInvention).color}`}>{getTrustIndicator(adjustments.detailInvention).text}</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <input
                          id="detail-invention"
                          type="range" min={0} max={100} step={1}
                          value={adjustments.detailInvention}
                          onChange={(e) => onAdjustmentChange('detailInvention', parseInt(e.target.value, 10))}
                          className="w-full apple-slider" aria-label="Detail Invention"
                      />
                      <span className="w-12 text-right text-sm text-[var(--text-secondary)] font-mono bg-[#E5E5E5]/5 px-2 py-0.5 rounded-md">{adjustments.detailInvention}</span>
                  </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">AI Denoise</h3>
              <div className="flex flex-col px-1">
                  <div className="flex items-center justify-between mb-2">
                      <label htmlFor="denoise-level" className="text-sm font-medium text-[var(--text-secondary)]">Level</label>
                  </div>
                  <div className="flex items-center gap-4">
                      <input
                          id="denoise-level"
                          type="range" min={0} max={100} step={1}
                          value={adjustments.denoise}
                          onChange={(e) => onAdjustmentChange('denoise', parseInt(e.target.value, 10))}
                          className="w-full apple-slider" aria-label="Denoise Level"
                      />
                      <span className="w-12 text-right text-sm text-[var(--text-secondary)] font-mono bg-[#E5E5E5]/5 px-2 py-0.5 rounded-md">{adjustments.denoise}</span>
                  </div>
              </div>
            </div>
            
            {showInterpolation && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">AI Frame Interpolation</h3>
                <div className="flex items-center justify-between px-1 py-1">
                    <div className="pr-4">
                      <label htmlFor="interpolation-toggle" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                          Simulate 60fps
                          <span className="block text-xs text-[var(--text-secondary)]">Creates a smoother, high frame-rate look.</span>
                      </label>
                    </div>
                    <label className="toggle-switch flex-shrink-0">
                        <input
                            id="interpolation-toggle"
                            type="checkbox"
                            checked={adjustments.interpolation}
                            onChange={(e) => onAdjustmentChange('interpolation', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Creative Filters</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 text-center">
                  {FILTERS.map(filter => (
                      <button
                          key={filter.id}
                          onClick={() => onAdjustmentChange('filter', filter.id)}
                          className={`relative flex flex-col items-center justify-center gap-2 p-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-[var(--primary-accent-start)] group rounded-lg bg-white/5 hover:bg-white/10`}
                          aria-pressed={adjustments.filter === filter.id}
                      >
                          {adjustments.filter === filter.id && <div className="absolute inset-0 rounded-lg border-2 border-[var(--primary-accent-start)] shadow-md shadow-[var(--primary-accent-start)]/40"></div>}
                          <div
                              className={`w-full h-16 transition-transform group-hover:scale-105 overflow-hidden rounded-md`}
                          >
                              <img
                                  src={FILTER_PREVIEW_IMAGE}
                                  alt={`${filter.name} filter preview`}
                                  className="w-full h-full object-cover"
                                  style={filter.style}
                              />
                          </div>
                          <span className="text-xs font-medium text-[var(--text-primary)] pb-1">{filter.name}</span>
                      </button>
                  ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">AI Creative Effects</h3>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {AI_EFFECTS.map(effect => (
                      <button
                          key={effect.id}
                          onClick={() => onAdjustmentChange('aiEffect', effect.id)}
                          className={`px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-[var(--primary-accent-start)] rounded-lg relative ${
                              adjustments.aiEffect === effect.id
                              ? 'text-black shadow-lg shadow-[var(--primary-accent-start)]/20 scale-105'
                              : 'bg-[var(--container-bg)] text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
                          }`}
                          aria-pressed={adjustments.aiEffect === effect.id}
                      >
                          {adjustments.aiEffect === effect.id && <div className="absolute inset-0 rounded-lg" style={{background: 'var(--primary-accent-gradient)'}}></div>}
                          <span className="relative z-10">{effect.name}</span>
                      </button>
                  ))}
              </div>
            </div>
        </div>
    </div>
  );
};

export default AdjustmentControls;
