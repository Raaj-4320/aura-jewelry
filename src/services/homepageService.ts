import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logDB } from '../utils/logger';

export type HomepageCollection = 'featured' | 'new-arrivals' | 'bridal' | 'minimal' | 'category';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  eyebrow: string;
  title: string;
  accentText: string;
  trailingText: string;
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
}

export interface HomepageSection {
  id: string;
  visible: boolean;
  title: string;
  subtitle: string;
  collection: HomepageCollection;
  categorySlug: string;
  productLimit: number;
  shopLink: string;
}

export interface HomepageContent {
  version: number;
  heroEnabled: boolean;
  heroAutoplaySeconds: number;
  heroSlides: HeroSlide[];
  categoriesEnabled: boolean;
  categoriesTitle: string;
  categoryLimit: number;
  sections: HomepageSection[];
  quoteEnabled: boolean;
  quoteText: string;
  instagramEnabled: boolean;
}

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  version: 1,
  heroEnabled: true,
  heroAutoplaySeconds: 6,
  heroSlides: [{
    id: 'hero-default', imageUrl: '', eyebrow: 'Timeless Elegance', title: 'Sviwa', accentText: 'Your Inner', trailingText: 'Luminescence',
    primaryLabel: 'Explore Collection', primaryLink: '/shop', secondaryLabel: 'Bridal Edit', secondaryLink: '/shop?category=bridal-sets',
  }],
  categoriesEnabled: true,
  categoriesTitle: 'Shop by Category',
  categoryLimit: 4,
  sections: [
    { id: 'featured', visible: true, title: 'Featured Collection', subtitle: 'Curated Selection', collection: 'featured', categorySlug: '', productLimit: 4, shopLink: '/shop' },
    { id: 'new-arrivals', visible: true, title: 'New Arrivals', subtitle: 'Just Added', collection: 'new-arrivals', categorySlug: '', productLimit: 4, shopLink: '/shop?sort=newest' },
    { id: 'bridal', visible: true, title: 'Bridal Edit', subtitle: 'Wedding Spotlight', collection: 'bridal', categorySlug: 'bridal-sets', productLimit: 4, shopLink: '/shop?category=bridal-sets' },
    { id: 'minimal', visible: true, title: 'Minimal Favorites', subtitle: 'Everyday Elegance', collection: 'minimal', categorySlug: '', productLimit: 4, shopLink: '/shop?subcategory=minimal' },
  ],
  quoteEnabled: true,
  quoteText: "Jewelry is not just an accessory; it's a reflection of your soul's radiance.",
  instagramEnabled: true,
};

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value.trim() : fallback;
const boundedInt = (value: unknown, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const collectionTypes: HomepageCollection[] = ['featured', 'new-arrivals', 'bridal', 'minimal', 'category'];

export function createEmptyHeroSlide(): HeroSlide {
  return { id: id('hero'), imageUrl: '', eyebrow: '', title: '', accentText: '', trailingText: '', primaryLabel: '', primaryLink: '/shop', secondaryLabel: '', secondaryLink: '' };
}

export function createEmptyHomepageSection(): HomepageSection {
  return { id: id('section'), visible: true, title: 'Collection', subtitle: 'Curated Selection', collection: 'featured', categorySlug: '', productLimit: 4, shopLink: '/shop' };
}

function cleanHeroSlides(value: unknown): HeroSlide[] {
  if (!Array.isArray(value)) return DEFAULT_HOMEPAGE_CONTENT.heroSlides;
  const slides = value.flatMap((entry, index) => {
    const raw = entry as Partial<HeroSlide>;
    const slide = {
      id: text(raw.id, `hero-${index + 1}`), imageUrl: text(raw.imageUrl), eyebrow: text(raw.eyebrow), title: text(raw.title), accentText: text(raw.accentText), trailingText: text(raw.trailingText),
      primaryLabel: text(raw.primaryLabel), primaryLink: text(raw.primaryLink, '/shop'), secondaryLabel: text(raw.secondaryLabel), secondaryLink: text(raw.secondaryLink),
    };
    return slide.title || slide.imageUrl ? [slide] : [];
  });
  return slides.length ? slides : DEFAULT_HOMEPAGE_CONTENT.heroSlides;
}

function cleanSections(value: unknown): HomepageSection[] {
  if (!Array.isArray(value)) return DEFAULT_HOMEPAGE_CONTENT.sections;
  const seen = new Set<string>();
  const sections = value.flatMap((entry, index) => {
    const raw = entry as Partial<HomepageSection>;
    const sectionId = text(raw.id, `section-${index + 1}`);
    if (seen.has(sectionId)) return [];
    seen.add(sectionId);
    const collection = collectionTypes.includes(raw.collection as HomepageCollection) ? raw.collection as HomepageCollection : 'featured';
    return [{ id: sectionId, visible: raw.visible !== false, title: text(raw.title, 'Collection'), subtitle: text(raw.subtitle, 'Curated Selection'), collection, categorySlug: text(raw.categorySlug), productLimit: boundedInt(raw.productLimit, 4, 1, 12), shopLink: text(raw.shopLink, '/shop') }];
  });
  return sections.length ? sections : DEFAULT_HOMEPAGE_CONTENT.sections;
}

export function normalizeHomepageContent(value: unknown): HomepageContent {
  const raw = (value || {}) as Partial<HomepageContent>;
  return {
    version: 1,
    heroEnabled: raw.heroEnabled !== false,
    heroAutoplaySeconds: boundedInt(raw.heroAutoplaySeconds, DEFAULT_HOMEPAGE_CONTENT.heroAutoplaySeconds, 0, 30),
    heroSlides: cleanHeroSlides(raw.heroSlides),
    categoriesEnabled: raw.categoriesEnabled !== false,
    categoriesTitle: text(raw.categoriesTitle, DEFAULT_HOMEPAGE_CONTENT.categoriesTitle),
    categoryLimit: boundedInt(raw.categoryLimit, DEFAULT_HOMEPAGE_CONTENT.categoryLimit, 1, 12),
    sections: cleanSections(raw.sections),
    quoteEnabled: raw.quoteEnabled !== false,
    quoteText: text(raw.quoteText, DEFAULT_HOMEPAGE_CONTENT.quoteText),
    instagramEnabled: raw.instagramEnabled !== false,
  };
}

export async function getHomepageContent(): Promise<HomepageContent> {
  logDB('homepage_content_request_start');
  const snapshot = await getDoc(doc(db, 'settings', 'homepage'));
  if (!snapshot.exists()) {
    logDB('homepage_content_fallback_used', { reason: 'settings/homepage missing' });
    return DEFAULT_HOMEPAGE_CONTENT;
  }
  const result = normalizeHomepageContent(snapshot.data());
  logDB('homepage_content_request_success', { slides: result.heroSlides.length, sections: result.sections.length });
  return result;
}

export async function saveHomepageContent(content: HomepageContent) {
  const normalized = normalizeHomepageContent(content);
  await setDoc(doc(db, 'settings', 'homepage'), { ...normalized, updatedAt: serverTimestamp() }, { merge: true });
  logDB('homepage_content_save_success', { slides: normalized.heroSlides.length, sections: normalized.sections.length });
  return normalized;
}
