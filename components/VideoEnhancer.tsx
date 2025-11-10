
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ProcessStatus, EnhancementModel, Adjustments, ToastMessage, AiEffect, FilterEffect } from '../types';
import { PROCESSING_MESSAGES, MODELS, DEFAULT_ADJUSTMENTS, FILTERS, MAX_VIDEO_FILE_SIZE_BYTES, AUTO_ENHANCE_ADJUSTMENTS, ENHANCEMENT_PRESETS } from '../constants';
import FileUpload from './FileUpload';
import ProgressBar from './ProgressBar';
import VideoResult from './VideoResult';
import EnhancementEditor from './EnhancementEditor';
import { handleApiError } from '../utils';

interface VideoEnhancerProps {
  addToast: (message: string, type?: ToastMessage['type']) => void;
}

const extractFrame = (videoUrl: string, timeInSeconds: number = 1.0): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = "anonymous";
        video.addEventListener('loadeddata', () => {
            video.currentTime = timeInSeconds;
        });
        video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg'));
            } else {
                reject(new Error('Could not get canvas context.'));
            }
        });
        video.addEventListener('error', (e) => {
            reject(new Error('Failed to load video for frame extraction.'));
        });
        video.src = videoUrl;
    });
};

const calculateFilterStyle = (adjustments: Adjustments): React.CSSProperties => {
  const { aiEffect, filter } = adjustments;
  
  const aiFilters: string[] = [];
  switch(aiEffect) {
    case 'cinematic':
        aiFilters.push('contrast(1.2)', 'saturate(1.1)', 'brightness(0.95)', 'sepia(0.15)');
        break;
    case 'dreamy':
        aiFilters.push('blur(0.5px)', 'contrast(0.9)', 'saturate(0.8)', 'brightness(1.1)');
        break;
    case 'techno':
        aiFilters.push('contrast(1.3)', 'hue-rotate(-180deg)', 'saturate(1.5)', 'brightness(0.9)');
        break;
    case 'vintage':
        aiFilters.push('sepia(0.6)', 'contrast(1.2)', 'brightness(0.9)', 'saturate(0.9)');
        break;
    case 'noir':
        aiFilters.push('grayscale(1)', 'contrast(1.5)', 'brightness(0.9)');
        break;
    case 'cyberpunk':
        aiFilters.push('contrast(1.4)', 'hue-rotate(20deg)', 'saturate(1.8)', 'brightness(0.8)');
        break;
    case 'faded':
        aiFilters.push('contrast(0.8)', 'saturate(0.7)', 'brightness(1.1)', 'sepia(0.1)');
        break;
  }

  const selectedFilterPreset = FILTERS.find(f => f.id === filter);
  const presetFilter = selectedFilterPreset ? selectedFilterPreset.style.filter : '';

  const allFilters = [
      presetFilter,
      ...aiFilters
  ].filter(Boolean);


  return { 
    filter: allFilters.join(' ')
  };
};

const applyFiltersToVideo = (
  videoUrl: string,
  cssFilter: string,
  onProgress: (percent: number) => void,
  maxDuration: number | null = null
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    let recorder: MediaRecorder | null = null;
    let stopped = false;
    let animationFrameId: number;

    const cleanupAndReject = (error: Error) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrameId);
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
      reject(error);
    };

    try {
      const videoForCanvas = document.createElement('video');
      videoForCanvas.crossOrigin = 'anonymous';
      videoForCanvas.muted = true;
      videoForCanvas.src = videoUrl;

      const videoForAudio = document.createElement('video');
      videoForAudio.crossOrigin = 'anonymous';
      videoForAudio.muted = false; // To capture audio track
      videoForAudio.src = videoUrl;

      await Promise.all([
        new Promise<void>((res, rej) => { videoForCanvas.onloadedmetadata = () => res(); videoForCanvas.onerror = () => rej(new Error('Video canvas source failed to load metadata.')) }),
        new Promise<void>((res, rej) => { videoForAudio.onloadedmetadata = () => res(); videoForAudio.onerror = () => rej(new Error('Video audio source failed to load metadata.')) })
      ]);

      const canvas = document.createElement('canvas');
      canvas.width = videoForCanvas.videoWidth;
      canvas.height = videoForCanvas.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return cleanupAndReject(new Error('Could not get canvas context.'));
      }

      const FPS = 30; // Still needed for captureStream
      const canvasStream = canvas.captureStream(FPS);
      const [videoTrack] = canvasStream.getVideoTracks();

      let audioTrack: MediaStreamTrack | undefined;
      const hasAudio = (videoForAudio as any).mozHasAudio || Boolean((videoForAudio as any).webkitAudioDecodedByteCount) || Boolean((videoForAudio as any).audioTracks?.length);
      if (hasAudio) {
        try {
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaElementSource(videoForAudio);
          const destination = audioCtx.createMediaStreamDestination();
          source.connect(destination);
          [audioTrack] = destination.stream.getAudioTracks();
        } catch (e) {
          console.warn("Could not process audio track, the final video will be silent.", e);
        }
      }

      const tracks = [videoTrack];
      if (audioTrack) {
        tracks.push(audioTrack);
      }
      const combinedStream = new MediaStream(tracks);

      const preferredOptions = { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 25000000 };
      const fallbackOptions = { mimeType: 'video/webm' };
      const options = MediaRecorder.isTypeSupported(preferredOptions.mimeType) ? preferredOptions : fallbackOptions;
      
      try {
        recorder = new MediaRecorder(combinedStream, options);
      } catch (e) {
        return cleanupAndReject(new Error("Could not initialize video recorder. Your browser may not support this feature."));
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        if (stopped) return;
        cancelAnimationFrame(animationFrameId);
        if (chunks.length === 0) {
          return cleanupAndReject(new Error("Video processing resulted in an empty file. This can happen if the browser is under heavy load."));
        }
        const blob = new Blob(chunks, { type: options.mimeType });
        resolve(URL.createObjectURL(blob));
      };
      recorder.onerror = () => cleanupAndReject(new Error('A MediaRecorder error occurred during video creation.'));

      const totalDuration = maxDuration !== null ? Math.min(videoForCanvas.duration, maxDuration) : videoForCanvas.duration;
      
      await videoForCanvas.play();
      await videoForAudio.play();
      recorder.start();

      const processFrame = () => {
        if (stopped) return;

        if (videoForCanvas.currentTime >= totalDuration || videoForCanvas.paused || videoForCanvas.ended) {
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
          return;
        }

        ctx.filter = cssFilter || 'none';
        ctx.drawImage(videoForCanvas, 0, 0, canvas.width, canvas.height);
        onProgress((videoForCanvas.currentTime / totalDuration) * 100);

        animationFrameId = requestAnimationFrame(processFrame);
      };

      animationFrameId = requestAnimationFrame(processFrame);

    } catch (err) {
      cleanupAndReject(err as Error);
    }
  });
};


const VideoEnhancer: React.FC<VideoEnhancerProps> = ({ addToast }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [enhancedVideoUrl, setEnhancedVideoUrl] = useState<string | null>(null);
  const [originalFrame, setOriginalFrame] = useState<string | null>(null);
  const [enhancedFrame, setEnhancedFrame] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Upload a video to begin enhancement.');
  const [originalDimensions, setOriginalDimensions] = useState<{width: number; height: number} | null>(null);
  const [scalingFactor, setScalingFactor] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState<EnhancementModel>('real-esrgan');
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [isRefining, setIsRefining] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const resetState = useCallback(() => {
    setVideoFile(null);
    if (originalVideoUrl) URL.revokeObjectURL(originalVideoUrl);
    if (enhancedVideoUrl) URL.revokeObjectURL(enhancedVideoUrl);
    setOriginalVideoUrl(null);
    setEnhancedVideoUrl(null);
    setOriginalFrame(null);
    setEnhancedFrame(null);
    setStatus(ProcessStatus.IDLE);
    setProgress(0);
    setStatusMessage('Upload a video to begin enhancement.');
    setOriginalDimensions(null);
    setScalingFactor(1);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setSelectedModel('real-esrgan');
    setIsRefining(false);
    setIsLoadingInitialData(false);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  }, [originalVideoUrl, enhancedVideoUrl]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      addToast('Invalid file type. Please upload a video file.');
      return;
    }
    if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
        addToast(`File is too large. Maximum size is ${MAX_VIDEO_FILE_SIZE_BYTES / 1024 / 1024}MB.`, 'error');
        return;
    }
    
    resetState();

    const videoUrl = URL.createObjectURL(file);
    
    setVideoFile(file);
    setOriginalVideoUrl(videoUrl);
    setStatus(ProcessStatus.FINALIZING);

    setAdjustments(AUTO_ENHANCE_ADJUSTMENTS);
    setEnhancedFrame(null);
    setIsLoadingInitialData(true);
    setIsRefining(true);
  };
  
  const enhanceFrameWithAI = useCallback(async (frameDataUrl: string, factor: number, model: EnhancementModel, adjustments: Adjustments) => {
    if (!navigator.onLine) {
        addToast("You are offline. Please check your internet connection.");
        setStatus(ProcessStatus.ERROR);
        return null;
    }
    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is missing.");
      }
      const base64ImageData = frameDataUrl.split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const textPrompt = MODELS[model].prompt(factor, adjustments);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: { data: base64ImageData, mimeType: 'image/jpeg' },
            },
            {
              text: textPrompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
      }
      throw new Error("AI did not return an enhanced image. This could be due to a network issue or API error.");

    } catch (e) {
      handleApiError(e, addToast);
      return null;
    }
  }, [addToast]);
  
  const handleAdjustmentChange = (key: keyof Adjustments, value: number | AiEffect | FilterEffect | boolean) => {
      const newAdjustments = { ...adjustments, [key]: value };
      setAdjustments(newAdjustments);

      const isAiParam = ['detailInvention', 'denoise', 'interpolation'].includes(key);

      if (status === ProcessStatus.FINALIZING && originalFrame && isAiParam) {
          if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = window.setTimeout(async () => {
              setIsRefining(true);
              const newEnhancedFrame = await enhanceFrameWithAI(
                  originalFrame,
                  scalingFactor,
                  selectedModel,
                  newAdjustments
              );
              if (newEnhancedFrame) {
                  setEnhancedFrame(newEnhancedFrame);
              }
              setIsRefining(false);
          }, 500);
      }
  };

  const handlePresetSelect = useCallback((newAdjustments: Adjustments) => {
    setAdjustments(newAdjustments);

    if (status === ProcessStatus.FINALIZING && originalFrame) {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        setIsRefining(true);
        enhanceFrameWithAI(
            originalFrame,
            scalingFactor,
            selectedModel,
            newAdjustments
        ).then(newEnhancedFrame => {
            if (newEnhancedFrame) {
                setEnhancedFrame(newEnhancedFrame);
            } else {
               addToast('AI refinement failed for this preset.', 'error');
            }
        }).finally(() => {
            setIsRefining(false);
        });
    }
  }, [status, originalFrame, scalingFactor, selectedModel, enhanceFrameWithAI, addToast]);

  useEffect(() => {
    if (status !== ProcessStatus.FINALIZING || !videoFile || !originalVideoUrl) {
      return;
    }

    let isCancelled = false;

    const processVideoInBackground = async () => {
        try {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = originalVideoUrl;

            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => resolve();
                video.onerror = () => reject(new Error('Could not read video properties. The file might be corrupt or unsupported.'));
            });
            if (isCancelled) return;

            const { videoWidth, videoHeight, duration } = video;
            setOriginalDimensions({ width: videoWidth, height: videoHeight });
            
            let factor = 2;
            if (videoHeight <= 480) factor = 8;
            else if (videoHeight <= 720) factor = 4;
            setScalingFactor(factor);

            const frameTime = duration > 2 ? 1.0 : duration / 2;
            const frame = await extractFrame(originalVideoUrl, frameTime);
            if (isCancelled) return;
            setOriginalFrame(frame);
            
            setIsLoadingInitialData(false);

            const enhanced = await enhanceFrameWithAI(frame, factor, selectedModel, AUTO_ENHANCE_ADJUSTMENTS);
            if (isCancelled) return;
            
            if (enhanced) {
                setEnhancedFrame(enhanced);
            } else {
                addToast('Initial AI enhancement failed.', 'error');
            }
        } catch (err) {
            if (isCancelled) return;
            console.error(err);
            addToast((err as Error).message || 'An error occurred during background processing.');
            setStatus(ProcessStatus.ERROR);
        } finally {
            if (!isCancelled) {
                setIsRefining(false);
            }
        }
    };

    processVideoInBackground();

    return () => {
        isCancelled = true;
    };
  }, [status, videoFile, originalVideoUrl, addToast, enhanceFrameWithAI, selectedModel]);

  const filterStyle = useMemo(() => calculateFilterStyle(adjustments), [adjustments]);
  
  const handleFinalize = () => {
    setStatus(ProcessStatus.PROCESSING); // Re-use processing state for rendering
  };

  useEffect(() => {
    if (status !== ProcessStatus.PROCESSING || !enhancedFrame) {
      return;
    }
    if (!originalVideoUrl) {
      addToast("Original video source is missing. Cannot finalize video.", 'error');
      setStatus(ProcessStatus.ERROR);
      return;
    }

    const dynamicProcessingMessages = PROCESSING_MESSAGES;
    
    setStatusMessage(dynamicProcessingMessages[0]);
    setProgress(0);

    // Render the full video. This can be slow and memory-intensive on the client-side.
    applyFiltersToVideo(originalVideoUrl, filterStyle.filter as string, (p) => {
      setProgress(p < 99.9 ? p : 99.9);
      const currentStep = Math.min(
        Math.floor(p / (100 / dynamicProcessingMessages.length)),
        dynamicProcessingMessages.length - 1
      );
      setStatusMessage(dynamicProcessingMessages[currentStep]);
    }, null) 
    .then(finalVideoUrl => {
      setEnhancedVideoUrl(finalVideoUrl);
      setProgress(100);
      setStatus(ProcessStatus.DONE);
      setStatusMessage('Enhancement complete! Your video is ready.');
    })
    .catch(err => {
      console.error("Failed to create final video:", err);
      addToast((err as Error).message || "An error occurred while rendering the video.", 'error');
      setStatus(ProcessStatus.ERROR);
    });
    
  }, [status, originalVideoUrl, adjustments, enhancedFrame, addToast, filterStyle]);

  switch (status) {
    case ProcessStatus.IDLE:
    case ProcessStatus.ERROR:
      return (
        <FileUpload 
          onFileSelect={handleFileSelect}
          headline="The Future of Video is Here"
          subheadline="Experience the magic of AI. Instantly transform your footage into breathtaking 4K."
        />
      );
    case ProcessStatus.UPLOADING:
    case ProcessStatus.PROCESSING:
        return <ProgressBar progress={progress} message={statusMessage} />;
    
    case ProcessStatus.FINALIZING: // Editor Mode
      return originalVideoUrl && (
          <EnhancementEditor 
            originalVideoUrl={originalVideoUrl}
            enhancedFrame={enhancedFrame}
            adjustments={adjustments}
            onAdjustmentChange={handleAdjustmentChange}
            onResetAdjustments={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
            onAutoEnhance={() => {
                setAdjustments(AUTO_ENHANCE_ADJUSTMENTS);
                 // Manually trigger AI refinement when clicking auto-enhance
                if(originalFrame) {
                    setIsRefining(true);
                    enhanceFrameWithAI(originalFrame, scalingFactor, selectedModel, AUTO_ENHANCE_ADJUSTMENTS)
                        .then(frame => { if(frame) setEnhancedFrame(frame); })
                        .finally(() => setIsRefining(false));
                }
            }}
            onFinalize={handleFinalize}
            onCancel={resetState}
            filterStyle={filterStyle}
            originalDimensions={originalDimensions}
            isRefining={isRefining}
            isLoadingInitialData={isLoadingInitialData}
            presets={ENHANCEMENT_PRESETS}
            onPresetSelect={handlePresetSelect}
          />
      );
    case ProcessStatus.DONE:
      return (
        <VideoResult
          originalUrl={originalVideoUrl!}
          enhancedUrl={enhancedVideoUrl!}
          fileName={videoFile?.name || 'enhanced-video.mp4'}
          onRestart={resetState}
          filterStyle={filterStyle}
          originalDimensions={originalDimensions}
        />
      );
    default:
      return null;
  }
};

export default VideoEnhancer;
