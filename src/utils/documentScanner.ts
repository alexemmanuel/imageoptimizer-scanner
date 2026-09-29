import { jsPDF } from 'jspdf';
import { ScanPreset, ScanSettings, ScannedPage, CornerPoints } from '../types/scanner';

/**
 * Loads an image URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load document image.'));
    img.src = src;
  });
}

/**
 * Automatically inspects document canvas to determine the ideal scan preset
 * (Magic Color, B&W Photocopy, Clear Grayscale, or Photo & ID Card)
 */
export function analyzeDocumentAndDetectPreset(canvas: HTMLCanvasElement): {
  preset: ScanPreset;
  shadowRemoval: number;
  contrast: number;
  inkBoldness: number;
  reason: string;
} {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      preset: 'magic_color',
      shadowRemoval: 85,
      contrast: 15,
      inkBoldness: 45,
      reason: 'Auto-detected: Magic Color (Balanced document enhancement)',
    };
  }

  // Fast stride sample grid across document
  const stepX = Math.max(1, Math.floor(width / 70));
  const stepY = Math.max(1, Math.floor(height / 70));
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let totalSamples = 0;
  let colorSamples = 0;
  let blueInkSamples = 0;
  let redStampSamples = 0;
  let darkInkSamples = 0;
  let lightPaperSamples = 0;
  let midtoneSamples = 0;

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC;

      totalSamples++;

      if (chroma > 20) {
        colorSamples++;
        // Check for blue ballpoint pen ink
        if (b > r + 18 && b > g + 8) {
          blueInkSamples++;
        }
        // Check for red rubber stamp / seal ink
        if (r > g + 30 && r > b + 30) {
          redStampSamples++;
        }
      }

      if (lum < 70) {
        darkInkSamples++;
      } else if (lum > 180) {
        lightPaperSamples++;
      } else {
        midtoneSamples++;
      }
    }
  }

  const colorRatio = colorSamples / Math.max(1, totalSamples);
  const midtoneRatio = midtoneSamples / Math.max(1, totalSamples);
  const textContrastRatio = (darkInkSamples + lightPaperSamples) / Math.max(1, totalSamples);

  // Decision Heuristic:
  // 1. If colored strokes (signatures, rubber stamps, colored seals) are present:
  if (colorRatio > 0.012 || blueInkSamples > 8 || redStampSamples > 8) {
    let detail = 'Preserves official colored stamps & signatures';
    if (blueInkSamples > 8 && redStampSamples > 8) {
      detail = 'Identified blue pen signature & red rubber seal';
    } else if (blueInkSamples > 8) {
      detail = 'Identified blue ballpoint handwritten signature';
    } else if (redStampSamples > 8) {
      detail = 'Identified red rubber audit stamp';
    }
    return {
      preset: 'magic_color',
      shadowRemoval: 85,
      contrast: 18,
      inkBoldness: 45,
      reason: `Auto-detected: Magic Color (${detail})`,
    };
  }

  // 2. If high midtone ratio (continuous tone photograph or ID card):
  if (midtoneRatio > 0.42 && textContrastRatio < 0.42) {
    return {
      preset: 'photo_id',
      shadowRemoval: 55,
      contrast: 12,
      inkBoldness: 35,
      reason: 'Auto-detected: Photo & ID Card (Continuous-tone photographic elements)',
    };
  }

  // 3. Predominantly black text on paper with minimal color:
  if (textContrastRatio > 0.4 || darkInkSamples > 40) {
    return {
      preset: 'bw_clean',
      shadowRemoval: 90,
      contrast: 22,
      inkBoldness: 48,
      reason: 'Auto-detected: B&W Photocopy (High-contrast printed text & clean paper)',
    };
  }

  // 4. Default to Clear Grayscale for pencil / shaded forms
  return {
    preset: 'grayscale',
    shadowRemoval: 75,
    contrast: 15,
    inkBoldness: 40,
    reason: 'Auto-detected: Clear Grayscale (Balanced monochrome tonal reproduction)',
  };
}

/**
 * 4-Point Perspective Warp on Canvas 2D
 * Transforms an arbitrary quadrilateral into a rectangular document
 */
export function warpPerspective(
  sourceCanvas: HTMLCanvasElement,
  corners: CornerPoints,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  // Convert corners from percentage (0-100) to actual pixels
  const p0 = { x: (corners.tl[0] / 100) * srcW, y: (corners.tl[1] / 100) * srcH };
  const p1 = { x: (corners.tr[0] / 100) * srcW, y: (corners.tr[1] / 100) * srcH };
  const p2 = { x: (corners.br[0] / 100) * srcW, y: (corners.br[1] / 100) * srcH };
  const p3 = { x: (corners.bl[0] / 100) * srcW, y: (corners.bl[1] / 100) * srcH };

  // Calculate target dimensions from average edge lengths if not specified
  const topW = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const botW = Math.hypot(p2.x - p3.x, p2.y - p3.y);
  const leftH = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const rightH = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  const destW = Math.round(targetWidth || Math.max(topW, botW));
  const destH = Math.round(targetHeight || Math.max(leftH, rightH));

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = Math.max(100, destW);
  outputCanvas.height = Math.max(100, destH);
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas;

  // Bilinear subdivision mapping (split into triangles for canvas 2D rendering)
  const subdivisions = 12;
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return sourceCanvas;

  const getPt = (u: number, v: number) => {
    const topX = p0.x + (p1.x - p0.x) * u;
    const topY = p0.y + (p1.y - p0.y) * u;
    const botX = p3.x + (p2.x - p3.x) * u;
    const botY = p3.y + (p2.y - p3.y) * u;
    return {
      x: topX + (botX - topX) * v,
      y: topY + (botY - topY) * v,
    };
  };

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  for (let i = 0; i < subdivisions; i++) {
    for (let j = 0; j < subdivisions; j++) {
      const u0 = i / subdivisions;
      const v0 = j / subdivisions;
      const u1 = (i + 1) / subdivisions;
      const v1 = (j + 1) / subdivisions;

      const sp0 = getPt(u0, v0);
      const sp1 = getPt(u1, v0);
      const sp2 = getPt(u1, v1);
      const sp3 = getPt(u0, v1);

      const dx0 = u0 * destW;
      const dy0 = v0 * destH;
      const dx1 = u1 * destW;
      const dy1 = v1 * destH;
      const dw = dx1 - dx0;
      const dh = dy1 - dy0;

      // Draw quad slice approximation
      outCtx.save();
      outCtx.beginPath();
      outCtx.rect(dx0, dy0, dw + 0.5, dh + 0.5);
      outCtx.clip();

      const minX = Math.min(sp0.x, sp1.x, sp2.x, sp3.x);
      const minY = Math.min(sp0.y, sp1.y, sp2.y, sp3.y);
      const maxX = Math.max(sp0.x, sp1.x, sp2.x, sp3.x);
      const maxY = Math.max(sp0.y, sp1.y, sp2.y, sp3.y);

      outCtx.drawImage(
        sourceCanvas,
        minX,
        minY,
        Math.max(1, maxX - minX),
        Math.max(1, maxY - minY),
        dx0,
        dy0,
        dw,
        dh
      );
      outCtx.restore();
    }
  }

  return outputCanvas;
}

/**
 * Creates rotated canvas (0, 90, 180, 270 deg)
 */
export function rotateCanvas(canvas: HTMLCanvasElement, angleDeg: number): HTMLCanvasElement {
  const normAngle = ((angleDeg % 360) + 360) % 360;
  if (normAngle === 0) return canvas;

  const rotated = document.createElement('canvas');
  const isSwap = normAngle === 90 || normAngle === 270;
  rotated.width = isSwap ? canvas.height : canvas.width;
  rotated.height = isSwap ? canvas.width : canvas.height;

  const ctx = rotated.getContext('2d');
  if (!ctx) return canvas;

  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate((normAngle * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotated;
}

/**
 * Core Scanner Machine Pixel Processing Algorithm
 * Accurately models a physical office flatbed scanner:
 * - Shadow flattening (removes phone camera shadows)
 * - Paper background whitening
 * - Crisp ink enhancement (B&W or Magic Color)
 * - Unsharp masking
 */
export function processScannerImage(
  canvas: HTMLCanvasElement,
  settings: ScanSettings
): HTMLCanvasElement {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const pixelCount = width * height;

  // 1. Calculate luminance channel
  const luma = new Float32Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    // Standard sRGB perceptual luminance weights
    luma[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // 2. Background Illumination Equalizer (removes camera shadows & yellow lighting)
  // We approximate the localized background envelope with an efficient multi-sample grid
  const shadowStrength = settings.shadowRemoval / 100;
  const bgMap = new Float32Array(pixelCount);

  if (shadowStrength > 0.05) {
    const gridCols = Math.min(24, Math.max(8, Math.floor(width / 60)));
    const gridRows = Math.min(32, Math.max(8, Math.floor(height / 60)));
    const blockW = width / gridCols;
    const blockH = height / gridRows;
    const gridMax = new Float32Array(gridCols * gridRows);

    // Compute localized bright percentile (background paper level) in each cell
    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const startX = Math.floor(gx * blockW);
        const endX = Math.floor((gx + 1) * blockW);
        const startY = Math.floor(gy * blockH);
        const endY = Math.floor((gy + 1) * blockH);

        let sumHigh = 0;
        let countHigh = 0;
        let maxL = 0;

        for (let y = startY; y < endY; y += 2) {
          for (let x = startX; x < endX; x += 2) {
            const val = luma[y * width + x];
            if (val > maxL) maxL = val;
          }
        }

        // Target upper 80th-95th percentile
        const threshold = maxL * 0.85;
        for (let y = startY; y < endY; y += 2) {
          for (let x = startX; x < endX; x += 2) {
            const val = luma[y * width + x];
            if (val >= threshold) {
              sumHigh += val;
              countHigh++;
            }
          }
        }

        gridMax[gy * gridCols + gx] = countHigh > 0 ? sumHigh / countHigh : Math.max(160, maxL);
      }
    }

    // Bilinear interpolation of background brightness across entire image
    for (let y = 0; y < height; y++) {
      const gy = (y / height) * (gridRows - 1);
      const gy0 = Math.floor(gy);
      const gy1 = Math.min(gridRows - 1, gy0 + 1);
      const fy = gy - gy0;

      for (let x = 0; x < width; x++) {
        const gx = (x / width) * (gridCols - 1);
        const gx0 = Math.floor(gx);
        const gx1 = Math.min(gridCols - 1, gx0 + 1);
        const fx = gx - gx0;

        const b00 = gridMax[gy0 * gridCols + gx0];
        const b10 = gridMax[gy0 * gridCols + gx1];
        const b01 = gridMax[gy1 * gridCols + gx0];
        const b11 = gridMax[gy1 * gridCols + gx1];

        const top = b00 + (b10 - b00) * fx;
        const bot = b01 + (b11 - b01) * fx;
        bgMap[y * width + x] = Math.max(60, top + (bot - top) * fy);
      }
    }
  } else {
    bgMap.fill(240);
  }

  // Preset-specific rendering
  const preset = settings.preset;
  const userBrightness = settings.brightness; // -100 to 100
  const userContrast = settings.contrast; // -100 to 100
  const inkFactor = settings.inkBoldness / 100; // 0 to 1

  // Contrast factor helper
  const contrastFactor = (259 * (userContrast + 255)) / (255 * (259 - userContrast));

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lum = luma[i];
    const bg = bgMap[i];

    // Normalized luminance relative to local background (flattened 0-255)
    // Whitens paper background evenly like flatbed scanner lamp
    const normalizedLum = shadowStrength > 0.05
      ? Math.min(255, (lum / Math.max(40, bg)) * 245)
      : lum;

    if (preset === 'bw_clean') {
      // -------------------------------------------------------------
      // PRESET 1: B&W CLEAN (Crisp Photocopy / Laser Scanner)
      // Pure stark black text (#000000) on pure white paper (#ffffff)
      // -------------------------------------------------------------
      // Dynamic threshold influenced by ink boldness slider & local bg
      const baseThreshold = 185 + (inkFactor - 0.5) * 60 + (userBrightness * 0.4);
      const isInk = normalizedLum < baseThreshold;

      const finalVal = isInk ? 0 : 255;
      data[idx] = finalVal;
      data[idx + 1] = finalVal;
      data[idx + 2] = finalVal;
    } else if (preset === 'magic_color') {
      // -------------------------------------------------------------
      // PRESET 2: MAGIC COLOR (CamScanner Style Document)
      // Pure white paper + vibrant signatures, colored stamps, logos
      // -------------------------------------------------------------
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC; // Measure of color saturation

      // Background paper multiplier
      const scale = 255 / Math.max(60, bg);
      let nr = r * scale;
      let ng = g * scale;
      let nb = b * scale;

      // Detect if pixel is colored ink (stamp, signature, logo, highlighter)
      if (chroma > 18) {
        // Boost color vibrancy and saturation
        const boost = 1.35;
        const avg = (nr + ng + nb) / 3;
        nr = avg + (nr - avg) * boost;
        ng = avg + (ng - avg) * boost;
        nb = avg + (nb - avg) * boost;
      } else {
        // Neutral text / paper: sharpen contrast
        // Push paper toward pure white
        if (normalizedLum > 175) {
          const whitenFactor = (normalizedLum - 175) / 80;
          nr = nr + (255 - nr) * whitenFactor;
          ng = ng + (255 - ng) * whitenFactor;
          nb = nb + (255 - nb) * whitenFactor;
        } else {
          // Darken ink text for razor readability
          const darken = 1 - (inkFactor * 0.35);
          nr *= darken;
          ng *= darken;
          nb *= darken;
        }
      }

      // Apply brightness & contrast
      nr = contrastFactor * (nr - 128) + 128 + userBrightness;
      ng = contrastFactor * (ng - 128) + 128 + userBrightness;
      nb = contrastFactor * (nb - 128) + 128 + userBrightness;

      data[idx] = Math.min(255, Math.max(0, Math.round(nr)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(ng)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(nb)));
    } else if (preset === 'grayscale') {
      // -------------------------------------------------------------
      // PRESET 3: CLEAN GRAYSCALE (Continuous-Tone Document)
      // -------------------------------------------------------------
      let gray = normalizedLum;

      // Whiten light paper areas
      if (gray > 180) {
        gray = 180 + (gray - 180) * 1.5;
      }
      // Deepen dark text
      if (gray < 110) {
        gray = gray * (1 - inkFactor * 0.3);
      }

      gray = contrastFactor * (gray - 128) + 128 + userBrightness;
      const gVal = Math.min(255, Math.max(0, Math.round(gray)));

      data[idx] = gVal;
      data[idx + 1] = gVal;
      data[idx + 2] = gVal;
    } else if (preset === 'photo_id') {
      // -------------------------------------------------------------
      // PRESET 4: PHOTO / ID CARD (Passport, Driving License, Photo)
      // -------------------------------------------------------------
      const bgScale = Math.min(1.4, 255 / Math.max(100, bg));
      let pr = r * (1 + (bgScale - 1) * 0.45);
      let pg = g * (1 + (bgScale - 1) * 0.45);
      let pb = b * (1 + (bgScale - 1) * 0.45);

      // Contrast & brightness
      pr = contrastFactor * (pr - 128) + 128 + userBrightness;
      pg = contrastFactor * (pg - 128) + 128 + userBrightness;
      pb = contrastFactor * (pb - 128) + 128 + userBrightness;

      data[idx] = Math.min(255, Math.max(0, Math.round(pr)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(pg)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(pb)));
    } else {
      // -------------------------------------------------------------
      // PRESET 5: ORIGINAL CLEANED
      // -------------------------------------------------------------
      let or = r;
      let og = g;
      let ob = b;

      if (shadowStrength > 0.1) {
        const factor = Math.min(1.3, 240 / Math.max(120, bg));
        or *= factor;
        og *= factor;
        ob *= factor;
      }

      or = contrastFactor * (or - 128) + 128 + userBrightness;
      og = contrastFactor * (og - 128) + 128 + userBrightness;
      ob = contrastFactor * (ob - 128) + 128 + userBrightness;

      data[idx] = Math.min(255, Math.max(0, Math.round(or)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(og)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(ob)));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 3. Document Micro-Sharpness Filter (Unsharp Mask for clean letters)
  if (settings.sharpness > 5 && preset !== 'bw_clean') {
    applyDocumentSharpness(ctx, width, height, settings.sharpness / 100);
  }

  return canvas;
}

/**
 * Edge-preserving high-frequency boost for printed letters & typography
 */
function applyDocumentSharpness(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
): void {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);

    const w = strength * 0.35;
    const center = 1 + 4 * w;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = copy[((y - 1) * width + x) * 4 + c];
          const bot = copy[((y + 1) * width + x) * 4 + c];
          const left = copy[(y * width + (x - 1)) * 4 + c];
          const right = copy[(y * width + (x + 1)) * 4 + c];
          const mid = copy[idx + c];

          const val = mid * center - (top + bot + left + right) * w;
          data[idx + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('Sharpness skipped:', e);
  }
}

/**
 * Executes a full scan on a single document page
 */
export async function executeDocumentScan(
  page: ScannedPage
): Promise<{
  blob: Blob;
  url: string;
  width: number;
  height: number;
  scanTimeMs: number;
  detectedReason?: string;
  resolvedSettings?: ScanSettings;
}> {
  const startTime = performance.now();
  const sourceUrl = page.originalFile ? URL.createObjectURL(page.originalFile) : page.originalUrl;
  const isTemporaryUrl = !!page.originalFile;

  try {
    const img = await loadImage(sourceUrl);

    // 1. Initial base canvas
    let canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create scanner context');
    ctx.drawImage(img, 0, 0);

    // 2. Perspective deskew & crop if custom corners are set
    if (page.corners) {
      canvas = warpPerspective(canvas, page.corners);
    }

    // 3. Rotation (0, 90, 180, 270)
    if (page.rotation !== 0) {
      canvas = rotateCanvas(canvas, page.rotation);
    }

    // Dynamic auto-detection of optimal preset & parameters if enabled
    let effectiveSettings = { ...page.settings };
    let detectedReason: string | undefined;

    if (page.settings.autoDetectPreset) {
      const autoAnalysis = analyzeDocumentAndDetectPreset(canvas);
      effectiveSettings = {
        ...effectiveSettings,
        preset: autoAnalysis.preset,
        shadowRemoval: autoAnalysis.shadowRemoval,
        contrast: autoAnalysis.contrast,
        inkBoldness: autoAnalysis.inkBoldness,
      };
      detectedReason = autoAnalysis.reason;
    }

    // 4. Run Scanner Machine Filters (Shadow removal, paper whitening, Magic Color / B&W)
    canvas = processScannerImage(canvas, effectiveSettings);

    // 5. Output blob
    const mime = effectiveSettings.preset === 'bw_clean' ? 'image/png' : 'image/jpeg';
    const quality = effectiveSettings.preset === 'bw_clean' ? 1.0 : 0.92;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Scanner export failed'))),
        mime,
        quality
      );
    });

    const url = URL.createObjectURL(blob);
    const endTime = performance.now();

    return {
      blob,
      url,
      width: canvas.width,
      height: canvas.height,
      scanTimeMs: Math.round(endTime - startTime),
      detectedReason,
      resolvedSettings: effectiveSettings,
    };
  } finally {
    if (isTemporaryUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
  }
}

/**
 * Generates a clean, professional multi-page PDF document using jsPDF
 */
export async function exportPagesToPdf(
  pages: ScannedPage[],
  filename: string = 'scanned-document.pdf',
  paperFormat: 'a4' | 'letter' = 'a4'
): Promise<Blob> {
  const readyPages = pages.filter((p) => p.status === 'done' && p.processedUrl);
  if (readyPages.length === 0) {
    throw new Error('No scanned pages ready to export.');
  }

  // Create jsPDF document instance (pt or mm)
  // Standard A4 is 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperFormat,
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8; // 8mm printable margin

  for (let i = 0; i < readyPages.length; i++) {
    if (i > 0) {
      doc.addPage(paperFormat, 'portrait');
    }

    const page = readyPages[i];
    const imgDataUrl = page.processedUrl!;
    const imgW = page.processedWidth || 1000;
    const imgH = page.processedHeight || 1400;

    // Maintain aspect ratio within page printable area
    const availableW = pageWidth - margin * 2;
    const availableH = pageHeight - margin * 2;

    const scale = Math.min(availableW / imgW, availableH / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;

    const x = margin + (availableW - renderW) / 2;
    const y = margin + (availableH - renderH) / 2;

    doc.addImage(imgDataUrl, 'JPEG', x, y, renderW, renderH, undefined, 'FAST');
  }

  return doc.output('blob');
}
