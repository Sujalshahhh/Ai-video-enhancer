import React from 'react';
import { Adjustments, Preset } from '../types';
import { StarIcon } from './icons/StarIcon';

interface PresetSelectorProps {
    presets: Preset[];
    onSelect: (settings: Adjustments) => void;
    currentAdjustments: Adjustments;
}

const areAdjustmentsEqual = (a: Adjustments, b: Adjustments) => {
    // Stringify with sorted keys to ensure consistent comparison
    const sortObject = (obj: Record<string, any>) => Object.keys(obj).sort().reduce((res: Record<string, any>, key) => {
        res[key] = obj[key];
        return res;
    }, {});
    return JSON.stringify(sortObject(a)) === JSON.stringify(sortObject(b));
};

const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, onSelect, currentAdjustments }) => {
    return (
        <div className="mb-8 animate-enter" style={{ animationDelay: '100ms' }}>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Enhancement Presets</h3>
            <div className="space-y-2">
                {presets.map((preset) => {
                    const isActive = areAdjustmentsEqual(currentAdjustments, preset.settings);
                    return (
                        <button
                            key={preset.name}
                            onClick={() => onSelect(preset.settings)}
                            className={`w-full text-left p-3 transition-all duration-200 rounded-lg flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--container-bg)] focus-visible:ring-[var(--primary-accent-start)] ${
                                isActive 
                                ? 'bg-[var(--primary-accent-start)]/10 border border-[var(--primary-accent-start)]' 
                                : 'bg-white/5 hover:bg-white/10 border border-transparent'
                            }`}
                            aria-pressed={isActive}
                        >
                            <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-full ${isActive ? 'bg-[var(--primary-accent-start)]/20' : 'bg-white/10'}`}>
                                <StarIcon className={`w-5 h-5 ${isActive ? 'text-[var(--primary-accent-start)]' : 'text-[var(--text-secondary)]'}`} />
                            </div>
                            <div>
                                <h4 className={`font-semibold ${isActive ? 'text-white' : 'text-[var(--text-primary)]'}`}>{preset.name}</h4>
                                <p className="text-xs text-[var(--text-secondary)]">{preset.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PresetSelector;
