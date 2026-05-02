import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product } from '../types';

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Products
export const getProducts = async (filters?: { category?: string; featured?: boolean; limit?: number }) => {
  const path = 'products';
  try {
    let q = query(collection(db, path), where('active', '==', true), orderBy('sortOrder', 'asc'));
    
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getAdminProducts = async (filters?: { category?: string; featured?: boolean; limit?: number }) => {
  const path = 'products';
  try {
    let q = query(collection(db, path), orderBy('sortOrder', 'asc'));
    if (filters?.category) q = query(q, where('category', '==', filters.category));
    if (filters?.featured) q = query(q, where('featured', '==', true));
    if (filters?.limit) q = query(q, limit(filters.limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getProductBySlug = async (slug: string) => {
  const path = 'products';
  try {
    const q = query(collection(db, path), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Product;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const getProductById = async (id: string) => {
  const path = `products/${id}`;
  try {
    const productSnap = await getDoc(doc(db, 'products', id));
    if (!productSnap.exists()) return null;
    return { id: productSnap.id, ...productSnap.data() } as Product;
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
