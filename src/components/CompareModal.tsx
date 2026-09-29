import React, { useState, useRef, useEffect } from 'react';
import { ImageItem } from '../types/image';
import { formatBytes } from '../utils/imageOptimizer';
import { X, Download, ZoomIn, ZoomOut, Maximize2, SplitSquareVertical, Columns } from 'lucide-react';

interface CompareModalProps {
  item: ImageItem | null;
  onClose: () => void;
  onDownload: (item: ImageItem) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ item, onClose, onDownload }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'slider' | 'sideBySide'>('slider');
  const [zoom, setZoom] = useState<number>(1); // 1 = fit, 2 = 2x, 4 = 4x
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item || !item.compressedUrl) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
      onPointerUp={handlePointerUp}
    >
      <div className="bg-[#121826] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Original: {formatBytes(item.originalSize)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-400 font-semibold">5 KB Result: {formatBytes(item.compressedSize || 0)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">-{item.compressionRatio?.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  mode === 'slider' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Split Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('sideBySide')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  mode === 'sideBySide' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side by Side</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setZoom(1)}
                className={`px-2 py-1 text-xs font-mono rounded cursor-pointer ${
                  zoom === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => setZoom(2)}
                className={`px-2 py-1 text-xs font-mono rounded cursor-pointer ${
                  zoom === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => setZoom(4)}
                className={`px-2 py-1 text-xs font-mono rounded cursor-pointer ${
                  zoom === 4 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                4x
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDownload(item)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer ml-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 5 KB</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 min-h-[380px] max-h-[60vh] p-4 bg-slate-950 flex items-center justify-center overflow-auto select-none">
          {mode === 'slider' ? (
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              className="relative w-full h-full max-w-4xl max-h-[540px] flex items-center justify-center overflow-hidden rounded-xl border border-slate-800 cursor-ew-resize bg-[#0b0f17]"
            >
              {/* Scaled viewport container */}
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-100"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                {/* 1. Underlying: Compressed Image (Right side reveal) */}
                <img
                  src={item.compressedUrl}
                  alt="Compressed 5 KB"
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />

                {/* 2. Top Clamped Layer: Original Image (Left side reveal) */}
                <div
                  className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={item.originalUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center text-[10px] font-bold">
                  ↔
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[11px] font-medium text-slate-200 pointer-events-none">
                Original ({formatBytes(item.originalSize)})
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-indigo-950/90 backdrop-blur-sm border border-indigo-700/80 text-[11px] font-semibold text-indigo-200 pointer-events-none">
                5 KB Optimized ({formatBytes(item.compressedSize || 0)})
              </div>
            </div>
          ) : (
            /* Side By Side View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-w-5xl">
              <div className="flex flex-col rounded-xl border border-slate-800 overflow-hidden bg-[#0b0f17]">
                <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Original Master</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {item.originalWidth}×{item.originalHeight} · {formatBytes(item.originalSize)}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                  <img
                    src={item.originalUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain rounded"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
              </div>

              <div className="flex flex-col rounded-xl border border-indigo-900/60 overflow-hidden bg-[#0b0f17]">
                <div className="px-3 py-2 bg-indigo-950/50 border-b border-indigo-900/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300">Optimized 5 KB Output</span>
                  <span className="font-mono tabular-nums text-indigo-400 font-semibold">
                    {item.compressedWidth}×{item.compressedHeight} · {formatBytes(item.compressedSize || 0)}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                  <img
                    src={item.compressedUrl}
                    alt="Compressed"
                    className="max-h-full max-w-full object-contain rounded"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diagnostics & Inspection Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 bg-slate-900/80 border-t border-slate-800 text-xs">
          <div>
            <div className="text-[11px] text-slate-400">Output Resolution</div>
            <div className="font-mono tabular-nums text-white font-medium mt-0.5">
              {item.compressedWidth} × {item.compressedHeight} px
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Codec / Format</div>
            <div className="font-mono uppercase text-indigo-400 font-semibold mt-0.5 flex items-center gap-1.5">
              <span>{item.compressedFormat}</span>
              {item.detectedFormatReason && (
                <span className="text-[10px] lowercase font-sans text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                  smart detect
                </span>
              )}
            </div>
            {item.detectedFormatReason && (
              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1" title={item.detectedFormatReason}>
                {item.detectedFormatReason}
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Applied Quality</div>
            <div className="font-mono tabular-nums text-white font-medium mt-0.5">
              {item.appliedQuality}% with Unsharp Mask
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Compression Speed</div>
            <div className="font-mono tabular-nums text-emerald-400 font-medium mt-0.5">
              {item.processingTimeMs} ms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
