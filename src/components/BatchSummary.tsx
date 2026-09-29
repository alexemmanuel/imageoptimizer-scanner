import React from 'react';
import { BatchStats, CompressionSettings, OutputFormat } from '../types/image';
import { formatBytes } from '../utils/imageOptimizer';
import { Download, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Loader2, Sparkles, Layers, Sliders } from 'lucide-react';

interface BatchSummaryProps {
  stats: BatchStats;
  settings: CompressionSettings;
  onChangeSettings: (settings: CompressionSettings) => void;
  isProcessing: boolean;
  onDownloadAllZip: () => void;
  onReprocessAll: () => void;
  onClearAll: () => void;
  isZipping: boolean;
  maxCount?: number;
}

const QUICK_FORMATS: OutputFormat[] = ['webp', 'jpeg', 'avif', 'png'];
const QUICK_SIZES = [5, 10, 20, 50];

export const BatchSummary: React.FC<BatchSummaryProps> = ({
  stats,
  settings,
  onChangeSettings,
  isProcessing,
  onDownloadAllZip,
  onReprocessAll,
  onClearAll,
  isZipping,
  maxCount = 50,
}) => {
  const isDone = stats.completedCount === stats.totalCount && stats.totalCount > 0;
  const progressPercent = stats.totalCount > 0
    ? Math.round(((stats.completedCount + stats.errorCount) / stats.totalCount) * 100)
    : 0;

  const handleFormatChange = (fmt: OutputFormat) => {
    if (settings.format === fmt) return;
    const newSettings = { ...settings, format: fmt };
    onChangeSettings(newSettings);
  };

  const handleSizeChange = (size: number) => {
    if (settings.targetSizeKB === size) return;
    const newSettings = { ...settings, targetSizeKB: size };
    onChangeSettings(newSettings);
  };

  return (
    <div className="bg-[#121826] border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Batch Processing Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-300">
              {stats.totalCount} / {maxCount} max
            </span>
            {isProcessing && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Shrinking {stats.completedCount + 1}/{stats.totalCount}</span>
              </span>
            )}
            {isDone && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All {stats.totalCount} Shrunk</span>
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Target: <strong className="text-indigo-400 font-mono">{settings.targetSizeKB} KB</strong></span>
            <span aria-hidden="true">·</span>
            <span>Format: <strong className="text-indigo-400 uppercase font-mono">{settings.format}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">{stats.completedCount} ready</span>
            {stats.errorCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400">{stats.errorCount} failed</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReprocessAll}
            disabled={isProcessing || stats.totalCount === 0}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Shrink all images to current size and format"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Shrinking...' : `Shrink All (${stats.totalCount})`}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadAllZip}
            disabled={isZipping || stats.completedCount === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Zipping...' : `Download ZIP (${stats.completedCount})`}</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Clear all images"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Shrink Format & Size Bar */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Quick Format Switch */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Output Format:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            {QUICK_FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleFormatChange(fmt)}
                disabled={isProcessing}
                className={`px-2.5 py-1 text-xs font-mono uppercase rounded transition-colors cursor-pointer disabled:opacity-50 ${
                  settings.format === fmt
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Size Switch */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Target Size:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            {QUICK_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeChange(size)}
                disabled={isProcessing}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer disabled:opacity-50 ${
                  settings.targetSizeKB === size
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {size} KB
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar (if processing) */}
      {isProcessing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Concurrent shrinking to {settings.targetSizeKB} KB {settings.format.toUpperCase()}...</span>
            </span>
            <span className="tabular-nums font-semibold text-white">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Original Total Size</div>
          <div className="text-base font-semibold text-white font-mono tabular-nums mt-0.5">
            {formatBytes(stats.totalOriginalBytes)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">New Shrunk Total</div>
          <div className="text-base font-semibold text-indigo-400 font-mono tabular-nums mt-0.5">
            {formatBytes(stats.totalCompressedBytes)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Storage Saved</div>
          <div className="text-base font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
            {formatBytes(stats.totalSavedBytes)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400">Average Savings Ratio</div>
          <div className="text-base font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
            -{stats.savingsPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
