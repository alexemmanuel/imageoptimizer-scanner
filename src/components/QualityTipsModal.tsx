import React from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, Printer, Zap, FileText } from 'lucide-react';

interface QualityTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QualityTipsModal: React.FC<QualityTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121826] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Rules &amp; Tips — wildlogic Engine Architecture</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Image Batch Optimizer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>Function 1: Image Batch Optimizer</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Optimal Resolution Envelope &amp; Target Size</div>
                  <div className="text-slate-400 mt-0.5">
                    Instead of destroying high-res images with 1% quality, we downscale to the optical sweet spot where encoder quality stays at 75%–85%, keeping faces and products razor-sharp at your exact desired target size.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Smart Detect &amp; Modern Codecs</div>
                  <div className="text-slate-400 mt-0.5">
                    Automatically checks browser codec capabilities (AVIF, WebP, JPEG, PNG) to pick the ideal container for transparency and maximum compression density.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Meeting Portal &amp; Exam Minimum Size Floors (≥ 5 KB)</div>
                  <div className="text-slate-400 mt-0.5">
                    Government, visa, passport, and university portals often reject files under 5 KB or 10 KB. wildlogic&apos;s <strong className="text-indigo-300">Minimum Floor</strong> mode guarantees your file never falls below the threshold, preventing upload rejection.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Optical Document Scanner Machine */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Printer className="w-4 h-4" />
              <span>Function 2: Flatbed Optical Document Scanner Machine</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Adaptive Shadow Removal &amp; Paper Whitening</div>
                  <div className="text-slate-400 mt-0.5">
                    Smartphone photos of papers have uneven room shadows and hand shadows. The scanner machine models a real office flatbed lamp by estimating localized background illumination and flattening the paper to pure uniform white.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Magic Color &amp; Ink Preservation</div>
                  <div className="text-slate-400 mt-0.5">
                    Unlike naive grayscale, Magic Color isolates chromatic ink channels (blue pen signatures, red rubber audit stamps, colored logos, green notary seals) and boosts their saturation while eliminating surrounding paper discoloration.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Laser B&amp;W Photocopy Mode</div>
                  <div className="text-slate-400 mt-0.5">
                    Sauvola adaptive thresholding binarizes the document into deep black text and zero background noise. Perfect for contracts, printed legal documents, and official receipts.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-900/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
