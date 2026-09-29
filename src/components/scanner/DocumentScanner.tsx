import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  RotateCw,
  RotateCcw,
  Sliders,
  Check,
  Eye,
  FileCheck2,
  Trash2,
  Plus,
  Zap,
  Printer,
  Layers,
  HelpCircle,
  FileDown,
  Wand2
} from 'lucide-react';
import { ScanPreset, ScanSettings, ScannedPage } from '../../types/scanner';
import {
  executeDocumentScan,
  exportPagesToPdf,
} from '../../utils/documentScanner';
import {
  SAMPLE_DOCUMENTS,
  loadSampleDocumentFile,
  SampleDocumentItem,
} from '../../utils/sampleDocuments';

interface DocumentScannerProps {
  onSendToOptimizer?: (file: File) => void;
  onOpenGuide: () => void;
  theme?: 'dark' | 'light';
}

const PRESET_OPTIONS: { id: ScanPreset; label: string; desc: string; icon: string; tag?: string }[] = [
  {
    id: 'magic_color',
    label: 'Magic Color',
    desc: 'Pure white paper, vivid signatures & official rubber stamps',
    icon: '✨',
    tag: 'Color & Stamps',
  },
  {
    id: 'bw_clean',
    label: 'B&W Photocopy',
    desc: 'Crisp deep black text, removes all shadows, creases & bleed',
    icon: '📄',
    tag: 'Laser B&W',
  },
  {
    id: 'grayscale',
    label: 'Clear Grayscale',
    desc: 'Balanced monochrome for pencil sketches, forms & watermarks',
    icon: '📑',
  },
  {
    id: 'photo_id',
    label: 'Photo & ID Card',
    desc: 'Natural continuous tone for passports, badges & licenses',
    icon: '🪪',
  },
  {
    id: 'original',
    label: 'Original Cleaned',
    desc: 'Minimal flattening, keeps original authentic camera tones',
    icon: '📷',
  },
];

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onSendToOptimizer,
  onOpenGuide,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [comparisonSplit, setComparisonSplit] = useState<number>(50); // 0 to 100
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'processed' | 'original'>('split');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoLoadedSampleRef = useRef<boolean>(false);

  const activePage = pages[activePageIndex] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Run scanner engine on a single page
  const scanPage = useCallback(
    async (pageToScan: ScannedPage): Promise<ScannedPage> => {
      try {
        const result = await executeDocumentScan(pageToScan);
        return {
          ...pageToScan,
          status: 'done',
          processedBlob: result.blob,
          processedUrl: result.url,
          processedWidth: result.width,
          processedHeight: result.height,
          scanTimeMs: result.scanTimeMs,
          detectedReason: result.detectedReason,
          settings: result.resolvedSettings || pageToScan.settings,
        };
      } catch (err) {
        console.error('Document scan failed:', err);
        return {
          ...pageToScan,
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Scan failed',
        };
      }
    },
    []
  );

  // Process selected files into ScannedPage objects
  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsScanning(true);

    const newPages: ScannedPage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((r) => {
        img.onload = r;
      });

      const page: ScannedPage = {
        id: `page-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        originalFile: file,
        originalUrl: url,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        rotation: 0,
        status: 'scanning',
        settings: {
          autoDetectPreset: false, // User choice: defaults to manual (Magic / B&W), toggle ON for auto detection
          preset: 'magic_color',
          shadowRemoval: 85,
          brightness: 0,
          contrast: 15,
          inkBoldness: 45,
          sharpness: 60,
          autoRotate: true,
          paperSize: 'a4',
        },
      };

      const scanned = await scanPage(page);
      newPages.push(scanned);
    }

    setPages((prev) => [...prev, ...newPages]);
    if (pages.length === 0 && newPages.length > 0) {
      setActivePageIndex(0);
    }
    setIsScanning(false);
    showToast(`Scanned ${newPages.length} document ${newPages.length === 1 ? 'page' : 'pages'} successfully!`);
  };

  // Pre-load sample document on first mount so the user immediately sees the scanner machine,
  // the Auto Scan Detect switch, and the Magic Color / B&W presets in action
  useEffect(() => {
    let isMounted = true;
    if (pages.length === 0 && !hasAutoLoadedSampleRef.current) {
      hasAutoLoadedSampleRef.current = true;
      (async () => {
        try {
          const sample = SAMPLE_DOCUMENTS[0];
          const file = await loadSampleDocumentFile(sample);
          if (isMounted) {
            await handleFiles([file]);
          }
        } catch (err) {
          console.warn('Could not auto-load sample document:', err);
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Re-scan active page whenever its settings or rotation changes
  const updateActivePageSettings = async (partialSettings: Partial<ScanSettings>) => {
    if (!activePage) return;
    const updatedPage: ScannedPage = {
      ...activePage,
      status: 'scanning',
      settings: {
        ...activePage.settings,
        ...partialSettings,
      },
    };

    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? updatedPage : p))
    );

    const rescanned = await scanPage(updatedPage);
    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? rescanned : p))
    );
  };

  // Rotate active page
  const rotateActivePage = async (angleDelta: number) => {
    if (!activePage) return;
    const newRotation = (((activePage.rotation + angleDelta) % 360) + 360) % 360;
    const updatedPage: ScannedPage = {
      ...activePage,
      rotation: newRotation,
      status: 'scanning',
    };

    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? updatedPage : p))
    );

    const rescanned = await scanPage(updatedPage);
    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? rescanned : p))
    );
  };

  // Load a built-in sample document
  const handleLoadSampleDoc = async (sample: SampleDocumentItem) => {
    const file = await loadSampleDocumentFile(sample);
    await handleFiles([file]);
  };

  // Split-slider pointer interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDraggingSplit(true);
    updateSplit(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSplit) return;
    updateSplit(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDraggingSplit(false);
  };

  const updateSplit = (clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setComparisonSplit(percent);
  };

  // Download Single Page Image
  const handleDownloadSingle = () => {
    if (!activePage || !activePage.processedUrl) return;
    const ext = activePage.settings.preset === 'bw_clean' ? 'png' : 'jpg';
    const baseName = activePage.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = activePage.processedUrl;
    a.download = `${baseName}-scanned.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded scanned document image.');
  };

  // Export all pages as PDF
  const handleExportPdf = async () => {
    const readyPages = pages.filter((p) => p.status === 'done' && p.processedUrl);
    if (readyPages.length === 0) return;

    setIsExportingPdf(true);
    try {
      const pdfBlob = await exportPagesToPdf(readyPages, 'wildlogic-scanned-document.pdf', 'a4');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wildlogic-scanned-${readyPages.length}pages.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${readyPages.length}-page PDF document!`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF export failed.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Send to wildlogic Image Optimizer
  const handleSendToOptimizer = () => {
    if (!activePage || !activePage.processedBlob || !onSendToOptimizer) return;
    const ext = activePage.settings.preset === 'bw_clean' ? 'png' : 'jpg';
    const mime = activePage.settings.preset === 'bw_clean' ? 'image/png' : 'image/jpeg';
    const baseName = activePage.name.replace(/\.[^/.]+$/, '');
    const file = new File([activePage.processedBlob], `${baseName}-scanned.${ext}`, { type: mime });
    onSendToOptimizer(file);
    showToast('Sent scanned document to wildlogic Image Optimizer!');
  };

  // Remove Page
  const handleRemovePage = (index: number) => {
    setPages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activePageIndex >= next.length) {
        setActivePageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Clear All
  const handleClearAll = () => {
    pages.forEach((p) => {
      if (p.originalUrl) URL.revokeObjectURL(p.originalUrl);
      if (p.processedUrl) URL.revokeObjectURL(p.processedUrl);
    });
    setPages([]);
    setActivePageIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-2.5 bg-blue-600/95 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-xl shadow-blue-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Header Banner & Subtitle */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b transition-colors ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Printer className="w-4 h-4" />
            </span>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Flatbed Optical Document Scanner
            </h2>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              Real Scanner Machine Output
            </span>
          </div>
          <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Upload photos of documents, receipts, contracts, or ID cards. The scanner eliminates camera shadows, whitens paper, sharpens text ink, and preserves vibrant stamps &amp; signatures just like an office flatbed scanner.
          </p>
        </div>

        {/* Global Scanner Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      {pages.length === 0 ? (
        /* Empty State & Upload Dropzone */
        <div
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center space-y-6 transition-colors ${
            isDark
              ? 'bg-[#121826] border-slate-800'
              : 'bg-white border-slate-300 shadow-sm'
          }`}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-inner">
            <Printer className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Drop Document Photo or Scan Sheet Here
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Supports invoices, contracts, receipts, certificates, passports, or ID cards. The scanner machine automatically flattens lighting gradients and produces laser-grade scanned copies.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select Document from Device</span>
            </button>
          </div>

          {/* 1-Click Sample Documents for Quick Testing */}
          <div
            className={`pt-6 border-t max-w-2xl mx-auto space-y-3 transition-colors ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Or test immediately with authentic sample documents:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSampleDoc(sample)}
                  className={`p-3 border rounded-xl text-left transition-all cursor-pointer group flex items-start gap-3 ${
                    isDark
                      ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-blue-500/50'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-blue-400 shadow-xs'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg border text-blue-500 group-hover:scale-105 transition-transform ${
                      isDark ? 'bg-blue-950/60 border-blue-800/50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold transition-colors ${
                        isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                      }`}
                    >
                      {sample.category}
                    </div>
                    <div className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {sample.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Document Scanner Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Flatbed Scanner Glass Viewport & Multi-page strip */}
          <div className="lg:col-span-8 space-y-4">
            {/* Flatbed Scanner Frame Container */}
            <div
              className={`border-2 rounded-2xl overflow-hidden shadow-2xl relative transition-colors ${
                isDark ? 'bg-[#0b0f17] border-slate-800/90' : 'bg-slate-900 border-slate-700'
              }`}
            >
              {/* Scanner Top Bezel with Model & Status */}
              <div className="px-4 py-2.5 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-slate-300 font-semibold text-[11px]">
                    FLATBED 600-DPI OPTICAL PLATEN
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                    {activePage?.name}
                  </span>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      viewMode === 'split' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Split Compare
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('processed')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      viewMode === 'processed' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Scanned Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('original')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      viewMode === 'original' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Camera Original
                  </button>
                </div>
              </div>

              {/* Platen Glass Ruler Edge Guides */}
              <div className="h-4 bg-slate-900 border-b border-slate-800/60 flex items-center justify-between px-3 text-[9px] font-mono text-slate-500 select-none">
                <span>0 mm</span>
                <span>50 mm</span>
                <span>100 mm</span>
                <span>150 mm</span>
                <span>210 mm (A4)</span>
              </div>

              {/* Main Scanner Bed Surface */}
              <div
                ref={splitContainerRef}
                onPointerDown={viewMode === 'split' ? handlePointerDown : undefined}
                onPointerMove={viewMode === 'split' ? handlePointerMove : undefined}
                onPointerUp={viewMode === 'split' ? handlePointerUp : undefined}
                className="relative min-h-[460px] max-h-[640px] bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none cursor-default"
              >
                {/* Optical Scanner Laser Sweep Bar Animation (activates during scanning) */}
                {activePage?.status === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-center">
                    <div className="w-full h-1.5 bg-cyan-400 shadow-[0_0_20px_6px_rgba(34,211,238,0.7)] animate-scan-sweep"></div>
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Scanning optical sensor pass...</span>
                    </div>
                  </div>
                )}

                {/* Document Display Viewport */}
                {activePage && (
                  <div className="relative max-h-[580px] max-w-full flex items-center justify-center shadow-2xl rounded-sm overflow-hidden bg-white">
                    {viewMode === 'split' ? (
                      /* Split View with Slider Handle */
                      <div className="relative flex items-center justify-center cursor-ew-resize">
                        {/* 1. Scanned Processed Machine Result (Base Layer) */}
                        <img
                          src={activePage.processedUrl || activePage.originalUrl}
                          alt="Scanned machine copy"
                          className="max-h-[560px] max-w-full object-contain pointer-events-none select-none block"
                        />

                        {/* 2. Camera Original (Top Clamped Layer) */}
                        <div
                          className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                          style={{ clipPath: `inset(0 ${100 - comparisonSplit}% 0 0)` }}
                        >
                          <img
                            src={activePage.originalUrl}
                            alt="Original camera photo"
                            className="max-h-[560px] max-w-full object-contain select-none block"
                          />
                        </div>

                        {/* 3. Divider Line & Interactive Handle */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                          style={{ left: `${comparisonSplit}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white pointer-events-auto cursor-ew-resize">
                            <span className="text-[10px] font-bold">↔</span>
                          </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 pointer-events-none">
                          Camera Photo
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-blue-600/90 text-[10px] font-mono text-white font-semibold pointer-events-none">
                          Scanner Result
                        </div>
                      </div>
                    ) : viewMode === 'processed' ? (
                      /* Scanned Result Only */
                      <img
                        src={activePage.processedUrl || activePage.originalUrl}
                        alt="Scanned document"
                        className="max-h-[560px] max-w-full object-contain"
                      />
                    ) : (
                      /* Camera Original Only */
                      <img
                        src={activePage.originalUrl}
                        alt="Camera original"
                        className="max-h-[560px] max-w-full object-contain"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Glass Diagnostics Bar */}
              <div className="px-4 py-2 bg-[#0f172a] border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-3">
                  <span>
                    Resolution:{' '}
                    <strong className="text-white font-mono">
                      {activePage?.processedWidth || activePage?.originalWidth} ×{' '}
                      {activePage?.processedHeight || activePage?.originalHeight} px
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Preset:{' '}
                    <strong className="text-blue-400 uppercase font-mono">
                      {activePage?.settings.preset.replace('_', ' ')}
                    </strong>
                  </span>
                  {activePage?.scanTimeMs && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-400 font-mono">
                        {activePage.scanTimeMs} ms scan
                      </span>
                    </>
                  )}
                </div>

                {/* Quick Page Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rotateActivePage(-90)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Rotate 90° Left"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateActivePage(90)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Rotate 90° Right"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Multi-Page Document Strip */}
            <div
              className={`border rounded-xl p-3 space-y-2 transition-colors ${
                isDark ? 'bg-[#121826] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Multi-Page Document Queue ({pages.length} {pages.length === 1 ? 'Page' : 'Pages'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Page</span>
                  </button>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Thumbnails row */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
                {pages.map((page, idx) => {
                  const isActive = idx === activePageIndex;
                  return (
                    <div
                      key={page.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`relative group shrink-0 w-24 h-32 rounded-lg border-2 overflow-hidden bg-slate-950 cursor-pointer transition-all ${
                        isActive
                          ? 'border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                          : isDark
                          ? 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                          : 'border-slate-300 hover:border-slate-400 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={page.processedUrl || page.originalUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-semibold">
                        P.{idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePage(idx);
                        }}
                        className="absolute top-1 right-1 p-1 rounded bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Remove page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Page Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`shrink-0 w-24 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/80 text-slate-400 hover:text-blue-300'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Add Page</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Scanner Machine Console & Adjustments */}
          <div className="lg:col-span-4 space-y-6">
            <div
              className={`border rounded-2xl p-5 shadow-xl space-y-6 transition-colors ${
                isDark
                  ? 'bg-[#121826] border-slate-800/80 shadow-black/20'
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between pb-3 border-b transition-colors ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Scanner Machine Parameters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className={`transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Scanner Tips"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Auto Scan Method & Presets (User Choice: Auto Toggle or Manual Magic / B&W Selection) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Document Scan Method &amp; Presets
                  </label>
                </div>

                {/* Auto Scan Detect Toggle Card (Modeled like Smart Detect in Optimizer) */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    activePage?.settings.autoDetectPreset
                      ? isDark
                        ? 'bg-gradient-to-br from-blue-950/45 via-indigo-950/30 to-slate-900 border-blue-500/60 shadow-md shadow-blue-500/10'
                        : 'bg-blue-50/90 border-blue-300 shadow-sm'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg mt-0.5 shrink-0 transition-colors ${
                          activePage?.settings.autoDetectPreset
                            ? 'bg-blue-600 text-white shadow-sm'
                            : isDark
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Auto Scan Detect
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                              activePage?.settings.autoDetectPreset
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                                : isDark
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            Auto Engine
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Automatically evaluates colored inks, rubber stamps, and contrast to choose between <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Magic Color</strong>, <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>B&amp;W Photocopy</strong>, or <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Grayscale</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Accessible Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!activePage?.settings.autoDetectPreset}
                      onClick={() =>
                        updateActivePageSettings({
                          autoDetectPreset: !activePage?.settings.autoDetectPreset,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        activePage?.settings.autoDetectPreset
                          ? 'bg-blue-600'
                          : isDark
                          ? 'bg-slate-800'
                          : 'bg-slate-300'
                      }`}
                    >
                      <span className="sr-only">Toggle Auto Scan Detect</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          activePage?.settings.autoDetectPreset ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto Detection Reasoning Badge */}
                  {activePage?.settings.autoDetectPreset && (
                    <div
                      className={`mt-2.5 pt-2.5 border-t text-[11px] font-medium flex items-center gap-1.5 ${
                        isDark
                          ? 'border-slate-800/80 text-blue-300'
                          : 'border-blue-200/80 text-blue-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{activePage.detectedReason || 'Auto scan engine active and analyzing document features.'}</span>
                    </div>
                  )}
                </div>

                {/* Manual Presets Selection (User can freely click between Magic, B&W, etc.) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {activePage?.settings.autoDetectPreset
                        ? 'Manual Presets (Clicking any preset switches off Auto)'
                        : 'Choose Manual Preset'}
                    </span>
                    {activePage?.settings.autoDetectPreset ? (
                      <span className="text-[10px] text-blue-500 font-semibold">Auto Mode Active</span>
                    ) : (
                      <span className="text-[10px] text-blue-500 font-mono uppercase font-bold">
                        {activePage?.settings.preset.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {PRESET_OPTIONS.map((opt) => {
                      const isSelected = activePage?.settings.preset === opt.id;
                      const isAuto = !!activePage?.settings.autoDetectPreset;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updateActivePageSettings({
                              preset: opt.id,
                              autoDetectPreset: false, // clicking manual preset disables auto detect
                            })
                          }
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected && !isAuto
                              ? isDark
                                ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                                : 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm ring-1 ring-blue-500'
                              : isSelected && isAuto
                              ? isDark
                                ? 'bg-blue-950/30 border-blue-500/70 text-white shadow-xs'
                                : 'bg-blue-50/60 border-blue-400 text-blue-900 shadow-xs'
                              : isDark
                              ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold">{opt.label}</span>
                              <div className="flex items-center gap-1">
                                {isSelected && isAuto && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                      isDark ? 'bg-blue-500/30 text-blue-200' : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    Auto Selected
                                  </span>
                                )}
                                {opt.tag && !isAuto && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                      isSelected
                                        ? isDark
                                          ? 'bg-blue-500/30 text-blue-200'
                                          : 'bg-blue-200 text-blue-800'
                                        : isDark
                                        ? 'bg-slate-800 text-slate-400'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {opt.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`text-[11px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Precision Adjustment Sliders */}
              <div
                className={`space-y-4 pt-3 border-t transition-colors ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}
              >
                {/* Shadow Removal / Paper Whitening */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Shadow Removal &amp; Paper Whitening
                    </span>
                    <span className="font-mono text-blue-500 text-[11px] font-semibold">
                      {activePage?.settings.shadowRemoval}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activePage?.settings.shadowRemoval || 85}
                    onChange={(e) =>
                      updateActivePageSettings({ shadowRemoval: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>Soft camera light</span>
                    <span>Pure white scanner bed</span>
                  </div>
                </div>

                {/* Ink Boldness / Threshold */}
                {activePage?.settings.preset === 'bw_clean' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Ink Boldness (Binarization)
                      </span>
                      <span className="font-mono text-blue-500 text-[11px] font-semibold">
                        {activePage?.settings.inkBoldness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activePage?.settings.inkBoldness || 45}
                      onChange={(e) =>
                        updateActivePageSettings({ inkBoldness: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}

                {/* Micro-Edge Sharpness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Text Edge Sharpness
                    </span>
                    <span className="font-mono text-blue-500 text-[11px] font-semibold">
                      {activePage?.settings.sharpness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activePage?.settings.sharpness || 60}
                    onChange={(e) =>
                      updateActivePageSettings({ sharpness: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Document Contrast
                    </span>
                    <span className="font-mono text-blue-500 text-[11px] font-semibold">
                      {activePage?.settings.contrast > 0 ? `+${activePage?.settings.contrast}` : activePage?.settings.contrast}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={activePage?.settings.contrast || 15}
                    onChange={(e) =>
                      updateActivePageSettings({ contrast: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* 3. Export Options & Synergy Actions */}
              <div
                className={`space-y-2.5 pt-3 border-t transition-colors ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}
              >
                <div className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Export Scanned Document
                </div>

                {/* Multi-Page PDF Export */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || pages.length === 0}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>
                    {isExportingPdf
                      ? 'Generating PDF...'
                      : `Export as Multi-Page PDF (${pages.length} Pages)`}
                  </span>
                </button>

                {/* Single Image Export */}
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  disabled={!activePage}
                  className={`w-full py-2 px-3 border text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Active Page ({activePage?.settings.preset === 'bw_clean' ? 'PNG' : 'JPG'})</span>
                </button>

                {/* Synergy CTA: Send Scanned Document to wildlogic Image Optimizer */}
                {onSendToOptimizer && (
                  <button
                    type="button"
                    onClick={handleSendToOptimizer}
                    disabled={!activePage}
                    className={`w-full py-2.5 px-3 border text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 ${
                      isDark
                        ? 'bg-gradient-to-r from-indigo-950/80 to-blue-950/80 hover:from-indigo-900/80 hover:to-blue-900/80 border-indigo-500/40 text-indigo-200'
                        : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Optimize &amp; Shrink Scan to 5 KB Target</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
