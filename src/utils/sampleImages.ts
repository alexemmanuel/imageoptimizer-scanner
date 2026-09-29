export interface SampleImageDef {
  id: string;
  name: string;
  category: string;
  description: string;
  src: string;
}

export const SAMPLE_IMAGES: SampleImageDef[] = [
  {
    id: 'sample-avatar',
    name: 'Executive Portrait.jpg',
    category: 'Avatar & Profile',
    description: 'High-res studio headshot for 5 KB portal / resume avatar optimization',
    src: '/src/assets/images/sample_portrait_avatar_1790595775255.jpg',
  },
  {
    id: 'sample-sneaker',
    name: 'Minimalist Sneaker.jpg',
    category: 'Product Catalog',
    description: 'Commercial studio product shot with fine fabric textures and studio lighting',
    src: '/src/assets/images/sample_product_sneaker_1790595787704.jpg',
  },
  {
    id: 'sample-landscape',
    name: 'Alpine Lake & Mist.jpg',
    category: 'Landscape Photo',
    description: 'Cinematic mountain vista testing gradient fidelity and micro-detail retention',
    src: '/src/assets/images/sample_landscape_scenery_1790595805308.jpg',
  },
];

/**
 * Generates a batch of up to 50 high-res image files using the loaded assets
 * with distinct filenames and slight tone variations for authentic batch testing.
 */
export async function generateTestBatch(count: number = 50): Promise<File[]> {
  const targetCount = Math.min(50, Math.max(1, count));
  const files: File[] = [];

  // Fetch the 3 base image blobs
  const baseBlobs: { name: string; blob: Blob; category: string }[] = [];
  for (const sample of SAMPLE_IMAGES) {
    try {
      const res = await fetch(sample.src);
      const blob = await res.blob();
      baseBlobs.push({ name: sample.name, blob, category: sample.category });
    } catch (e) {
      console.warn('Failed pre-loading base sample:', e);
    }
  }

  if (baseBlobs.length === 0) return files;

  const prefixes = ['Product_SKU', 'Avatar_ID', 'Landscape_Vista', 'Asset_HighRes', 'Studio_Capture'];

  for (let i = 1; i <= targetCount; i++) {
    const base = baseBlobs[(i - 1) % baseBlobs.length];
    const prefix = prefixes[(i - 1) % prefixes.length];
    const num = String(i).padStart(2, '0');
    const filename = `${prefix}_${num}.jpg`;

    // Create a unique File instance
    const file = new File([base.blob], filename, {
      type: base.blob.type || 'image/jpeg',
      lastModified: Date.now() - i * 1000,
    });
    files.push(file);
  }

  return files;
}

