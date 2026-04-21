import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CATEGORIES, SUB_CATEGORIES } from '../constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

export function generateSlug(name: string) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeToken(value: string) {
  return generateSlug(value || '');
}

export function normalizeCategory(value: string) {
  const token = normalizeToken(value);
  const match = CATEGORIES.find(
    (cat) => token === cat.id || token === cat.slug || token === normalizeToken(cat.name)
  );
  return match?.slug || token;
}

export function normalizeSubcategory(value: string) {
  const token = normalizeToken(value);
  const match = SUB_CATEGORIES.find(
    (sub) => token === sub.id || token === normalizeToken(sub.name)
  );
  return match?.id || token;
}

export function sanitizeWhatsAppNumber(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : '';
}
