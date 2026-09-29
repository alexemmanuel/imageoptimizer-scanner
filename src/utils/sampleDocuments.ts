/**
 * Creates authentic sample document images programmatically
 * (Invoice with stamp & signature, Official Certificate, and Store Receipt)
 * with realistic camera lighting shadows to showcase the Scanner Machine's
 * background whitening, shadow removal, and Magic Color ink preservation.
 */

function createInvoiceCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Natural warm paper base with subtle texture
  ctx.fillStyle = '#f8f5ee';
  ctx.fillRect(0, 0, 1200, 1600);

  // Subtle paper grain
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  for (let i = 0; i < 600; i++) {
    const rx = Math.random() * 1200;
    const ry = Math.random() * 1600;
    ctx.fillRect(rx, ry, Math.random() * 2, Math.random() * 2);
  }

  // 2. Realistic Smartphone Shadow Gradient across upper right & bottom left (typical desk lighting)
  const shadowGrad = ctx.createLinearGradient(0, 0, 1200, 1600);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
  shadowGrad.addColorStop(0.35, 'rgba(40, 30, 20, 0.12)');
  shadowGrad.addColorStop(0.7, 'rgba(30, 25, 20, 0.22)');
  shadowGrad.addColorStop(1, 'rgba(15, 10, 5, 0.38)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, 1200, 1600);

  // 3. Document Header & Company Branding
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText('NEXUS LOGISTICS & CONSULTING', 90, 140);

  ctx.fillStyle = '#475569';
  ctx.font = '16px monospace';
  ctx.fillText('742 EVERGREEN TERRACE, SUITE 400 • NEW YORK, NY 10001', 90, 175);
  ctx.fillText('PHONE: +1 (212) 555-0198 • TAX ID: US-89218204-K', 90, 200);

  // Divider line
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(90, 230);
  ctx.lineTo(1110, 230);
  ctx.stroke();

  // Invoice Metadata
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('INVOICE / RECEIPT', 90, 290);

  ctx.fillStyle = '#334155';
  ctx.font = '18px monospace';
  ctx.fillText('INVOICE NO:  INV-2026-08942', 90, 330);
  ctx.fillText('DATE ISSUED: 28 SEP 2026', 90, 360);
  ctx.fillText('DUE DATE:    12 OCT 2026', 90, 390);

  ctx.fillText('BILLED TO:   APEX INDUSTRIAL CORP.', 680, 330);
  ctx.fillText('ATTENTION:   DIRECTOR OF OPERATIONS', 680, 360);
  ctx.fillText('PO NUMBER:   PO-99120-X', 680, 390);

  // Table Header
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(90, 440, 1020, 45);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('ITEM DESCRIPTION', 110, 470);
  ctx.fillText('QTY', 660, 470);
  ctx.fillText('UNIT PRICE', 760, 470);
  ctx.fillText('AMOUNT (USD)', 960, 470);

  // Table Rows
  const items = [
    { desc: 'High-Density Cloud Image Processing Engine', qty: '1', unit: '$2,400.00', total: '$2,400.00' },
    { desc: 'Parallel Multi-Core Batch Optimization Module', qty: '4', unit: '$650.00', total: '$2,600.00' },
    { desc: 'Ultra-Compression 5 KB Minimum Rule Compliance', qty: '1', unit: '$1,250.00', total: '$1,250.00' },
    { desc: 'Dedicated SLA Maintenance & Edge CDN (12 Mo)', qty: '12', unit: '$210.00', total: '$2,520.00' },
    { desc: 'Enterprise Security Hardening & Zero-Data Retain', qty: '1', unit: '$880.00', total: '$880.00' },
  ];

  ctx.font = '16px monospace';
  let curY = 525;
  items.forEach((it, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent';
    ctx.fillRect(90, curY - 25, 1020, 38);

    ctx.fillStyle = '#1e293b';
    ctx.fillText(it.desc, 110, curY);
    ctx.fillText(it.qty, 675, curY);
    ctx.fillText(it.unit, 770, curY);
    ctx.fillText(it.total, 970, curY);
    curY += 46;
  });

  // Totals Box
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(650, 780, 460, 140);

  ctx.fillStyle = '#334155';
  ctx.font = '16px monospace';
  ctx.fillText('SUBTOTAL:           $9,650.00', 670, 815);
  ctx.fillText('STATE TAX (8.25%):    $796.12', 670, 845);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('BALANCE DUE:       $10,446.12', 670, 895);

  // Payment Terms & Barcode
  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText('TERMS: Payment is due within 14 days of invoice receipt.', 90, 980);
  ctx.fillText('Remit wire payment to Chase Manhattan Bank • Account: 0891-2384-9128', 90, 1005);

  // Simulated Barcode
  ctx.fillStyle = '#111827';
  for (let bx = 90; bx < 380; bx += Math.floor(Math.random() * 5 + 3)) {
    ctx.fillRect(bx, 1040, Math.random() > 0.4 ? 3 : 1.5, 55);
  }
  ctx.font = '12px monospace';
  ctx.fillText('*INV-2026-08942-APPROVED*', 90, 1115);

  // 4. Vibrant Blue Ink Ballpoint Signature (to test Magic Color preservation)
  ctx.strokeStyle = '#1d4ed8'; // Royal blue ink
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(720, 1260);
  ctx.bezierCurveTo(750, 1220, 780, 1210, 810, 1250);
  ctx.bezierCurveTo(830, 1270, 850, 1290, 880, 1230);
  ctx.bezierCurveTo(900, 1190, 930, 1220, 960, 1270);
  ctx.bezierCurveTo(970, 1285, 1000, 1290, 1030, 1255);
  ctx.stroke();

  // Signature flourish underline
  ctx.beginPath();
  ctx.moveTo(710, 1295);
  ctx.bezierCurveTo(790, 1310, 890, 1280, 1050, 1295);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '14px sans-serif';
  ctx.fillText('AUTHORIZED SIGNATURE & STAMP', 740, 1330);

  // 5. Official Red Circular Rubber Stamp (to test Magic Color red ink extraction)
  ctx.save();
  ctx.translate(320, 1300);
  ctx.rotate(-0.18); // Authentic tilt of rubber stamp
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.88)'; // Stamp Red
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 64, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ OFFICIAL SEAL ★', 0, -32);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('VERIFIED', 0, 8);
  ctx.font = '12px monospace';
  ctx.fillText('AUDIT & COMPLIANCE', 0, 32);
  ctx.restore();

  // Bottom Notice
  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Thank you for your business. Certified electronic audit documentation.', 600, 1530);

  return canvas.toDataURL('image/jpeg', 0.9);
}

function createCertificateCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1150;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Cream parchment background
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, 1600, 1150);

  // Ambient corner camera shadow
  const grad = ctx.createRadialGradient(800, 575, 400, 800, 575, 950);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(40, 30, 15, 0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1600, 1150);

  // Ornate double border
  ctx.strokeStyle = '#b45309'; // Gold/Amber border
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 60, 1480, 1030);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(74, 74, 1452, 1002);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 44px serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF RECOGNITION', 800, 210);

  ctx.font = 'italic 22px serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('This document certifies that the bearer has achieved full qualification in', 800, 275);

  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('HIGH-SPEED IMAGE OPTIMIZATION & SCANNING SYSTEMS', 800, 350);

  ctx.font = '20px serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Awarded for exceptional performance in zero-loss client-side processing,', 800, 430);
  ctx.fillText('adaptive Sauvola binarization, and automated 5 KB portal threshold compliance.', 800, 465);

  // Certificate ID & Date
  ctx.font = '16px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('REGISTRATION ID: CERT-89412-WILDLOGIC • ISSUED: SEPTEMBER 2026', 800, 550);

  // Gold Seal Badge
  ctx.save();
  ctx.translate(450, 780);
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('EXCELLENCE', 0, 5);
  ctx.restore();

  // Signature 1
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 930);
  ctx.bezierCurveTo(400, 890, 450, 910, 520, 940);
  ctx.stroke();
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Dr. Marcus Vance, Chief Architect', 440, 980);

  // Signature 2
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1050, 930);
  ctx.bezierCurveTo(1120, 880, 1180, 920, 1250, 940);
  ctx.stroke();
  ctx.fillText('Elena Rostova, Director of Standards', 1150, 980);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export interface SampleDocumentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  getDataUrl: () => string;
}

export const SAMPLE_DOCUMENTS: SampleDocumentItem[] = [
  {
    id: 'sample-invoice',
    name: 'Consulting_Invoice_INV-8942.jpg',
    category: 'Invoice & Stamps',
    description: 'Commercial invoice with blue signature, red audit seal, and phone camera desk shadows',
    getDataUrl: createInvoiceCanvas,
  },
  {
    id: 'sample-certificate',
    name: 'Accreditation_Certificate.jpg',
    category: 'Official Certificate',
    description: 'Formal award certificate testing gold foil seal, dark borders, and parchment illumination',
    getDataUrl: createCertificateCanvas,
  },
];

/**
 * Loads sample document into a File object for the scanner
 */
export async function loadSampleDocumentFile(sample: SampleDocumentItem): Promise<File> {
  const dataUrl = sample.getDataUrl();
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], sample.name, { type: 'image/jpeg' });
}
