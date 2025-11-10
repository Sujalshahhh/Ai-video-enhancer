
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ProcessStatus, EnhancementModel, Adjustments, ToastMessage, AiEffect, FilterEffect, Preset } from '../types';
import { MODELS, DEFAULT_ADJUSTMENTS, FILTERS, AUTO_ENHANCE_ADJUSTMENTS, ENHANCEMENT_PRESETS } from '../constants';
import FileUpload from './FileUpload';
import ProgressBar from './ProgressBar';
import AdjustmentControls from './AdjustmentControls';
import PresetSelector from './PresetSelector';
import { Button } from './Button';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { handleApiError } from '../utils';

const MAX_IMAGE_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Icons used in this component
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

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = (err) => reject(new Error("Could not load image to get dimensions."));
    img.src = url;
  });
};

const calculateFilterStyle = (adjustments: Adjustments): React.CSSProperties => {
    const { aiEffect, filter } = adjustments;
    const aiFilters: string[] = [];
    switch(aiEffect) {
        case 'cinematic': aiFilters.push('contrast(1.2)', 'saturate(1.1)', 'brightness(0.95)', 'sepia(0.15)'); break;
        case 'dreamy': aiFilters.push('blur(0.5px)', 'contrast(0.9)', 'saturate(0.8)', 'brightness(1.1)'); break;
        case 'techno': aiFilters.push('contrast(1.3)', 'hue-rotate(-180deg)', 'saturate(1.5)', 'brightness(0.9)'); break;
        case 'vintage': aiFilters.push('sepia(0.6)', 'contrast(1.2)', 'brightness(0.9)', 'saturate(0.9)'); break;
        case 'noir': aiFilters.push('grayscale(1)', 'contrast(1.5)', 'brightness(0.9)'); break;
        case 'cyberpunk': aiFilters.push('contrast(1.4)', 'hue-rotate(20deg)', 'saturate(1.8)', 'brightness(0.8)'); break;
        case 'faded': aiFilters.push('contrast(0.8)', 'saturate(0.7)', 'brightness(1.1)', 'sepia(0.1)'); break;
    }
    const selectedFilterPreset = FILTERS.find(f => f.id === filter);
    const presetFilter = selectedFilterPreset ? selectedFilterPreset.style.filter : '';
    const allFilters = [presetFilter, ...aiFilters].filter(Boolean);
    return { filter: allFilters.join(' ') };
};

interface ImageEnhancerProps {
    addToast: (message: string, type?: ToastMessage['type']) => void;
}

const ImageEnhancer: React.FC<ImageEnhancerProps> = ({ addToast }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Upload an image to begin enhancement.');
  const [originalDimensions, setOriginalDimensions] = useState<{width: number; height: number} | null>(null);
  const [scalingFactor, setScalingFactor] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState<EnhancementModel>('real-esrgan');
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [isRefining, setIsRefining] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const resetState = useCallback(() => {
    setImageFile(null);
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    // Note: AI-generated images are base64, not object URLs, so no need to revoke them.
    setOriginalImageUrl(null);
    setEnhancedImageUrl(null);
    setStatus(ProcessStatus.IDLE);
    setProgress(0);
    setStatusMessage('Upload an image to begin enhancement.');
    setOriginalDimensions(null);
    setScalingFactor(1);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setSelectedModel('real-esrgan');
    setIsRefining(false);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  }, [originalImageUrl]);

  const enhanceImageWithAI = useCallback(async (imageDataUrl: string, factor: number, model: EnhancementModel, adjustments: Adjustments) => {
    if (!navigator.onLine) {
        addToast("You are offline. Please check your internet connection.");
        setStatus(ProcessStatus.ERROR);
        return null;
    }
    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is missing.");
      }
      const base64ImageData = imageDataUrl.split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const textPrompt = MODELS[model].prompt(factor, adjustments);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64ImageData, mimeType: imageFile?.type || 'image/jpeg' } },
            { text: textPrompt },
          ],
        },
        config: { responseModalities: [Modality.IMAGE] },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      throw new Error("AI did not return an enhanced image.");
    } catch (e) {
      handleApiError(e, addToast);
      return null;
    }
  }, [addToast, imageFile]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('Invalid file type. Please upload an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        addToast(`File is too large. Maximum size is ${MAX_IMAGE_FILE_SIZE_BYTES / 1024 / 1024}MB.`, 'error');
        return;
    }
    
    resetState();
    setImageFile(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const imageUrl = reader.result as string;
        setOriginalImageUrl(imageUrl);
        setStatus(ProcessStatus.FINALIZING);
        setAdjustments(AUTO_ENHANCE_ADJUSTMENTS);
        setIsRefining(true);

        try {
            const dims = await getImageDimensions(imageUrl);
            setOriginalDimensions(dims);
            let factor = 2;
            if (dims.height <= 480) factor = 8;
            else if (dims.height <= 720) factor = 4;
            setScalingFactor(factor);

            const enhanced = await enhanceImageWithAI(imageUrl, factor, selectedModel, AUTO_ENHANCE_ADJUSTMENTS);
            if (enhanced) {
                setEnhancedImageUrl(enhanced);
            } else {
                addToast('Initial AI enhancement failed.', 'error');
            }
        } catch (error) {
            addToast((error as Error).message || 'Could not read image properties.', 'error');
            resetState();
        } finally {
            setIsRefining(false);
        }
    };
    reader.onerror = () => {
        addToast('Failed to read the selected file.', 'error');
        resetState();
    };
  };

  const debouncedEnhance = useCallback((newAdjustments: Adjustments) => {
      if (status === ProcessStatus.FINALIZING && originalImageUrl) {
          if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = window.setTimeout(async () => {
              setIsRefining(true);
              const newEnhancedImage = await enhanceImageWithAI(originalImageUrl, scalingFactor, selectedModel, newAdjustments);
              if (newEnhancedImage) {
                  setEnhancedImageUrl(newEnhancedImage);
              }
              setIsRefining(false);
          }, 500);
      }
  }, [status, originalImageUrl, scalingFactor, selectedModel, enhanceImageWithAI]);

  const handleAdjustmentChange = (key: keyof Adjustments, value: number | AiEffect | FilterEffect | boolean) => {
      const newAdjustments = { ...adjustments, [key]: value };
      setAdjustments(newAdjustments);
      const isAiParam = ['detailInvention', 'denoise', 'interpolation'].includes(key);
      if (isAiParam) {
          debouncedEnhance(newAdjustments);
      }
  };

  const handlePresetSelect = (newAdjustments: Adjustments) => {
      setAdjustments(newAdjustments);
      debouncedEnhance(newAdjustments);
  };
  
  const handleAutoEnhance = () => {
      handlePresetSelect(AUTO_ENHANCE_ADJUSTMENTS);
  };

  const handleFinalize = async () => {
    if (!originalImageUrl) return;
    setStatus(ProcessStatus.PROCESSING);
    setProgress(0);
    let progressInterval = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 200);
    setStatusMessage("Applying final AI enhancements...");
    
    const finalImage = await enhanceImageWithAI(originalImageUrl, scalingFactor, selectedModel, adjustments);
    
    clearInterval(progressInterval);
    setProgress(100);

    if (finalImage) {
        setEnhancedImageUrl(finalImage);
        setStatus(ProcessStatus.DONE);
    } else {
        addToast("Final enhancement failed. Please try again.", 'error');
        setStatus(ProcessStatus.ERROR);
    }
  };
  
  const handleDownload = () => {
      if (!enhancedImageUrl) return;
      const link = document.createElement('a');
      link.href = enhancedImageUrl;
      const baseName = imageFile?.name.substring(0, imageFile.name.lastIndexOf('.')) || 'enhanced-image';
      link.download = `${baseName}_enhanced.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const filterStyle = useMemo(() => calculateFilterStyle(adjustments), [adjustments]);

  switch (status) {
    case ProcessStatus.IDLE:
    case ProcessStatus.ERROR:
      return <FileUpload 
        onFileSelect={handleFileSelect} 
        accept="image/*" 
        description="PNG, JPG, WEBP up to 50MB"
        headline="Unlock Your Photo's True Potential"
        subheadline="Transform your images into stunning, high-resolution masterpieces with AI."
      />;

    case ProcessStatus.PROCESSING:
        return <ProgressBar progress={progress} message={statusMessage} />;
    
    case ProcessStatus.FINALIZING: {
        const aspectRatio = originalDimensions ? `${originalDimensions.width} / ${originalDimensions.height}` : '4 / 3';
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8 p-4 animate-enter">
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider text-center">Original</h3>
                            <div className="p-[3px] rounded-xl border border-[var(--border-color)]">
                                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                                    {originalImageUrl && <img src={originalImageUrl} alt="Original" className="w-full h-full object-contain" />}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gradient mb-3 uppercase tracking-wider text-center">Enhanced Preview</h3>
                            <div className="p-1 rounded-xl shadow-2xl shadow-[var(--primary-accent-start)]/30" style={{background: 'var(--primary-accent-gradient)'}}>
                                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                                    {enhancedImageUrl ? (
                                        <img src={enhancedImageUrl} alt="Enhanced Preview" className="w-full h-full object-contain" style={filterStyle} />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="animate-spin h-8 w-8 text-white" />
                                        </div>
                                    )}
                                    {isRefining && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-10 rounded-lg">
                                            <Loader2 className="animate-spin h-8 w-8 text-white" />
                                            <p className="text-white/80 mt-2 text-sm">Refining AI Preview...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-[440px] flex-shrink-0 flex flex-col bg-[var(--container-bg)] backdrop-blur-sm rounded-xl border border-[var(--border-color)] p-6 lg:sticky lg:top-24 max-h-[calc(100vh-120px)]">
                    <div className="overflow-y-auto pr-2 -mr-4">
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">Enhancement Studio</h2>
                        <PresetSelector presets={ENHANCEMENT_PRESETS} onSelect={handlePresetSelect} currentAdjustments={adjustments} />
                        <hr className="border-t border-[var(--border-color)] my-8" />
                        <AdjustmentControls adjustments={adjustments} onAdjustmentChange={handleAdjustmentChange} onReset={() => handlePresetSelect(DEFAULT_ADJUSTMENTS)} showInterpolation={false}/>
                    </div>
                    <div className="mt-6 pt-6 border-t border-[var(--border-color)] space-y-3 flex-shrink-0">
                        <Button onClick={handleAutoEnhance} variant="secondary" size="md" className="w-full" icon={<MagicWandIcon className="w-5 h-5" />}>Auto Enhance</Button>
                        <Button onClick={handleFinalize} variant="primary" size="lg" className="w-full" icon={<RenderIcon className="w-6 h-6" />} disabled={isRefining || !enhancedImageUrl}>Enhance Image</Button>
                        <Button onClick={resetState} variant="ghost" className="w-full">Cancel and start over</Button>
                    </div>
                </div>
            </div>
        );
    }
    case ProcessStatus.DONE: {
        const aspectRatio = originalDimensions ? `${originalDimensions.width} / ${originalDimensions.height}` : '4 / 3';
        return (
            <div className="w-full max-w-7xl mx-auto h-full flex flex-col animate-enter">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-glow">Enhancement Complete</h2>
                    <p className="mt-2 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Your enhanced image is ready. Download it or start over.</p>
                </div>
                <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full p-4">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider text-center">Original</h3>
                            <div className="p-[3px] rounded-xl border border-[var(--border-color)]">
                                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                                    <img src={originalImageUrl!} alt="Original" className="w-full h-full object-contain" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gradient mb-3 uppercase tracking-wider text-center">Enhanced Image</h3>
                            <div className="p-1 rounded-xl shadow-2xl shadow-[var(--primary-accent-start)]/30" style={{background: 'var(--primary-accent-gradient)'}}>
                                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                                    <img src={enhancedImageUrl!} alt="Enhanced" className="w-full h-full object-contain" style={filterStyle} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                    <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto" variant="primary" withConfetti icon={<DownloadIcon className="w-6 h-6" />}>Download Image</Button>
                    <Button onClick={resetState} variant="secondary" size="lg" className="w-full sm:w-auto" icon={<RefreshIcon className="w-5 h-5" />}>Enhance Another Image</Button>
                </div>
            </div>
        );
    }
    default:
      return null;
  }
};

export default ImageEnhancer;
