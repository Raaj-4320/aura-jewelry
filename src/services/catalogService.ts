import * as Papa from 'papaparse';
import { Product } from '../types';
import { generateSlug, normalizeCategory, normalizeSubcategory } from '../lib/utils';

type CsvRow = Record<string, string>;

const CSV_URL = (import.meta.env.VITE_PRODUCT_CSV_URL || '/products.csv').trim();

let cache: Product[] | null = null;

function readField(row: CsvRow, candidates: string[]) {
  for (const key of candidates) {
    const value = row[key];
    if (value !== undefined && String(value).trim() !== '') return normalizeText(String(value).trim());
  }
  return '';
}

function normalizeText(value: string) {
  const raw = String(value || '');
  if (!raw) return '';
  // Best-effort mojibake recovery for UTF-8 interpreted as latin1.
  if (/Ã|Â|â€™|â€œ|â€\u009d|â€“|â€”/.test(raw)) {
    try {
      return decodeURIComponent(escape(raw));
    } catch {
      return raw;
    }
  }
  return raw;
}

function toTags(raw: string) {
  return String(raw || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function stripHtml(html: string) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPrice(raw: string) {
  const cleaned = String(raw || '').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseStatus(raw: string) {
  const value = String(raw || '').toLowerCase();
  if (!value) return 'active';
  return value;
}

function transformGroupedRows(rows: CsvRow[]): Product[] {
  const grouped = new Map<string, CsvRow[]>();

  rows.forEach((row) => {
    const handle = readField(row, ['Handle']);
    if (!handle) return;
    if (!grouped.has(handle)) grouped.set(handle, []);
    grouped.get(handle)!.push(row);
  });

  let order = 0;
  return Array.from(grouped.entries()).map(([handle, handleRows]) => {
    const baseRow =
      handleRows.find((row) =>
        readField(row, ['Title', 'Body (HTML)', 'Variant Price', 'Type', 'Product Category']) !== ''
      ) || handleRows[0];

    const title = readField(baseRow, ['Title']) || handle;
    const descriptionHtml = readField(baseRow, ['Body (HTML)']);
    const descriptionText = stripHtml(descriptionHtml);
    const vendor = readField(baseRow, ['Vendor']);
    const category =
      normalizeCategory(readField(baseRow, ['Type', 'Product Category'])) || 'uncategorized';
    const tags = toTags(readField(baseRow, ['Tags']));
    const price = toPrice(readField(baseRow, ['Variant Price']));
    const imageAlt = readField(baseRow, ['Image Alt Text']);
    const material = readField(baseRow, ['Metafield: custom.material [single_line_text_field]', 'Material']);
    const jewelryType = readField(baseRow, ['Metafield: custom.jewelry_type [single_line_text_field]', 'Jewelry Type']);
    const color = readField(baseRow, ['Metafield: custom.color [single_line_text_field]', 'Color']);
    const targetGender = readField(baseRow, ['Metafield: custom.target_gender [single_line_text_field]', 'Target Gender']);
    const status = parseStatus(readField(baseRow, ['Status']));
    const instagramUrl = readField(baseRow, ['Metafield: custom.instagram_url [url]', 'Instagram URL']);

    const images = handleRows
      .map((row) => readField(row, ['Image Src']))
      .filter(Boolean)
      .filter((src, idx, arr) => arr.indexOf(src) === idx);

    const slug = generateSlug(handle) || generateSlug(title) || handle;
    const shortDescription = descriptionText.slice(0, 140);
    const bridal = category.includes('bridal') || tags.some((t) => t.toLowerCase().includes('bridal'));
    const minimal =
      normalizeSubcategory(jewelryType || '') === 'minimal' ||
      tags.some((t) => t.toLowerCase().includes('minimal'));

    const product: Product = {
      id: handle,
      slug,
      name: title,
      category,
      subcategory: normalizeSubcategory(jewelryType || color || ''),
      styleTags: tags,
      occasionTags: tags,
      shortDescription: shortDescription || title,
      fullDescription: descriptionText || title,
      material: material || 'Jewelry',
      careInstructions: 'Store in a dry box and clean gently with a soft cloth.',
      price,
      priceOnRequest: price <= 0,
      currency: 'INR',
      featured: tags.some((t) => /featured|bestseller|best seller/i.test(t)),
      trending: tags.some((t) => /trending|popular/i.test(t)),
      bridal,
      madeToOrder: tags.some((t) => /made[- ]?to[- ]?order/i.test(t)),
      onlyFewLeft: tags.some((t) => /few left|limited/i.test(t)),
      instagramUrl: instagramUrl || undefined,
      whatsappEnabled: true,
      thumbnailImage: images[0] || 'https://picsum.photos/seed/jewelry/800/1000',
      galleryImages: images,
      createdAt: { seconds: Date.now() / 1000 - order },
      updatedAt: { seconds: Date.now() / 1000 },
      active: status !== 'draft' && status !== 'archived',
      sortOrder: order++,
      descriptionHtml,
      vendor,
      tags,
      mainImage: images[0] || '',
      images,
      imageAlt,
      jewelryType,
      color,
      targetGender,
      status,
    } as Product;

    return product;
  });
}

export async function getDisplayProducts() {
  if (cache) return cache;

  const response = await fetch(CSV_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load CSV source from ${CSV_URL}`);
  }
  const csvText = await response.text();

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0].message);
  }

  cache = transformGroupedRows(parsed.data || []);
  if (!cache.length) {
    throw new Error('No products found in CSV source');
  }
  return cache;
}

export async function getDisplayProductBySlug(slug: string) {
  const products = await getDisplayProducts();
  return products.find((p) => p.slug === slug || p.id === slug) || null;
}
