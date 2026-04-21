/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  styleTags: string[];
  occasionTags: string[];
  shortDescription: string;
  fullDescription: string;
  material: string;
  careInstructions: string;
  price: number;
  priceOnRequest: boolean;
  currency: string;
  featured: boolean;
  trending: boolean;
  bridal: boolean;
  madeToOrder: boolean;
  onlyFewLeft: boolean;
  instagramUrl?: string;
  whatsappEnabled: boolean;
  thumbnailImage: string;
  galleryImages: string[];
  createdAt: any;
  updatedAt: any;
  active: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  sortOrder: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  wishlist: string[]; // array of product IDs
  recentlyViewed: string[]; // array of product IDs
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  image?: string;
  active: boolean;
}
