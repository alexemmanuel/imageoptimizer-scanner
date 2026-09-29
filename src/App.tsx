import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { CompressionSettings, ImageItem, BatchStats } from './types/image';
import { optimizeImage, loadImage } from './utils/imageOptimizer';
import { SAMPLE_IMAGES, SampleImageDef, generateTestBatch } from './utils/sampleImages';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ControlsPanel } from './components/ControlsPanel';
import { BatchSummary } from './components/BatchSummary';
import { ImageGrid } from './components/ImageGrid';
import { CompareModal } from './components/CompareModal';
import { QualityTipsModal } from './components/QualityTipsModal';
import { DocumentScanner } from './components/scanner/DocumentScanner';
import { ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MAX_BATCH_SIZE = 50;
const CONCURRENCY = 4; // 4 concurrent workers for fast 50-image batch shrinking

interface ToastNotice {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wildlogic_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('wildlogic_theme', next);
      } catch {}
      return next;
    });
  };

  const [activeMode, setActiveModeState] = useState<'optimizer' | 'scanner'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wildlogic_active_mode');
      if (saved === 'scanner' || saved === 'optimizer') return saved;
    }
    return 'optimizer'; // Default to Image Optimizer
  });

  const setActiveMode = (mode: 'optimizer' | 'scanner') => {
    setActiveModeState(mode);
    try {
      localStorage.setItem('wildlogic_active_mode', mode);
    } catch {}
  };
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [inspectItem, setInspectItem] = useState<ImageItem | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);

  // Compression & Format Settings
  const [settings, setSettings] = useState<CompressionSettings>({
    targetSizeKB: 5,
    mode: 'minimum', // specifically requested: "resize images to 5 kb minimum"
    format: 'webp',
    smartDetectFormat: false,
    maxDimension: 'auto',
    sharpen: 'subtle',
    preserveAspectRatio: true,
    smoothingQuality: 'high',
  });

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string, duration = 5000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: String(Date.now()), type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  // Batch stats calculation
  const stats: BatchStats = useMemo(() => {
    let completedCount = 0;
    let processingCount = 0;
    let errorCount = 0;
    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;

    for (const item of items) {
      totalOriginalBytes += item.originalSize;
      if (item.status === 'done') {
        completedCount++;
        totalCompressedBytes += item.compressedSize || 0;
      } else if (item.status === 'processing') {
        processingCount++;
      } else if (item.status === 'error') {
        errorCount++;
      }
    }

    const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
    const savingsPercentage = totalOriginalBytes > 0
      ? (totalSavedBytes / totalOriginalBytes) * 100
      : 0;

    return {
      totalCount: items.length,
      completedCount,
      processingCount,
      errorCount,
      totalOriginalBytes,
      totalCompressedBytes,
      totalSavedBytes,
      savingsPercentage,
    };
  }, [items]);

  // Process a single item
  const processSingleItem = useCallback(
    async (item: ImageItem, currentSettings: CompressionSettings): Promise<ImageItem> => {
      try {
        const source = item.originalFile || item.originalUrl;
        const result = await optimizeImage(source, currentSettings);

        // Revoke previous compressed URL if re-shrinking
        if (item.compressedUrl && item.compressedUrl !== result.url) {
          URL.revokeObjectURL(item.compressedUrl);
        }

        const originalSize = item.originalSize || 1;
        const ratio = Math.max(0, ((originalSize - result.size) / originalSize) * 100);

        return {
          ...item,
          status: 'done',
          compressedBlob: result.blob,
          compressedUrl: result.url,
          compressedSize: result.size,
          compressedWidth: result.width,
          compressedHeight: result.height,
          compressedFormat: result.format,
          detectedFormatReason: result.detectedReason,
          processingTimeMs: result.processingTimeMs,
          appliedQuality: result.quality,
          compressionRatio: ratio,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Shrinking failed';
        return {
          ...item,
          status: 'error',
          errorMessage: msg,
        };
      }
    },
    []
  );

  // Concurrent batch process runner (Pool of workers)
  const runBatchOptimization = useCallback(
    async (itemsToProcess: ImageItem[], currentSettings: CompressionSettings) => {
      if (itemsToProcess.length === 0) return;
      setIsProcessing(true);

      // Mark all targeted items as processing
      setItems((prev) =>
        prev.map((it) =>
          itemsToProcess.some((p) => p.id === it.id)
            ? { ...it, status: 'processing', errorMessage: undefined }
            : it
        )
      );

      const queue = [...itemsToProcess];
      let cursor = 0;

      // Worker function consuming from the shared queue
      const runWorker = async () => {
        while (cursor < queue.length) {
          const currentIndex = cursor++;
          const targetItem = queue[currentIndex];
          if (!targetItem) break;

          const updated = await processSingleItem(targetItem, currentSettings);
          setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));

          // Micro-pause to yield to browser paint
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      };

      const workerCount = Math.min(CONCURRENCY, queue.length);
      const workers = Array.from({ length: workerCount }, () => runWorker());
      await Promise.all(workers);

      setIsProcessing(false);
      showToast(
        'success',
        currentSettings.smartDetectFormat
          ? `Batch complete: Auto-optimized ${itemsToProcess.length} images with Smart Detect to ${currentSettings.targetSizeKB} KB`
          : `Batch complete: Shrunk ${itemsToProcess.length} images to ${currentSettings.targetSizeKB} KB ${currentSettings.format.toUpperCase()}`
      );
    },
    [processSingleItem, showToast]
  );

  // File selection handler with 50-item cap
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    // Check available capacity
    const currentLength = items.length;
    const availableSlots = Math.max(0, MAX_BATCH_SIZE - currentLength);

    if (availableSlots <= 0) {
      showToast(
        'warning',
        `Batch limit reached (50/50 images). Please delete some images or clear the queue to add more.`
      );
      return;
    }

    let filesToAdd = files;
    if (files.length > availableSlots) {
      filesToAdd = files.slice(0, availableSlots);
      const skipped = files.length - availableSlots;
      showToast(
        'info',
        `Added ${filesToAdd.length} images to reach maximum capacity of 50. (${skipped} extra images were skipped).`
      );
    } else if (files.length > 1) {
      showToast('info', `Added ${filesToAdd.length} images to queue. Shrinking now...`);
    }

    const newItems: ImageItem[] = [];

    for (let idx = 0; idx < filesToAdd.length; idx++) {
      const file = filesToAdd[idx];
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        newItems.push({
          id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalFile: file,
          originalUrl: url,
          originalSize: file.size,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          originalType: file.type,
          status: 'idle',
        });
      } catch (e) {
        console.error('Failed reading file dimensions:', e);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      // Trigger concurrent batch optimization immediately
      runBatchOptimization(newItems, settings);
    }
  };

  // Sample image loaders
  const handleLoadSample = async (sample: SampleImageDef) => {
    try {
      const res = await fetch(sample.src);
      const blob = await res.blob();
      const file = new File([blob], sample.name, { type: blob.type || 'image/jpeg' });
      await handleFilesSelected([file]);
    } catch (err) {
      console.error('Could not load sample:', err);
    }
  };

  const handleLoadAllSamples = async () => {
    try {
      const files: File[] = [];
      for (const sample of SAMPLE_IMAGES) {
        const res = await fetch(sample.src);
        const blob = await res.blob();
        files.push(new File([blob], sample.name, { type: blob.type || 'image/jpeg' }));
      }
      await handleFilesSelected(files);
    } catch (err) {
      console.error('Could not load all samples:', err);
    }
  };

  // Test batch generator up to 50 images
  const handleLoadTestBatch = async (count: number) => {
    try {
      showToast('info', `Loading ${count} test images for batch processing...`);
      const files = await generateTestBatch(count);
      await handleFilesSelected(files);
    } catch (err) {
      console.error('Failed loading test batch:', err);
    }
  };

  // Apply settings to entire batch
  const handleApplyToBatch = () => {
    if (items.length === 0) return;
    runBatchOptimization(items, settings);
  };

  // Settings change handler: re-run if user changed format or target size
  const handleSettingsChange = (newSettings: CompressionSettings) => {
    setSettings(newSettings);
    // If items exist and are not already processing, re-shrink whole batch
    if (items.length > 0 && !isProcessing) {
      runBatchOptimization(items, newSettings);
    }
  };

  // Re-process single
  const handleReprocessSingle = async (item: ImageItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
    );
    const updated = await processSingleItem(item, settings);
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  // Remove single item
  const handleRemove = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl);
      return prev.filter((it) => it.id !== id);
    });
    if (inspectItem?.id === id) {
      setInspectItem(null);
    }
  };

  // Remove multiple items
  const handleRemoveMultiple = (ids: string[]) => {
    setItems((prev) => {
      ids.forEach((id) => {
        const it = prev.find((item) => item.id === id);
        if (it?.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
        if (it?.originalUrl) URL.revokeObjectURL(it.originalUrl);
      });
      return prev.filter((it) => !ids.includes(it.id));
    });
    if (inspectItem && ids.includes(inspectItem.id)) {
      setInspectItem(null);
    }
    showToast('info', `Removed ${ids.length} images from the batch.`);
  };

  // Clear all
  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
      if (it.originalUrl) URL.revokeObjectURL(it.originalUrl);
    });
    setItems([]);
    setInspectItem(null);
    showToast('info', 'Batch queue cleared.');
  };

  // Single download
  const handleDownloadSingle = (item: ImageItem) => {
    if (!item.compressedBlob || !item.compressedUrl) return;
    const ext = item.compressedFormat === 'jpeg' ? 'jpg' : item.compressedFormat || 'webp';
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    a.download = `${baseName}-${settings.targetSizeKB}kb.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Batch ZIP download
  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.compressedBlob);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < readyItems.length; i++) {
        const it = readyItems[i];
        if (it.compressedBlob) {
          const ext = it.compressedFormat === 'jpeg' ? 'jpg' : it.compressedFormat || 'webp';
          const baseName = it.name.replace(/\.[^/.]+$/, '');
          const filename = `${baseName}-${settings.targetSizeKB}kb.${ext}`;
          zip.file(filename, it.compressedBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wildlogic-${readyItems.length}images-${settings.targetSizeKB}kb-${settings.format}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', `Exported all ${readyItems.length} shrunk images into ZIP archive!`);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast('error', 'Failed generating ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Keep inspect modal synced with updated items
  useEffect(() => {
    if (inspectItem) {
      const found = items.find((i) => i.id === inspectItem.id);
      if (found && found !== inspectItem) {
        setInspectItem(found);
      }
    }
  }, [items, inspectItem]);

  // Send scanned document from scanner directly to optimizer
  const handleSendScannedToOptimizer = (scannedFile: File) => {
    handleFilesSelected([scannedFile]);
    setActiveMode('optimizer');
    showToast('success', 'Scanned document loaded into wildlogic Optimizer!');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200 ${
        theme === 'dark' ? 'dark bg-[#0b0f17] text-slate-100' : 'light bg-[#f8fafc] text-slate-800'
      }`}
    >
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2">
          <div
            className={`p-3.5 rounded-xl border shadow-xl flex items-center justify-between gap-3 text-xs ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-600/80 text-emerald-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-600/80 text-amber-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-600/80 text-rose-200'
                : 'bg-indigo-950/90 border-indigo-600/80 text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        activeMode={activeMode}
        onChangeMode={setActiveMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenGuide={() => setShowGuide(true)}
        onOpenSampleBatch={handleLoadAllSamples}
        hasItems={stats.completedCount > 0}
        onDownloadAllZip={handleDownloadAllZip}
        isZipping={isZipping}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {activeMode === 'scanner' ? (
          <DocumentScanner
            onSendToOptimizer={handleSendScannedToOptimizer}
            onOpenGuide={() => setShowGuide(true)}
            theme={theme}
          />
        ) : (
          <>
            {/* Editorial Hero Header */}
            <section className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Image Batch Optimizer</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">
                <span className="text-slate-400">
                  IMAGE EDITOR WITH THE SAME QUALITY ASSURANCE AND VIBES
                </span>{' '}
                <span className="text-slate-500">–</span>{' '}
                <strong className="italic font-bold text-blue-400">
                  no perceptible difference from the original; it's only been optimised.
                </strong>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                Optimized for 5 KB minimum portal requirements, single avatar uploads, or batches of up to 50 photos. Shrink seamlessly to WebP, JPEG, AVIF, or PNG with multi-core parallel rendering.
              </p>
            </section>

            {/* Workspace Layout: 2 Columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Drag & Drop + Processed Grid */}
              <div className="lg:col-span-8 space-y-6">
                <DropZone
                  onFilesSelected={handleFilesSelected}
                  onLoadSample={handleLoadSample}
                  onLoadAllSamples={handleLoadAllSamples}
                  onLoadTestBatch={handleLoadTestBatch}
                  isProcessing={isProcessing}
                  currentCount={items.length}
                  maxCount={MAX_BATCH_SIZE}
                />

                {items.length > 0 && (
                  <BatchSummary
                    stats={stats}
                    settings={settings}
                    onChangeSettings={handleSettingsChange}
                    isProcessing={isProcessing}
                    onDownloadAllZip={handleDownloadAllZip}
                    onReprocessAll={handleApplyToBatch}
                    onClearAll={handleClearAll}
                    isZipping={isZipping}
                    maxCount={MAX_BATCH_SIZE}
                  />
                )}

                <ImageGrid
                  items={items}
                  onInspect={(item) => setInspectItem(item)}
                  onDownloadSingle={handleDownloadSingle}
                  onRemove={handleRemove}
                  onReprocessSingle={handleReprocessSingle}
                  onRemoveMultiple={handleRemoveMultiple}
                />
              </div>

              {/* Right Column: Compression Controls */}
              <div className="lg:col-span-4 sticky top-20">
                <ControlsPanel
                  settings={settings}
                  onChangeSettings={handleSettingsChange}
                  onApplyToBatch={handleApplyToBatch}
                  isProcessing={isProcessing}
                  itemCount={items.length}
                />

                {/* Batch 50 Guarantee Note */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>50-Image Concurrency &amp; 5 KB Minimum</span>
                  </div>
                  <p className="text-slate-400 leading-normal">
                    Process up to 50 images in parallel with adaptive dimension shrinking, edge unsharp masking, and guaranteed floor compliance.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-16 py-6 px-6 bg-[#0f172a]/60 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">wildlogic</span>
            <span aria-hidden="true">·</span>
            <span>Batch 50 Image Resizer &amp; Document Scanner Machine</span>
            <span aria-hidden="true">·</span>
            <span>Client-Side In-Memory Processing</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setShowGuide(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How it Works
            </button>
            <span aria-hidden="true">·</span>
            <span>Zero Server Uploads</span>
          </div>
        </div>
      </footer>

      {/* Inspection Split Slider Modal */}
      {inspectItem && (
        <CompareModal
          item={inspectItem}
          onClose={() => setInspectItem(null)}
          onDownload={handleDownloadSingle}
        />
      )}

      {/* Quality Education Modal */}
      <QualityTipsModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}
