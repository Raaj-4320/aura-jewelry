import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { normalizeCategory, normalizeSubcategory } from '../lib/utils';

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) return code;
  }
  return 'unknown-error';
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const code = getErrorCode(error);
  const operationLabel = `${operationType}${path ? ` at ${path}` : ''}`;
  console.error(`Firestore operation failed [${code}] during ${operationLabel}`);
  throw new Error(`Firestore operation failed: ${code} during ${operationLabel}.`);
}

function normalizeProduct(raw: Record<string, any>, id: string): Product {
  const name = raw.name || raw.title || 'Untitled Product';
  const slug = raw.slug || raw.handle || id;
  const category = raw.category || normalizeCategory(raw.productCategory || raw.type || 'uncategorized');
  const subcategory = raw.subcategory || normalizeSubcategory(raw.jewelryType || raw.color || '');
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const toImageUrl = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (value && typeof value === 'object') {
      const candidate = (value as Record<string, unknown>).src
        || (value as Record<string, unknown>).url
        || (value as Record<string, unknown>).image;
      return typeof candidate === 'string' ? candidate.trim() : '';
    }
    return '';
  };

  const pushImage = (value: unknown, position: number, bucket: Array<{ url: string; position: number }>) => {
    const url = toImageUrl(value);
    if (!url) return;
    bucket.push({ url, position });
  };

  const candidates: Array<{ url: string; position: number }> = [];
  const primaryCandidates = [raw.thumbnailImage, raw.mainImage, raw.image, raw.imageSrc];
  primaryCandidates.forEach((candidate, index) => pushImage(candidate, index, candidates));

  if (Array.isArray(raw.images)) {
    raw.images.forEach((img: unknown, index: number) => {
      if (img && typeof img === 'object') {
        const imgRecord = img as Record<string, unknown>;
        const positionCandidate = Number(imgRecord.position);
        const parsedPosition = Number.isFinite(positionCandidate) ? positionCandidate : index + 10;
        pushImage(img, parsedPosition, candidates);
        return;
      }
      pushImage(img, index + 10, candidates);
    });
  }

  if (Array.isArray(raw.galleryImages)) {
    raw.galleryImages.forEach((img: unknown, index: number) => pushImage(img, index + 10, candidates));
  }
  if (Array.isArray(raw.variantImages)) {
    raw.variantImages.forEach((img: unknown, index: number) => pushImage(img, index + 10, candidates));
  }

  const deduped = new Map<string, number>();
  candidates.forEach(({ url, position }) => {
    const existing = deduped.get(url);
    if (existing === undefined || position < existing) deduped.set(url, position);
  });
  const sortedImages = Array.from(deduped.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([url]) => url);

  const thumbnailImage = sortedImages[0] || '';
  const galleryImages = sortedImages;
  const images = sortedImages;
  const status = String(raw.status || '').toLowerCase();
  const activeByStatus = !status || status === 'active';
  const active = raw.active ?? (activeByStatus && raw.published !== false);
  const price = typeof raw.price === 'number' ? raw.price : Number(raw.price || 0);

  return {
    id,
    name,
    slug,
    category,
    subcategory,
    styleTags: raw.styleTags || tags,
    occasionTags: raw.occasionTags || tags,
    shortDescription: raw.shortDescription || raw.description || name,
    fullDescription: raw.fullDescription || raw.description || raw.descriptionHtml || name,
    material: raw.material || 'Jewelry',
    careInstructions: raw.careInstructions || 'Store in a dry box and clean gently with a soft cloth.',
    price,
    priceOnRequest: raw.priceOnRequest ?? price <= 0,
    currency: raw.currency || 'INR',
    featured: !!raw.featured,
    trending: !!raw.trending,
    bridal: !!raw.bridal,
    madeToOrder: !!raw.madeToOrder,
    onlyFewLeft: !!raw.onlyFewLeft,
    instagramUrl: raw.instagramUrl,
    whatsappEnabled: raw.whatsappEnabled ?? true,
    thumbnailImage,
    galleryImages,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    active: !!active,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
    descriptionHtml: raw.descriptionHtml,
    vendor: raw.vendor,
    tags,
    mainImage: thumbnailImage,
    images,
    imageAlt: raw.imageAlt,
    jewelryType: raw.jewelryType,
    color: raw.color,
    targetGender: raw.targetGender,
    status: raw.status,
  };
}

function isPublicVisibleProduct(product: Product, raw: Record<string, any>) {
  const status = String(product.status || raw.status || '').toLowerCase();
  const activeFlag = product.active === true || status === 'active';
  const publishedFlag = raw.published !== false;
  return activeFlag && publishedFlag;
}

// Products
export const getProducts = async (filters?: { category?: string; featured?: boolean; limit?: number }) => {
  const path = 'products';
  try {
    let q = query(collection(db, path));
    
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters?.featured) {
      q = query(q, where('featured', '==', true));
    }
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const normalizedProducts = snapshot.docs
      .map((item) => {
        const raw = item.data() as Record<string, any>;
        const normalized = normalizeProduct(raw, item.id);
        return { normalized, raw };
      })
      .filter(({ normalized, raw }) => isPublicVisibleProduct(normalized, raw))
      .map(({ normalized }) => normalized)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return filters?.limit ? normalizedProducts.slice(0, filters.limit) : normalizedProducts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getAdminProducts = async (filters?: { category?: string; featured?: boolean; limit?: number }) => {
  const path = 'products';
  try {
    let q = query(collection(db, path));
    if (filters?.category) q = query(q, where('category', '==', filters.category));
    if (filters?.featured) q = query(q, where('featured', '==', true));
    const snapshot = await getDocs(q);
    const normalizedProducts = snapshot.docs
      .map((item) => normalizeProduct(item.data() as Record<string, any>, item.id))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return filters?.limit ? normalizedProducts.slice(0, filters.limit) : normalizedProducts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getProductBySlug = async (slug: string) => {
  const path = 'products';
  try {
    const slugQuery = query(collection(db, path), where('slug', '==', slug), limit(1));
    let snapshot = await getDocs(slugQuery);
    if (!snapshot.empty) {
      return normalizeProduct(snapshot.docs[0].data() as Record<string, any>, snapshot.docs[0].id);
    }

    const handleQuery = query(collection(db, path), where('handle', '==', slug), limit(1));
    snapshot = await getDocs(handleQuery);
    if (snapshot.empty) return null;
    return normalizeProduct(snapshot.docs[0].data() as Record<string, any>, snapshot.docs[0].id);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const getProductById = async (id: string) => {
  const path = `products/${id}`;
  try {
    const productSnap = await getDoc(doc(db, 'products', id));
    if (!productSnap.exists()) return null;
    return normalizeProduct(productSnap.data() as Record<string, any>, productSnap.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

type ProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export const createProduct = async (product: ProductPayload) => {
  const path = 'products';
  try {
    return await addDoc(collection(db, path), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateProduct = async (id: string, data: Partial<ProductPayload>) => {
  const path = `products/${id}`;
  try {
    await updateDoc(doc(db, 'products', id), { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteProduct = async (id: string) => {
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const toggleProductActive = async (id: string, active: boolean) => {
  return updateProduct(id, { active });
};

// Wishlist
export const toggleWishlist = async (userId: string, productId: string, currentWishlist: string[]) => {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    let newWishlist = [...currentWishlist];
    if (newWishlist.includes(productId)) {
      newWishlist = newWishlist.filter(id => id !== productId);
    } else {
      newWishlist.push(productId);
    }
    await updateDoc(userRef, { wishlist: newWishlist });
    return newWishlist;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Test Connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
