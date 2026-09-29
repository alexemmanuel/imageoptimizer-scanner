import { CompressionSettings, OutputFormat, SharpenLevel } from '../types/image';

/**
 * Checks if the browser supports AVIF canvas export
 */
let avifSupportedCache: boolean | null = null;
export async function checkAvifSupport(): Promise<boolean> {
  if (avifSupportedCache !== null) return avifSupportedCache;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/avif', 0.5);
    });
    avifSupportedCache = blob !== null && blob.type === 'image/avif';
  } catch {
    avifSupportedCache = false;
  }
  return avifSupportedCache;
}

/**
 * Checks if the browser supports WebP canvas export
 */
let webpSupportedCache: boolean | null = null;
export async function checkWebpSupport(): Promise<boolean> {
  if (webpSupportedCache !== null) return webpSupportedCache;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.5);
    });
    webpSupportedCache = blob !== null && blob.type === 'image/webp';
  } catch {
    webpSupportedCache = false;
  }
  return webpSupportedCache;
}

/**
 * Returns summary of current browser codec capabilities
 */
export async function getBrowserCodecSupport(): Promise<{
  avif: boolean;
  webp: boolean;
  jpeg: boolean;
}> {
  const [avif, webp] = await Promise.all([checkAvifSupport(), checkWebpSupport()]);
  return { avif, webp, jpeg: true };
}

export interface SmartFormatDecision {
  format: 'webp' | 'avif' | 'jpeg';
  reason: string;
  badgeLabel: string;
}

/**
 * Intelligently chooses between WebP, AVIF, or JPEG based on:
 * 1. Original image type (transparency/graphic vs photographic)
 * 2. Real-time browser hardware and canvas codec export compatibility
 */
export async function determineSmartFormat(
  originalType: string,
  fileName?: string
): Promise<SmartFormatDecision> {
  const [avifSupported, webpSupported] = await Promise.all([
    checkAvifSupport(),
    checkWebpSupport(),
  ]);

  const mime = (originalType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  const isAlphaOrGraphic =
    mime.includes('png') ||
    mime.includes('gif') ||
    mime.includes('svg') ||
    mime.includes('icon') ||
    mime.includes('ico') ||
    name.endsWith('.png') ||
    name.endsWith('.gif') ||
    name.endsWith('.svg');

  // Case 1: Transparent or graphic image (PNG, GIF, SVG, Icons)
  // Converting transparent graphics to JPEG causes solid/black background artifacts.
  // We prioritize AVIF if supported for highest density, or WebP for universal alpha support.
  if (isAlphaOrGraphic) {
    if (avifSupported) {
      return {
        format: 'avif',
        reason: 'AVIF chosen: Next-gen alpha compression preserves crisp graphics & transparency.',
        badgeLabel: 'Smart AVIF (Graphic)',
      };
    }
    if (webpSupported) {
      return {
        format: 'webp',
        reason: 'WebP chosen: Universal browser support preserves transparency with zero dark fringes.',
        badgeLabel: 'Smart WebP (Graphic)',
      };
    }
    return {
      format: 'jpeg',
      reason: 'JPEG chosen: Fallback export format.',
      badgeLabel: 'Smart JPEG (Fallback)',
    };
  }

  // Case 2: Photographic, Camera or existing JPEG/HEIC image
  // For photographic content, AVIF provides unmatched compression at small KB targets (5-20KB).
  // If AVIF is supported by the browser, it delivers the sharpest gradients and finest textures.
  if (avifSupported) {
    return {
      format: 'avif',
      reason: 'AVIF chosen: Browser supports ultra-dense next-gen compression for photographic detail.',
      badgeLabel: 'Smart AVIF (Photo)',
    };
  }

  // If AVIF is not supported in this browser, use WebP for modern efficiency
  if (webpSupported) {
    return {
      format: 'webp',
      reason: 'WebP chosen: High-efficiency compression (~30% smaller than JPEG with cleaner edges).',
      badgeLabel: 'Smart WebP (Photo)',
    };
  }

  // Universal fallback for legacy environments
  return {
    format: 'jpeg',
    reason: 'JPEG chosen: Standard universal photographic format.',
    badgeLabel: 'Smart JPEG (Photo)',
  };
}

/**
 * Loads an image from a URL or File into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

/**
 * Apply subtle unsharp mask filter to canvas to preserve crispness at small resolutions
 */
function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, level: SharpenLevel) {
  if (level === 'none') return;

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);

    // Subtle vs Crisp kernel strength
    const weight = level === 'crisp' ? 0.28 : 0.16;
    const center = 1 + (4 * weight);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = copy[((y - 1) * width + x) * 4 + c];
          const bottom = copy[((y + 1) * width + x) * 4 + c];
          const left = copy[(y * width + (x - 1)) * 4 + c];
          const right = copy[(y * width + (x + 1)) * 4 + c];
          const mid = copy[idx + c];

          const sharpened = (mid * center) - ((top + bottom + left + right) * weight);
          data[idx + c] = Math.min(255, Math.max(0, sharpened));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Canvas might be tainted or security policy restricted; continue gracefully
    console.warn('Sharpen filter skipped:', e);
  }
}

/**
 * Export canvas to blob with given mime type and quality
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas export failed'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Helper to get MIME type string
 */
export async function getEffectiveMimeType(format: OutputFormat): Promise<string> {
  if (format === 'avif') {
    const supported = await checkAvifSupport();
    return supported ? 'image/avif' : 'image/webp';
  }
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'image/webp';
  }
}

/**
 * Estimate initial scale factor based on target size in KB and format
 */
function estimateInitialDimensions(
  origW: number,
  origH: number,
  targetBytes: number,
  format: OutputFormat,
  maxDimension: number | 'auto'
): { width: number; height: number } {
  // Approximate bytes per pixel for reasonable quality (0.65 - 0.75):
  // WebP ~ 0.06 - 0.09 bytes/pixel
  // JPEG ~ 0.08 - 0.12 bytes/pixel
  // AVIF ~ 0.04 - 0.07 bytes/pixel
  // PNG ~ 0.3 - 0.7 bytes/pixel
  let bytesPerPixel = 0.07;
  if (format === 'webp') bytesPerPixel = 0.065;
  else if (format === 'avif') bytesPerPixel = 0.055;
  else if (format === 'jpeg') bytesPerPixel = 0.085;
  else if (format === 'png') bytesPerPixel = 0.35;

  const estimatedTotalPixels = Math.max(1600, targetBytes / bytesPerPixel);
  const aspect = origW / origH;

  let targetW = Math.round(Math.sqrt(estimatedTotalPixels * aspect));
  let targetH = Math.round(targetW / aspect);

  // Don't upscale
  if (targetW > origW || targetH > origH) {
    targetW = origW;
    targetH = origH;
  }

  // Apply maxDimension limit if user set one
  if (typeof maxDimension === 'number') {
    if (targetW > maxDimension || targetH > maxDimension) {
      if (aspect >= 1) {
        targetW = maxDimension;
        targetH = Math.round(maxDimension / aspect);
      } else {
        targetH = maxDimension;
        targetW = Math.round(maxDimension * aspect);
      }
    }
  }

  // Ensure minimum dimensions
  targetW = Math.max(32, targetW);
  targetH = Math.max(32, targetH);

  return { width: targetW, height: targetH };
}

/**
 * Renders downscaled image with stepped interpolation and sharpening
 */
function renderCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  settings: CompressionSettings
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas 2D context');

  // Fill transparent background for JPEG with white to avoid black background
  if (settings.format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = settings.smoothingQuality;

  // Multi-step downscaling for superior sharpness if shrinking by > 2.5x
  const curW = img.naturalWidth;
  const curH = img.naturalHeight;

  if (curW > targetW * 2.5 && curH > targetH * 2.5) {
    let stepCanvas = document.createElement('canvas');
    let stepCtx = stepCanvas.getContext('2d');
    let stepW = Math.floor(curW * 0.5);
    let stepH = Math.floor(curH * 0.5);
    stepCanvas.width = stepW;
    stepCanvas.height = stepH;

    if (stepCtx) {
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(img, 0, 0, stepW, stepH);

      while (stepW * 0.5 > targetW && stepH * 0.5 > targetH) {
        const nextCanvas = document.createElement('canvas');
        const nextW = Math.floor(stepW * 0.5);
        const nextH = Math.floor(stepH * 0.5);
        nextCanvas.width = nextW;
        nextCanvas.height = nextH;
        const nextCtx = nextCanvas.getContext('2d');
        if (nextCtx) {
          nextCtx.imageSmoothingEnabled = true;
          nextCtx.imageSmoothingQuality = 'high';
          nextCtx.drawImage(stepCanvas, 0, 0, nextW, nextH);
          stepCanvas = nextCanvas;
          stepW = nextW;
          stepH = nextH;
        } else {
          break;
        }
      }
      ctx.drawImage(stepCanvas, 0, 0, targetW, targetH);
    } else {
      ctx.drawImage(img, 0, 0, targetW, targetH);
    }
  } else {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  // Apply subtle micro-contrast sharpening to make the 5 KB result pop
  applySharpen(ctx, targetW, targetH, settings.sharpen);

  return canvas;
}

/**
 * Guarantees minimum size by padding a safe lossless comment payload if below minimum floor
 */
async function ensureMinimumSize(blob: Blob, targetBytes: number, format: OutputFormat): Promise<Blob> {
  if (blob.size >= targetBytes) return blob;

  const diff = targetBytes - blob.size;
  // If slightly under targetBytes (e.g. requested >= 5000 bytes, got 4800 bytes),
  // we pad with non-destructive binary comment / trailing zero-padding or return the blob if format supports it
  const arrayBuffer = await blob.arrayBuffer();
  const originalBytes = new Uint8Array(arrayBuffer);

  // For JPEG, we can insert an APP1 / COM marker or pad safely
  // Modern image viewers ignore trailing bytes after EOI (0xFF 0xD9) in JPEG, or RIFF chunk padding in WebP
  if (format === 'jpeg') {
    // Append safe trailing zeros or padding metadata block
    const padded = new Uint8Array(originalBytes.length + diff);
    padded.set(originalBytes, 0);
    // Pad with benign null bytes
    return new Blob([padded], { type: 'image/jpeg' });
  } else if (format === 'webp') {
    // WebP handles trailing null padding safely
    const padded = new Uint8Array(originalBytes.length + diff);
    padded.set(originalBytes, 0);
    return new Blob([padded], { type: 'image/webp' });
  } else {
    const padded = new Uint8Array(originalBytes.length + diff);
    padded.set(originalBytes, 0);
    return new Blob([padded], { type: blob.type });
  }
}

/**
 * Main Compression and Resizing Engine
 * Optimizes an image to hit the target file size (e.g. 5 KB minimum/exact/maximum)
 * while preserving maximum visual clarity and sharpness.
 */
export async function optimizeImage(
  imageSource: string | File,
  settings: CompressionSettings
): Promise<{
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number;
  processingTimeMs: number;
  detectedReason?: string;
}> {
  const startTime = performance.now();

  let srcUrl: string;
  let shouldRevokeSrc = false;
  if (typeof imageSource === 'string') {
    srcUrl = imageSource;
  } else {
    srcUrl = URL.createObjectURL(imageSource);
    shouldRevokeSrc = true;
  }

  try {
    const img = await loadImage(srcUrl);
    const origW = img.naturalWidth;
    const origH = img.naturalHeight;
    const targetBytes = Math.max(1024, Math.round(settings.targetSizeKB * 1024));

    // Dynamic Smart Detect format resolution if enabled
    let effectiveFormat = settings.format;
    let smartReason: string | undefined;

    if (settings.smartDetectFormat) {
      const type = typeof imageSource === 'object' && 'type' in imageSource ? imageSource.type : '';
      const name = typeof imageSource === 'object' && 'name' in imageSource ? imageSource.name : '';
      const decision = await determineSmartFormat(type, name);
      effectiveFormat = decision.format;
      smartReason = decision.reason;
    }

    const effectiveSettings: CompressionSettings = {
      ...settings,
      format: effectiveFormat,
    };

    const mimeType = await getEffectiveMimeType(effectiveFormat);

    // Initial dimension estimation
    let { width: currentW, height: currentH } = estimateInitialDimensions(
      origW,
      origH,
      targetBytes,
      effectiveFormat,
      settings.maxDimension
    );

    let bestBlob: Blob | null = null;
    let bestQuality = 0.75;
    let bestW = currentW;
    let bestH = currentH;
    let bestDiff = Infinity;

    // Search algorithm to find ideal (scale, quality)
    // We run 3 to 6 targeted iterations
    const maxIterations = effectiveFormat === 'png' ? 3 : 6;
    let lowQ = 0.25;
    let highQ = 0.95;
    let curQ = 0.75;

    let canvas = renderCanvas(img, currentW, currentH, effectiveSettings);

    for (let iter = 0; iter < maxIterations; iter++) {
      const testBlob = await canvasToBlob(canvas, mimeType, curQ);
      const testSize = testBlob.size;
      const diff = Math.abs(testSize - targetBytes);

      // Check fitness based on mode
      let isGoodFit = false;
      if (settings.mode === 'minimum') {
        // Must be >= targetBytes
        if (testSize >= targetBytes && testSize <= targetBytes * 1.25) {
          isGoodFit = true;
        }
      } else if (settings.mode === 'maximum') {
        // Must be <= targetBytes
        if (testSize <= targetBytes && testSize >= targetBytes * 0.8) {
          isGoodFit = true;
        }
      } else {
        // Exact mode: within 10%
        if (diff < targetBytes * 0.1) {
          isGoodFit = true;
        }
      }

      if (diff < bestDiff || (settings.mode === 'minimum' && testSize >= targetBytes && (!bestBlob || bestBlob.size < targetBytes || testSize < bestBlob.size))) {
        bestBlob = testBlob;
        bestQuality = curQ;
        bestW = currentW;
        bestH = currentH;
        bestDiff = diff;
      }

      if (isGoodFit && iter >= 2) {
        bestBlob = testBlob;
        bestQuality = curQ;
        bestW = currentW;
        bestH = currentH;
        break;
      }

      // Adjust quality or dimensions for next iteration
      if (settings.mode === 'minimum') {
        if (testSize < targetBytes) {
          // Too small: increase quality or increase resolution
          if (curQ < 0.9) {
            lowQ = curQ;
            curQ = (curQ + highQ) / 2;
          } else {
            // Quality is already high; bump resolution by 15%
            currentW = Math.min(origW, Math.round(currentW * 1.18));
            currentH = Math.min(origH, Math.round(currentH * 1.18));
            canvas = renderCanvas(img, currentW, currentH, settings);
            curQ = 0.75;
            lowQ = 0.3;
            highQ = 0.95;
          }
        } else {
          // Over the target: gently reduce to come closer to minimum floor
          highQ = curQ;
          curQ = (curQ + lowQ) / 2;
        }
      } else if (settings.mode === 'maximum') {
        if (testSize > targetBytes) {
          // Too large: reduce quality or scale down
          if (curQ > 0.35) {
            highQ = curQ;
            curQ = (curQ + lowQ) / 2;
          } else {
            // Quality reached lower comfort limit; shrink dimensions by 15% to maintain crispness
            currentW = Math.max(32, Math.round(currentW * 0.85));
            currentH = Math.max(32, Math.round(currentH * 0.85));
            canvas = renderCanvas(img, currentW, currentH, settings);
            curQ = 0.7;
            lowQ = 0.25;
            highQ = 0.9;
          }
        } else {
          // Below cap: try increasing quality toward cap
          lowQ = curQ;
          curQ = (curQ + highQ) / 2;
        }
      } else {
        // Exact mode
        if (testSize > targetBytes) {
          if (curQ > 0.4) {
            highQ = curQ;
            curQ = (curQ + lowQ) / 2;
          } else {
            currentW = Math.max(32, Math.round(currentW * 0.88));
            currentH = Math.max(32, Math.round(currentH * 0.88));
            canvas = renderCanvas(img, currentW, currentH, settings);
            curQ = 0.7;
          }
        } else {
          if (curQ < 0.9) {
            lowQ = curQ;
            curQ = (curQ + highQ) / 2;
          } else {
            currentW = Math.min(origW, Math.round(currentW * 1.12));
            currentH = Math.min(origH, Math.round(currentH * 1.12));
            canvas = renderCanvas(img, currentW, currentH, settings);
            curQ = 0.7;
          }
        }
      }
    }

    if (!bestBlob) {
      bestBlob = await canvasToBlob(canvas, mimeType, 0.75);
    }

    // If Minimum mode is requested and it's still under targetBytes, guarantee the floor
    if (settings.mode === 'minimum' && bestBlob.size < targetBytes) {
      bestBlob = await ensureMinimumSize(bestBlob, targetBytes, effectiveFormat);
    }

    const compressedUrl = URL.createObjectURL(bestBlob);
    const endTime = performance.now();

    return {
      blob: bestBlob,
      url: compressedUrl,
      size: bestBlob.size,
      width: bestW,
      height: bestH,
      format: effectiveFormat,
      quality: Math.round(bestQuality * 100),
      processingTimeMs: Math.round(endTime - startTime),
      detectedReason: smartReason,
    };
  } finally {
    if (shouldRevokeSrc) {
      URL.revokeObjectURL(srcUrl);
    }
  }
}

/**
 * Format bytes into human-readable string (e.g. 5.12 KB, 1.4 MB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
