export type ScanPreset = 'magic_color' | 'bw_clean' | 'grayscale' | 'photo_id' | 'original';

export type PaperSize = 'a4' | 'letter' | 'auto';

export interface CornerPoints {
  tl: [number, number]; // [x, y] in percentage (0-100) or pixel coordinates
  tr: [number, number];
  br: [number, number];
  bl: [number, number];
}

export interface ScanSettings {
  autoDetectPreset: boolean; // Auto chooses best scanning preset & settings for document
  preset: ScanPreset;
  shadowRemoval: number; // 0 to 100
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  inkBoldness: number; // 0 to 100 (threshold/weight)
  sharpness: number; // 0 to 100 (unsharp mask)
  autoRotate: boolean;
  paperSize: PaperSize;
}

export interface ScannedPage {
  id: string;
  name: string;
  originalFile?: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  rotation: number; // 0, 90, 180, 270
  corners?: CornerPoints;

  // Processed scan
  processedBlob?: Blob;
  processedUrl?: string;
  processedWidth?: number;
  processedHeight?: number;
  status: 'idle' | 'scanning' | 'done' | 'error';
  errorMessage?: string;

  // Page specific settings override
  settings: ScanSettings;
  detectedReason?: string;
  scanTimeMs?: number;
}
