import { Adjustments, FilterEffect, Preset } from "./types";
import React from 'react';

export const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export const PROCESSING_MESSAGES: string[] = [
  "Stage 1/3: Pre-processing",
  "Analyzing source for stabilization...",
  "Applying noise reduction pre-pass...",
  "Stage 2/3: Core Enhancement",
  "Executing Real-ESRGAN super-resolution...",
  "Synthesizing fine details with generative AI...",
  "Removing compression artifacts...",
  "Stage 3/3: Post-processing",
  "Applying custom color & lens adjustments...",
  "Processing audio track...",
  "Performing final color grading...",
  "Compiling and encoding to 4K...",
];

export const MODELS = {
  'real-esrgan': {
    id: 'real-esrgan' as const,
    name: 'Real-ESRGAN 4x+',
    description: 'State-of-the-art model for photorealistic image restoration and enhancement.',
    prompt: (factor: number, adjustments: Adjustments) => {
      const { detailInvention, denoise, interpolation } = adjustments;

      // Dynamic instructions based on sliders
      let detailInstruction = '';
      if (detailInvention < 30) {
        detailInstruction = 'Conservative. Focus on restoring existing details with high fidelity. Avoid inventing new textures.';
      } else if (detailInvention < 70) {
        detailInstruction = 'Balanced. Intelligently reconstruct fine details and textures that are compressed or blurred.';
      } else {
        detailInstruction = 'Creative. Employ a generative approach to synthesize complex, realistic textures and invent plausible details where necessary.';
      }

      let denoiseInstruction = '';
      if (denoise === 0) {
        denoiseInstruction = 'Off. Preserve original grain and texture.';
      } else if (denoise < 30) {
        denoiseInstruction = 'Light. Clean up minor digital noise without sacrificing fine texture.';
      } else if (denoise < 70) {
        denoiseInstruction = 'Medium. Significantly reduce noise and grain while preserving important details.';
      } else {
        denoiseInstruction = 'High. Aggressively remove heavy noise and grain for the cleanest possible image.';
      }

      let motionInstruction = 'Standard. Maintain original frame rate with stable motion (no ghosting, warping, or flickering).';
      if (interpolation) {
        motionInstruction = 'Smooth (60fps simulation). Apply frame interpolation for exceptionally fluid motion.';
      }
      
      return `Enhance this low-quality image to a clean, realistic 4K resolution. The goal is a natural, professional remaster.

Primary Instructions:
• Refine clarity and remove all blur and motion softness. CRITICAL: Avoid over-sharpening and any sharpening halos.
• Preserve natural textures, especially skin texture. Do not create a "plastic" or overly smooth look.
• Keep all colors neutral and realistic, ensuring accurate skin tones.

Dynamic Enhancement Controls:
• AI Detail Invention Level: ${detailInstruction}
• AI Denoise Level: ${denoiseInstruction}
• AI Motion Treatment: ${motionInstruction}

Additional Guidelines:
• Restore edge clarity subtly.
• Recover lost details in shadows and midtones without clipping highlights.
• Maintain a natural dynamic range.
• Absolutely no artificial texture generation or cartoon-like oversaturation.

Output Format:
• A single, clean 3840x2160 (4K UHD) image frame.`;
    }
  }
};

export const FILTER_PREVIEW_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgOTAiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0EwNDRGRiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0Y1NjA0MCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=';

export const FILTERS: { id: FilterEffect, name: string, style: React.CSSProperties }[] = [
  { id: 'none', name: 'None', style: { filter: '' } },
  { id: 'tokyo', name: 'Tokyo', style: { filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' } },
  { id: 'oslo', name: 'Oslo', style: { filter: 'contrast(0.9) saturate(0.8) brightness(1.1) sepia(0.1)' } },
  { id: 'rio', name: 'Rio', style: { filter: 'saturate(1.5) contrast(1.2) hue-rotate(-10deg)' } },
  { id: 'milan', name: 'Milan', style: { filter: 'contrast(1.2) sepia(0.2) brightness(0.9)' } },
  { id: 'jaipur', name: 'Jaipur', style: { filter: 'saturate(1.4) contrast(1.1) hue-rotate(-5deg) brightness(1.05)' } },
  { id: 'havana', name: 'Havana', style: { filter: 'sepia(0.4) contrast(1.3) saturate(1.1)' } },
  { id: 'seoul', name: 'Seoul', style: { filter: 'contrast(1.1) saturate(0.9) brightness(1.05) hue-rotate(5deg)' } },
  { id: 'cairo', name: 'Cairo', style: { filter: 'sepia(0.3) contrast(1.2) brightness(1.1)' } },
  { id: 'lagos', name: 'Lagos', style: { filter: 'saturate(1.6) contrast(1.3) brightness(0.9)' } },
];

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  aiEffect: 'none',
  filter: 'none',
  detailInvention: 25,
  denoise: 0,
  interpolation: false,
};

export const AUTO_ENHANCE_ADJUSTMENTS: Adjustments = {
  ...DEFAULT_ADJUSTMENTS,
  detailInvention: 50,
  denoise: 30,
  interpolation: false,
};

export const ENHANCEMENT_PRESETS: Preset[] = [
  {
    name: 'Ultra HD Boost',
    description: 'Strong upscaling for a clean, crisp 4K output.',
    settings: {
      aiEffect: 'none',
      filter: 'none',
      detailInvention: 55,
      denoise: 15,
      interpolation: false,
    }
  },
  {
    name: 'Cinematic Master',
    description: 'Adds dramatic flair with smooth motion and rich colors.',
    settings: {
      aiEffect: 'cinematic',
      filter: 'none',
      detailInvention: 65,
      denoise: 25,
      interpolation: true,
    }
  },
  {
    name: 'Natural Restore',
    description: 'Gently cleans and sharpens footage while preserving its original character.',
    settings: {
      aiEffect: 'none',
      filter: 'none',
      detailInvention: 30,
      denoise: 40,
      interpolation: false,
    }
  },
  {
    name: 'Night Vision',
    description: 'Brightens and aggressively denoises dark footage.',
    settings: {
      aiEffect: 'none',
      filter: 'oslo',
      detailInvention: 50,
      denoise: 75,
      interpolation: false,
    }
  },
  {
    name: 'Vintage Film',
    description: 'Simulates classic film stock with warm tones and smooth motion.',
    settings: {
      aiEffect: 'vintage',
      filter: 'havana',
      detailInvention: 40,
      denoise: 10,
      interpolation: true,
    }
  }
];