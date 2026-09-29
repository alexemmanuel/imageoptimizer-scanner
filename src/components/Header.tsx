import React from 'react';
import { Layers, Sparkles, HelpCircle, Download, Printer, Zap, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeMode: 'optimizer' | 'scanner';
  onChangeMode: (mode: 'optimizer' | 'scanner') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenGuide: () => void;
  onOpenSampleBatch: () => void;
  hasItems: boolean;
  onDownloadAllZip: () => void;
  isZipping?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onChangeMode,
  theme,
  onToggleTheme,
  onOpenGuide,
  onOpenSampleBatch,
  hasItems,
  onDownloadAllZip,
  isZipping = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#0f172a]/95 border-b border-slate-800/80 text-white'
          : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Zone 1: Single text element wordmark + Mode Switcher */}
      <div className="flex items-center gap-6">
        <a
          href="/"
          className={`flex items-center gap-2.5 text-lg font-bold tracking-tight transition-colors ${
            isDark ? 'text-white hover:text-indigo-300' : 'text-slate-900 hover:text-indigo-600'
          }`}
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Layers className="w-4 h-4 text-white" />
          </span>
          <span className="tracking-tight">wildlogic</span>
        </a>

        {/* Dual Function Switcher Tabs */}
        <div
          className={`hidden sm:flex items-center p-1 rounded-xl text-xs font-semibold border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => onChangeMode('optimizer')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
              activeMode === 'optimizer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Image Optimizer</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('scanner')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
              activeMode === 'scanner'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Document Scanner</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Clean navigation links */}
      <nav
        className={`hidden lg:flex items-center gap-5 text-sm font-medium ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {activeMode === 'optimizer' ? (
          <>
            <button
              onClick={onOpenSampleBatch}
              className={`transition-colors cursor-pointer text-xs ${
                isDark ? 'hover:text-white' : 'hover:text-slate-900'
              }`}
            >
              Sample Assets
            </button>
            <button
              onClick={onOpenGuide}
              className={`flex items-center gap-1.5 cursor-pointer text-xs transition-colors ${
                isDark ? 'hover:text-white' : 'hover:text-slate-900'
              }`}
            >
              <span>Rules &amp; Tips</span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenGuide}
            className={`flex items-center gap-1.5 cursor-pointer text-xs transition-colors ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            }`}
          >
            <span>Rules &amp; Tips</span>
          </button>
        )}
      </nav>

      {/* Zone 3: Primary actions & Mobile Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Switcher */}
        <div
          className={`flex sm:hidden items-center p-0.5 rounded-lg text-xs border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => onChangeMode('optimizer')}
            className={`px-2.5 py-1 rounded cursor-pointer ${
              activeMode === 'optimizer'
                ? 'bg-indigo-600 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            Optimizer
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('scanner')}
            className={`px-2.5 py-1 rounded cursor-pointer ${
              activeMode === 'scanner'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            Scanner
          </button>
        </div>

        {/* Theme Mode Toggle (Sun/Moon) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-amber-300 hover:text-amber-200 hover:bg-slate-800 shadow-sm'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 shadow-xs'
          }`}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        <button
          onClick={onOpenGuide}
          className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Optimization & Scanner Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {activeMode === 'optimizer' && hasItems && (
          <button
            onClick={onDownloadAllZip}
            disabled={isZipping}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Generating ZIP...' : 'Export ZIP'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
