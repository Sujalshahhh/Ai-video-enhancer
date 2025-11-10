export enum ProcessStatus {
  IDLE,
  UPLOADING,
  PROCESSING,
  DONE,
  FINALIZING,
  ERROR,
}

export type EnhancementModel = 'real-esrgan';

export type AiEffect = 'none' | 'cinematic' | 'dreamy' | 'techno' | 'vintage' | 'noir' | 'cyberpunk' | 'faded';

export type FilterEffect = 'none' | 'tokyo' | 'oslo' | 'rio' | 'milan' | 'jaipur' | 'havana' | 'seoul' | 'cairo' | 'lagos';

export interface Adjustments {
  aiEffect: AiEffect;
  filter: FilterEffect;
  detailInvention: number;
  denoise: number;
  interpolation: boolean;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'error' | 'info' | 'success';
}

export interface Preset {
  name: string;
  description: string;
  settings: Adjustments;
}
