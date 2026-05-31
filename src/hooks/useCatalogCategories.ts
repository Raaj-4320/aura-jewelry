import { useEffect, useState } from 'react';
import { CATEGORIES, SUB_CATEGORIES } from '../constants';
import { CatalogCategories, getCatalogCategories } from '../services/categoryService';

const fallback: CatalogCategories = { categories: CATEGORIES, subcategories: SUB_CATEGORIES };

export function useCatalogCategories() {
  const [catalog, setCatalog] = useState<CatalogCategories>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCatalogCategories()
      .then((next) => { if (active) setCatalog(next); })
      .catch((error) => console.error('Failed to load managed categories', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { ...catalog, loading };
}
