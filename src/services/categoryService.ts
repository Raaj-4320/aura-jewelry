import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CATEGORIES, SUB_CATEGORIES } from '../constants';
import { db } from '../firebase';
import { generateSlug } from '../lib/utils';
import { logDB } from '../utils/logger';

export interface ManagedCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ManagedSubcategory {
  id: string;
  name: string;
}

export interface CatalogCategories {
  categories: ManagedCategory[];
  subcategories: ManagedSubcategory[];
}

const FALLBACK_CATALOG: CatalogCategories = {
  categories: CATEGORIES.map((category) => ({ ...category })),
  subcategories: SUB_CATEGORIES.map((subcategory) => ({ ...subcategory })),
};

function cleanCategories(value: unknown): ManagedCategory[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    const raw = entry as Partial<ManagedCategory>;
    const name = String(raw?.name || '').trim();
    const slug = generateSlug(String(raw?.slug || raw?.id || name));
    if (!name || !slug || seen.has(slug)) return [];
    seen.add(slug);
    return [{ id: slug, name, slug }];
  });
}

function cleanSubcategories(value: unknown): ManagedSubcategory[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    const raw = entry as Partial<ManagedSubcategory>;
    const name = String(raw?.name || '').trim();
    const id = generateSlug(String(raw?.id || name));
    if (!name || !id || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name }];
  });
}

export async function getCatalogCategories(): Promise<CatalogCategories> {
  logDB('catalog_categories_request_start');
  const snapshot = await getDoc(doc(db, 'settings', 'categories'));
  if (!snapshot.exists()) {
    logDB('catalog_categories_fallback_used', { reason: 'settings/categories missing' });
    return FALLBACK_CATALOG;
  }
  const data = snapshot.data();
  const categories = cleanCategories(data.categories);
  const subcategories = cleanSubcategories(data.subcategories);
  const result = {
    categories: categories.length ? categories : FALLBACK_CATALOG.categories,
    subcategories: subcategories.length ? subcategories : FALLBACK_CATALOG.subcategories,
  };
  logDB('catalog_categories_request_success', { categories: result.categories.length, subcategories: result.subcategories.length });
  return result;
}

export async function saveCatalogCategories(catalog: CatalogCategories) {
  const categories = cleanCategories(catalog.categories);
  const subcategories = cleanSubcategories(catalog.subcategories);
  if (!categories.length) throw new Error('Keep at least one category.');
  if (!subcategories.length) throw new Error('Keep at least one subcategory.');
  if (categories.length !== catalog.categories.length) throw new Error('Category names must be unique and cannot be blank.');
  if (subcategories.length !== catalog.subcategories.length) throw new Error('Subcategory names must be unique and cannot be blank.');
  await setDoc(doc(db, 'settings', 'categories'), { categories, subcategories, updatedAt: serverTimestamp() }, { merge: true });
  logDB('catalog_categories_save_success', { categories: categories.length, subcategories: subcategories.length });
  return { categories, subcategories };
}
