import React, { useState, useEffect } from 'react';
import { CompressionSettings, OutputFormat, TargetSizeMode, SharpenLevel } from '../types/image';
import { Sliders, Sparkles, AlertCircle, Info, Zap, Wand2, Check } from 'lucide-react';
import { getBrowserCodecSupport } from '../utils/imageOptimizer';

interface ControlsPanelProps {
  settings: CompressionSettings;
  onChangeSettings: (newSettings: CompressionSettings) => void;
  onApplyToBatch: () => void;
  isProcessing: boolean;
  itemCount: number;
}

const PRESET_SIZES = [5, 10, 20, 50, 100];
const FORMATS: { key: OutputFormat; label: string; desc: string }[] = [
  { key: 'webp', label: 'WebP', desc: 'Superior 5KB clarity & alpha' },
  { key: 'jpeg', label: 'JPEG', desc: 'Universal legacy support' },
  { key: 'avif', label: 'AVIF', desc: 'Ultra-dense next-gen' },
  { key: 'png', label: 'PNG', desc: 'Clean indexed/raster' },
];

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  settings,
  onChangeSettings,
  onApplyToBatch,
  isProcessing,
  itemCount,
}) => {
  const [codecs, setCodecs] = useState<{ avif: boolean; webp: boolean; jpeg: boolean }>({
    avif: false,
    webp: true,
    jpeg: true,
  });

  useEffect(() => {
    let active = true;
    getBrowserCodecSupport().then((support) => {
      if (active) setCodecs(support);
    });
    return () => {
      active = false;
    };
  }, []);

  const isCustomSize = !PRESET_SIZES.includes(settings.targetSizeKB);

  const handleSizePreset = (size: number) => {
    onChangeSettings({ ...settings, targetSizeKB: size });
  };

  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      onChangeSettings({ ...settings, targetSizeKB: Math.max(1, Math.min(10000, val)) });
    }
  };

  return (
    <div className="bg-[#121826] border border-slate-800/80 rounded-xl p-5 shadow-xl shadow-black/20 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Optimization Parameters</h2>
        </div>
      </div>

      {/* Target Size Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Target Size
          </label>
          <span className="text-[11px] text-slate-400">
            {settings.targetSizeKB === 5 ? 'Optimized for 5 KB ultra-compression' : 'Custom target'}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          {PRESET_SIZES.map((size) => {
            const isSelected = settings.targetSizeKB === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizePreset(size)}
                className={`py-1.5 px-1 text-xs font-medium rounded-md transition-all text-center cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {size} KB
              </button>
            );
          })}
          <div className="relative">
            <input
              type="number"
              min="1"
              max="5000"
              value={settings.targetSizeKB}
              onChange={handleCustomSizeChange}
              placeholder="Custom"
              className={`w-full py-1.5 px-2 text-xs text-center rounded-md font-mono tabular-nums transition-all border outline-none ${
                isCustomSize
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 font-semibold'
                  : 'bg-transparent text-slate-400 border-transparent hover:border-slate-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Target Mode: Exact vs Minimum Floor vs Maximum Cap */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Size Enforcement Strategy
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeSettings({ ...settings, mode: 'minimum' })}
            className={`py-2 px-2 text-xs font-medium rounded-md transition-all text-center cursor-pointer ${
              settings.mode === 'minimum'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="font-semibold">Minimum Floor</div>
            <div className="text-[10px] opacity-75 font-mono">≥ {settings.targetSizeKB} KB</div>
          </button>

          <button
            type="button"
            onClick={() => onChangeSettings({ ...settings, mode: 'exact' })}
            className={`py-2 px-2 text-xs font-medium rounded-md transition-all text-center cursor-pointer ${
              settings.mode === 'exact'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="font-semibold">Near Exact</div>
            <div className="text-[10px] opacity-75 font-mono">~{settings.targetSizeKB} KB</div>
          </button>

          <button
            type="button"
            onClick={() => onChangeSettings({ ...settings, mode: 'maximum' })}
            className={`py-2 px-2 text-xs font-medium rounded-md transition-all text-center cursor-pointer ${
              settings.mode === 'maximum'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="font-semibold">Maximum Cap</div>
            <div className="text-[10px] opacity-75 font-mono">≤ {settings.targetSizeKB} KB</div>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          {settings.mode === 'minimum' && 'Guarantees the file meets the minimum required size threshold for official portals & uploaders.'}
          {settings.mode === 'exact' && 'Balances resolution and compression to land as close to target as possible.'}
          {settings.mode === 'maximum' && 'Strict ceiling ensuring file size never exceeds the target byte limit.'}
        </p>
      </div>

      {/* Output Format with Smart Detect Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Output Codec Format
          </label>
        </div>

        {/* Smart Detect Toggle Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            settings.smartDetectFormat
              ? 'bg-gradient-to-br from-blue-950/50 via-indigo-950/30 to-slate-900 border-blue-500/60 shadow-md shadow-blue-500/10'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700/80'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-lg mt-0.5 shrink-0 transition-colors ${
                  settings.smartDetectFormat ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Wand2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">Smart Detect</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                      settings.smartDetectFormat
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Auto Engine
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically chooses between <span className="text-slate-200 font-medium">WebP</span>, <span className="text-slate-200 font-medium">AVIF</span>, or <span className="text-slate-200 font-medium">JPEG</span> based on original image type &amp; browser compatibility.
                </p>
              </div>
            </div>

            {/* Accessible Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={!!settings.smartDetectFormat}
              onClick={() =>
                onChangeSettings({
                  ...settings,
                  smartDetectFormat: !settings.smartDetectFormat,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#121826] ${
                settings.smartDetectFormat ? 'bg-blue-600' : 'bg-slate-800'
              }`}
            >
              <span className="sr-only">Toggle Smart Detect</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.smartDetectFormat ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* When Smart Detect is Active: Live Codec Chips & Heuristic Rules */}
          {settings.smartDetectFormat && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-medium">Hardware Codecs:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono ${
                    codecs.avif
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                  }`}
                >
                  <Check className="w-2.5 h-2.5" /> AVIF {codecs.avif ? 'Supported' : 'Unavailable'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  <Check className="w-2.5 h-2.5" /> WebP Supported
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  <Check className="w-2.5 h-2.5" /> JPEG Supported
                </span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-lg text-[10px] text-slate-300 space-y-1.5 border border-slate-800/70">
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                  <span>
                    <strong className="text-white">PNG &amp; Transparent Graphics:</strong> Uses{' '}
                    <strong className="text-blue-300">{codecs.avif ? 'AVIF' : 'WebP'}</strong> to retain alpha transparency and avoid solid backdrops.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                  <span>
                    <strong className="text-white">Photos &amp; Camera JPEGs:</strong> Uses{' '}
                    <strong className="text-indigo-300">{codecs.avif ? 'AVIF (Peak Density)' : 'WebP'}</strong> for best visual detail at {settings.targetSizeKB} KB.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Codec Selection Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {settings.smartDetectFormat
                ? 'Manual Override (Clicking a format disables Smart Detect)'
                : 'Manual Codec Selection'}
            </span>
            {settings.smartDetectFormat && (
              <span className="text-[10px] text-blue-400 font-semibold">Smart Detect Active</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((fmt) => {
              const isSelected = !settings.smartDetectFormat && settings.format === fmt.key;
              return (
                <button
                  key={fmt.key}
                  type="button"
                  onClick={() =>
                    onChangeSettings({
                      ...settings,
                      format: fmt.key,
                      smartDetectFormat: false,
                    })
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                      : settings.smartDetectFormat
                      ? 'border-slate-800/60 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold">{fmt.label}</span>
                    {fmt.key === 'webp' && (
                      <span className="text-[10px] text-indigo-400 font-medium">Recommended</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">{fmt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Quality & Sharpness Settings */}
      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Micro-Edge Sharpness</span>
          </label>
          <span className="text-[11px] text-slate-400">Preserves contrast at 5 KB</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          {(['none', 'subtle', 'crisp'] as SharpenLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChangeSettings({ ...settings, sharpen: level })}
              className={`py-1.5 px-2 text-xs font-medium capitalize rounded-md transition-all text-center cursor-pointer ${
                settings.sharpen === level
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {level === 'subtle' ? 'Subtle (Best)' : level}
            </button>
          ))}
        </div>

        {/* Max Dimension Cap */}
        <div className="flex items-center justify-between pt-1">
          <label className="text-xs text-slate-300">Dimension Constraint</label>
          <select
            value={settings.maxDimension === 'auto' ? 'auto' : settings.maxDimension}
            onChange={(e) => {
              const val = e.target.value;
              onChangeSettings({
                ...settings,
                maxDimension: val === 'auto' ? 'auto' : parseInt(val, 10),
              });
            }}
            className="text-xs bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="auto">Auto Adaptive (Optimal for 5 KB)</option>
            <option value="320">Max 320 px (Avatar / Icon)</option>
            <option value="480">Max 480 px (Mobile Card)</option>
            <option value="640">Max 640 px (Standard Web)</option>
            <option value="800">Max 800 px (Catalog)</option>
          </select>
        </div>
      </div>

      {/* Action CTA */}
      {itemCount > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onApplyToBatch}
            disabled={isProcessing}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Optimizing Batch...' : `Apply to All ${itemCount} Images`}</span>
          </button>
        </div>
      )}
    </div>
  );
};
