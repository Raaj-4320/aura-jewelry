#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Papa from 'papaparse';

const isDryRun = process.argv.includes('--dry-run');
const csvPath = path.resolve(process.cwd(), 'public/products.csv');

if (!fs.existsSync(csvPath)) {
  console.error('CSV not found at public/products.csv');
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!getApps().length) {
  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
  } else {
    initializeApp({ credential: applicationDefault() });
  }
}
const db = getFirestore();

const csvText = fs.readFileSync(csvPath, 'utf8');
const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
if (parsed.errors.length) {
  console.error(`CSV parse errors: ${parsed.errors.length}`);
}

const byHandle = new Map();
for (const row of parsed.data) {
  const handle = String(row['Handle'] || '').trim();
  if (!handle) continue;
  const imageSrc = String(row['Image Src'] || '').trim();
  const imagePosition = Number(row['Image Position'] || 0);
  if (!byHandle.has(handle)) byHandle.set(handle, []);
  if (imageSrc) byHandle.get(handle).push({ src: imageSrc, position: Number.isFinite(imagePosition) ? imagePosition : 0 });
}

let scanned = 0;
let multiImageProducts = 0;
let updated = 0;
let skipped = 0;
let singleImageProducts = 0;

const snapshot = await db.collection('products').get();
for (const doc of snapshot.docs) {
  scanned += 1;
  const data = doc.data() || {};
  const handle = String(data.handle || data.slug || doc.id || '').trim();
  const csvImages = byHandle.get(handle) || [];
  const deduped = Array.from(
    new Map(
      csvImages
        .filter((entry) => entry.src)
        .sort((a, b) => a.position - b.position)
        .map((entry) => [entry.src, entry.position])
    ).keys()
  );

  if (deduped.length === 0) {
    skipped += 1;
    continue;
  }
  if (deduped.length > 1) multiImageProducts += 1;
  else singleImageProducts += 1;

  const payload = {
    image: deduped[0],
    imageSrc: deduped[0],
    thumbnailImage: deduped[0],
    images: deduped,
    galleryImages: deduped,
  };

  if (isDryRun) {
    console.log(`[DRY RUN] would update ${doc.id} (${handle}) with ${deduped.length} images`);
  } else {
    await doc.ref.update(payload);
    updated += 1;
  }
}

console.log('--- Repair Summary ---');
console.log(`products scanned: ${scanned}`);
console.log(`products with multiple CSV images: ${multiImageProducts}`);
console.log(`docs updated: ${updated}`);
console.log(`docs skipped: ${skipped}`);
console.log(`products with only one image: ${singleImageProducts}`);
