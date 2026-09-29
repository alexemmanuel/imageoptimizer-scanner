import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, FolderPlus, Sparkles, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImageDef, generateTestBatch } from '../utils/sampleImages';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSample: (sample: SampleImageDef) => void;
  onLoadAllSamples: () => void;
  onLoadTestBatch: (count: number) => void;
  isProcessing: boolean;
  currentCount: number;
  maxCount?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onLoadSample,
  onLoadAllSamples,
  onLoadTestBatch,
  isProcessing,
  currentCount,
  maxCount = 50,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = Math.max(0, maxCount - currentCount);
  const isFull = remainingSlots === 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFull) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processIncomingFiles = (incomingList: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < incomingList.length; i++) {
      const file = incomingList[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setWarningMessage('No valid image files found in your selection.');
      setTimeout(() => setWarningMessage(null), 4000);
      return;
    }

    if (isFull) {
      setWarningMessage(`Batch limit reached: 50/50 images loaded. Please remove images or clear the queue to add new ones.`);
      setTimeout(() => setWarningMessage(null), 5000);
      return;
    }

    if (validFiles.length > remainingSlots) {
      const accepted = validFiles.slice(0, remainingSlots);
      const skipped = validFiles.length - remainingSlots;
      setWarningMessage(`Added ${accepted.length} images to reach maximum capacity of 50. (${skipped} extra files were skipped).`);
      setTimeout(() => setWarningMessage(null), 6000);
      onFilesSelected(accepted);
    } else {
      setWarningMessage(null);
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning/Limit Banner if triggered */}
      {warningMessage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="text-amber-400 hover:text-amber-100 font-semibold cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-7 transition-all flex flex-col items-center justify-center text-center group ${
          isFull
            ? 'border-slate-800 bg-slate-900/40 opacity-80 cursor-not-allowed'
            : isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
            : 'border-slate-800 bg-[#121826]/70 hover:border-slate-700 hover:bg-[#121826]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          onChange={handleFileInputChange}
          disabled={isFull || isProcessing}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is standard in browsers but not typed
          webkitdirectory="true"
          directory=""
          multiple
          onChange={handleFileInputChange}
          disabled={isFull || isProcessing}
          className="hidden"
        />

        {/* Top Badge: 1 to 50 images */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-[11px] font-medium text-indigo-300 mb-3 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Single or Batch: 1 to 50 Images</span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-white font-semibold">
            {currentCount} / {maxCount} loaded
          </span>
        </div>

        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-semibold text-white mb-1">
          {isFull
            ? 'Batch full (50 / 50 images loaded)'
            : 'Drop 1 to 50 images here or browse files'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Works with a single photo or a batch of up to 50 images. Every image is automatically shrunk to your required target size and format (e.g. 5 KB WebP) with zero quality loss.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isFull || isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Select Images (up to {remainingSlots})</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isFull || isProcessing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Folder</span>
          </button>
        </div>

        <div className="mt-4 text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-2">
          <span>Supported: WebP, JPEG, PNG, AVIF</span>
          <span aria-hidden="true">·</span>
          <span>Max 50 images per batch</span>
          <span aria-hidden="true">·</span>
          <span>In-memory private client processing</span>
        </div>
      </div>

      {/* Instant 1-Click Samples Tray */}
      <div className="bg-[#121826]/90 border border-slate-800/80 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Test Samples</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadAllSamples}
              disabled={isProcessing || remainingSlots < 3}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 rounded-md transition-colors cursor-pointer disabled:opacity-40"
            >
              +3 Samples
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onLoadSample(sample)}
              disabled={isProcessing || isFull}
              className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group cursor-pointer disabled:opacity-40"
            >
              <img
                src={sample.src}
                alt={sample.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded object-cover border border-slate-700/50 group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{sample.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{sample.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
