# wildlogic

> **IMAGE EDITOR WITH THE SAME QUALITY ASSURANCE AND VIBES – *no perceptible difference from the original; it's only been optimised.***

A dual-function, high-speed web application built with React 19, TypeScript, Vite, and Tailwind CSS. **wildlogic** serves two dedicated workflows directly in the browser with 100% client-side privacy.

1. **⚡ High-Speed 50-Image Batch Optimizer**: Shrink photos down to strict file sizes (including 5 KB minimum portal requirements) in WebP, AVIF, JPEG, or PNG with smart dimension scaling and edge-preserving filtering.
2. **📄 Optical Document Scanner Machine**: Upload camera photos of documents, receipts, contracts, or ID cards to produce authentic flatbed scanner results—removing camera shadows, whitening paper, and enhancing text.

**🌐 [Try wildlogic image optimizer](https://alexemmanuel.github.io/imageoptimizer-scanner/)**

---

## ⚡ Core Functions

### 1. Optical Document Scanner Machine
- **Authentic Flatbed Scanner Output**: Simulates real office flatbed scanners (e.g. Canon, Xerox, Fujitsu ScanSnap, CamScanner).
- **Adaptive Shadow Removal & Paper Flattening**: Eliminates smartphone camera lighting gradients, yellow cast, and desk shadows to render pure white paper backgrounds.
- **Dedicated Scanner Presets**:
  - ✨ **Magic Color**: Whitens paper while isolating and amplifying blue ink signatures, red notary stamps, official seals, and colored letterhead.
  - 📄 **B&W Photocopy**: Sauvola adaptive thresholding produces crisp deep black text on pure white paper with zero bleed-through.
  - 📑 **Clean Grayscale**: Continuous multi-tone gray for pencil sketches, watermarked forms, and receipts.
  - 🪪 **Photo & ID Card**: Natural continuous tones for passports, driver's licenses, and photo badges.
- **Interactive Split Compare Slider**: Drag across the document to view camera photo vs. scanned machine output in real-time.
- **Multi-Page PDF & Image Export**: Scan multiple pages and download as a formatted A4 / Letter PDF document (via `jsPDF`) or high-res PNG/JPG scans.
- **Direct Synergy with Optimizer**: Send scanned documents directly into wildlogic's 5 KB batch optimizer for portal compliance.

### 2. Batch Image Optimizer & Resizer
- **1 to 50 Image Parallel Processing**: Process single photos or batches of up to 50 images with multi-core web worker concurrency.
- **Strict Size Floor & Ceiling Compliance**: Guarantees files meet minimum portal requirements (≥ 5 KB) or strict maximum caps.
- **Smart Detect Engine**: Automatically detects image type (alpha transparency vs photographic) and browser hardware codec support (AVIF, WebP, JPEG).
- **Interactive Before/After Zoom Slider**: Inspect quality, resolution, and applied quality with 1x, 2x, and 4x zoom.
- **Bulk ZIP Archive**: Export all optimized images in one click.
- **100% Client-Side Privacy**: Zero server uploads; all processing runs locally in browser memory.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/<your-username>/wildlogic.git
cd wildlogic

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Tech Stack
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Archiving**: [JSZip](https://stuk.github.io/jszip/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📄 License
MIT License
