
import React from 'react';
import { Adjustments, AiEffect, FilterEffect, Preset } from '../types';
import AdjustmentControls from './AdjustmentControls';
import { Button } from './Button';
import PresetSelector from './PresetSelector';

const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.4-1.4l-1.188-.648 1.188-.648a2.25 2.25 0 011.4-1.4l.648-1.188.648 1.188a2.25 2.25 0 011.4 1.4l1.188.648-1.188.648a2.25 2.25 0 01-1.4 1.4z" />
    </svg>
);

const RenderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
    </svg>
);

const Loader2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

interface EnhancementEditorProps {
    originalVideoUrl: string;
    enhancedFrame: string | null;
    adjustments: Adjustments;
    onAdjustmentChange: (adjustment: keyof Adjustments, value: number | AiEffect | FilterEffect | boolean) => void;
    onResetAdjustments: () => void;
    onAutoEnhance: () => void;
    onFinalize: () => void;
    onCancel: () => void;
    filterStyle: React.CSSProperties;
    originalDimensions: { width: number; height: number; } | null;
    isRefining?: boolean;
    isLoadingInitialData?: boolean;
    presets: Preset[];
    onPresetSelect: (settings: Adjustments) => void;
}

const EnhancementEditor: React.FC<EnhancementEditorProps> = ({
    originalVideoUrl,
    enhancedFrame,
    adjustments,
    onAdjustmentChange,
    onResetAdjustments,
    onAutoEnhance,
    onFinalize,
    onCancel,
    filterStyle,
    originalDimensions,
    isRefining = false,
    isLoadingInitialData = false,
    presets,
    onPresetSelect,
}) => {
    const aspectRatio = originalDimensions ? `${originalDimensions.width} / ${originalDimensions.height}` : '16 / 9';

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8 p-4 animate-enter">
            {/* Left side: Previews */}
            <div className="flex-1 min-h-0 flex flex-col">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full">
                    {/* Original Video */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider text-center">Original</h3>
                        <div className="p-[3px] rounded-xl border border-[var(--border-color)]">
                            <div className="bg-black rounded-lg relative overflow-hidden" style={{ aspectRatio }}>
                                {isLoadingInitialData && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-10">
                                        <Loader2 className="animate-spin h-8 w-8 text-white" />
                                        <p className="text-white/80 mt-2 text-sm">Analyzing Video...</p>
                                    </div>
                                )}
                                <video 
                                    src={originalVideoUrl} 
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className={`w-full h-full object-contain transition-opacity duration-500 ${isLoadingInitialData ? 'opacity-0' : 'opacity-100'}`}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Enhanced Preview */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gradient mb-3 uppercase tracking-wider text-center">Enhanced Preview</h3>
                        <div className="p-1 rounded-xl shadow-2xl shadow-[var(--primary-accent-start)]/30" style={{background: 'var(--primary-accent-gradient)'}}>
                            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                                <video 
                                    key={originalVideoUrl + enhancedFrame}
                                    src={originalVideoUrl}
                                    poster={enhancedFrame || undefined}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className={`w-full h-full object-contain transition-opacity duration-500 ${isLoadingInitialData ? 'opacity-0' : 'opacity-100'}`}
                                    style={filterStyle} 
                                />
                                {isRefining && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-10 transition-opacity duration-300 rounded-lg">
                                        <Loader2 className="animate-spin h-8 w-8 text-white" />
                                        <p className="text-white/80 mt-2 text-sm">{isLoadingInitialData ? 'Analyzing Video...' : 'Refining AI Preview...'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Controls */}
            <div className="w-full lg:w-[440px] flex-shrink-0 flex flex-col bg-[var(--container-bg)] backdrop-blur-sm rounded-xl border border-[var(--border-color)] p-6 lg:sticky lg:top-24 max-h-[calc(100vh-120px)]">
                <div className="overflow-y-auto pr-2 -mr-4">
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">Enhancement Studio</h2>
                    
                    <PresetSelector
                        presets={presets}
                        onSelect={onPresetSelect}
                        currentAdjustments={adjustments}
                    />

                    <hr className="border-t border-[var(--border-color)] my-8" />
                    
                    <AdjustmentControls 
                        adjustments={adjustments}
                        onAdjustmentChange={onAdjustmentChange}
                        onReset={onResetAdjustments}
                    />
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--border-color)] space-y-3 flex-shrink-0">
                    <Button
                        onClick={onAutoEnhance}
                        variant="secondary"
                        size="md"
                        className="w-full"
                        icon={<MagicWandIcon className="w-5 h-5" />}
                    >
                        Auto Enhance
                    </Button>
                     <Button
                        onClick={onFinalize}
                        variant="primary"
                        size="lg"
                        className="w-full"
                        icon={<RenderIcon className="w-6 h-6" />}
                        disabled={!enhancedFrame}
                    >
                        Render Full Video
                    </Button>
                    <Button onClick={onCancel} variant="ghost" className="w-full">
                        Cancel and start over
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EnhancementEditor;
