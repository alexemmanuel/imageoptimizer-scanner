export type OutputFormat = 'webp' | 'jpeg' | 'avif' | 'png';

export type TargetSizeMode = 'exact' | 'minimum' | 'maximum';

export type SharpenLevel = 'none' | 'subtle' | 'crisp';

export interface CompressionSettings {
  targetSizeKB: number;
  mode: TargetSizeMode; // 'exact' (~5KB), 'minimum' (>= 5KB), 'maximum' (<= 5KB)
  format: OutputFormat;
  smartDetectFormat?: boolean; // When enabled, chooses between WebP, AVIF, or JPEG based on image type and browser compatibility
  maxDimension: number | 'auto'; // 'auto' or numeric max px
  sharpen: SharpenLevel;
  preserveAspectRatio: boolean;
  smoothingQuality: 'high' | 'medium';
}

export interface ImageItem {
  id: string;
  name: string;
  originalFile?: File;
  originalUrl: string;
  originalSize: number; // in bytes
  originalWidth: number;
  originalHeight: number;
  originalType: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;

  // Processed data
  compressedBlob?: Blob;
  compressedUrl?: string;
  compressedSize?: number; // in bytes
  compressedWidth?: number;
  compressedHeight?: number;
  compressedFormat?: OutputFormat;
  detectedFormatReason?: string;
  processingTimeMs?: number;
  appliedQuality?: number; // 0-100
  compressionRatio?: number; // percentage saved, e.g. 98.5%
}

export interface BatchStats {
  totalCount: number;
  completedCount: number;
  processingCount: number;
  errorCount: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedBytes: number;
  savingsPercentage: number;
}
