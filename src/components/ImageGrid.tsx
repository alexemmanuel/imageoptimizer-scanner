import React, { useState, useMemo } from 'react';
import { ImageItem } from '../types/image';
import { formatBytes } from '../utils/imageOptimizer';
import {
  Download,
  Eye,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  LayoutGrid,
  List,
  Search,
  CheckSquare,
  Square,
  FileCheck2,
  Wand2,
} from 'lucide-react';

interface ImageGridProps {
  items: ImageItem[];
  onInspect: (item: ImageItem) => void;
  onDownloadSingle: (item: ImageItem) => void;
  onRemove: (id: string) => void;
  onReprocessSingle: (item: ImageItem) => void;
  onRemoveMultiple?: (ids: string[]) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  items,
  onInspect,
  onDownloadSingle,
  onRemove,
  onReprocessSingle,
  onRemoveMultiple,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'processing' | 'error'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return item.status === statusFilter;
    });
  }, [items, searchQuery, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (onRemoveMultiple) {
      onRemoveMultiple(Array.from(selectedIds));
    } else {
      selectedIds.forEach((id) => onRemove(id));
    }
    setSelectedIds(new Set());
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Search, Filter & Bulk Controls Toolbar */}
      <div className="bg-[#121826] border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Center: Status filter pills */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('done')}
            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              statusFilter === 'done' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shrunk ({items.filter((i) => i.status === 'done').length})
          </button>
          {items.some((i) => i.status === 'processing') && (
            <button
              type="button"
              onClick={() => setStatusFilter('processing')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                statusFilter === 'processing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shrinking ({items.filter((i) => i.status === 'processing').length})
            </button>
          )}
          {items.some((i) => i.status === 'error') && (
            <button
              type="button"
              onClick={() => setStatusFilter('error')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                statusFilter === 'error' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Errors ({items.filter((i) => i.status === 'error').length})
            </button>
          )}
        </div>

        {/* Right: View toggle & Bulk delete */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-2.5 py-1 text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          <button
            type="button"
            onClick={selectAll}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title={selectedIds.size === filteredItems.length ? 'Deselect all' : 'Select all'}
          >
            {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const hasCompressed = item.status === 'done' && item.compressedUrl;
            const savings = item.compressionRatio ?? 0;
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`bg-[#121826] border rounded-xl overflow-hidden transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Visual Preview Area */}
                <div className="relative h-44 bg-slate-950 flex items-center justify-center p-2 overflow-hidden border-b border-slate-800/80 group">
                  {hasCompressed ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={item.compressedUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded drop-shadow-md"
                        loading="lazy"
                      />
                      {/* Hover Overlay with Inspect CTA */}
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white cursor-pointer"
                      >
                        <span className="p-2 rounded-full bg-indigo-600/80 shadow-md">
                          <Eye className="w-4 h-4 text-white" />
                        </span>
                        <span className="text-xs font-medium">Inspect Shrunk Quality</span>
                      </button>
                    </div>
                  ) : item.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-indigo-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-medium">Shrinking image...</span>
                    </div>
                  ) : item.status === 'error' ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-rose-400 px-4 text-center">
                      <AlertCircle className="w-6 h-6" />
                      <span className="text-xs font-medium">Shrink Failed</span>
                      <span className="text-[11px] text-slate-500">{item.errorMessage}</span>
                    </div>
                  ) : (
                    <img
                      src={item.originalUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain opacity-50"
                      loading="lazy"
                    />
                  )}

                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(item.id);
                    }}
                    className="absolute top-2.5 left-2.5 z-10 p-1 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 text-white cursor-pointer hover:bg-indigo-600"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Size Indicator Badge on Image */}
                  {hasCompressed && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono tabular-nums text-indigo-300 font-semibold shadow-sm flex items-center gap-1">
                      <FileCheck2 className="w-3 h-3 text-emerald-400" />
                      <span>{formatBytes(item.compressedSize || 0)}</span>
                    </div>
                  )}

                  {/* Format Pill on Image Bottom */}
                  {hasCompressed && (
                    <div
                      className="absolute bottom-2 left-2.5 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono uppercase text-indigo-300 flex items-center gap-1 shadow-sm"
                      title={item.detectedFormatReason || `Format: ${item.compressedFormat?.toUpperCase()}`}
                    >
                      {item.detectedFormatReason && <Wand2 className="w-2.5 h-2.5 text-blue-400" />}
                      <span>{item.compressedFormat}</span>
                    </div>
                  )}
                </div>

                {/* Info & Metrics Area */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums truncate">
                        {item.originalWidth}×{item.originalHeight} px · {formatBytes(item.originalSize)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer shrink-0"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Compression delta */}
                  {hasCompressed && (
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Output: </span>
                        <span className="text-slate-200 font-mono tabular-nums font-medium">
                          {item.compressedWidth}×{item.compressedHeight} px
                        </span>
                      </div>
                      <div className="font-mono tabular-nums font-semibold text-emerald-400 text-[11px]">
                        -{savings.toFixed(1)}%
                      </div>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onInspect(item)}
                      disabled={!hasCompressed}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Compare</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadSingle(item)}
                      disabled={!hasCompressed}
                      className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#121826] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredItems.length}
                      onChange={selectAll}
                      className="rounded border-slate-700 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Original Size</th>
                  <th className="px-3 py-3">Dimensions</th>
                  <th className="px-3 py-3">Shrunk Output</th>
                  <th className="px-3 py-3">Format</th>
                  <th className="px-3 py-3">Savings</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const hasCompressed = item.status === 'done' && item.compressedUrl;
                  const savings = item.compressionRatio ?? 0;
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-slate-900/40 transition-colors ${isSelected ? 'bg-indigo-950/20' : ''}`}>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-700 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.compressedUrl || item.originalUrl}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-slate-700/60 shrink-0"
                            loading="lazy"
                          />
                          <span className="font-medium text-white truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 font-mono tabular-nums text-slate-400">
                        {formatBytes(item.originalSize)}
                      </td>

                      <td className="px-3 py-2.5 font-mono tabular-nums text-slate-400">
                        {item.originalWidth}×{item.originalHeight} → {item.compressedWidth ?? '—'}×{item.compressedHeight ?? '—'}
                      </td>

                      <td className="px-3 py-2.5 font-mono tabular-nums font-semibold text-indigo-400">
                        {item.compressedSize ? formatBytes(item.compressedSize) : '—'}
                      </td>

                      <td className="px-3 py-2.5 font-mono uppercase text-slate-300">
                        <div className="flex items-center gap-1.5">
                          {item.detectedFormatReason && (
                            <span title={item.detectedFormatReason} className="cursor-help inline-flex items-center">
                              <Wand2 className="w-3 h-3 text-blue-400 shrink-0" />
                            </span>
                          )}
                          <span>{item.compressedFormat ?? '—'}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 font-mono tabular-nums font-semibold text-emerald-400">
                        {hasCompressed ? `-${savings.toFixed(1)}%` : '—'}
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspect(item)}
                            disabled={!hasCompressed}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
                            title="Inspect & Compare"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadSingle(item)}
                            disabled={!hasCompressed}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
