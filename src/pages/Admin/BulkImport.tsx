import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, FileUp, Loader2, Trash2 } from 'lucide-react';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { collection, doc, documentId, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { logDB, logError, logImport, logProduct, logRoute, logUI } from '../../utils/logger';
import { deleteAllProducts, getAdminProducts } from '../../services/firebaseService';

interface CsvRow { [key: string]: string }
interface CsvImage { src: string; position: number; alt: string; source: 'csv' }

const read = (row: CsvRow, key: string) => String(row[key] || '').trim();
const toNum = (v: string) => { const n = Number(String(v).replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : 0; };
const toBool = (v: string, fallback = false) => { const n = String(v || '').trim().toLowerCase(); if (!n) return fallback; return ['true', 'yes', '1', 'active'].includes(n); };
const normalizeHandle = (v: string) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9-\s_]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const stripHtml = (html: string) => String(html || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function groupRows(rows: CsvRow[]) {
  const grouped = new Map<string, CsvRow[]>();
  let blankHandles = 0;
  rows.forEach((row) => {
    const handle = normalizeHandle(read(row, 'Handle'));
    if (!handle) { blankHandles += 1; return; }
    if (!grouped.has(handle)) grouped.set(handle, []);
    grouped.get(handle)!.push(row);
  });
  return { grouped, blankHandles };
}

function mapProduct(handle: string, rows: CsvRow[], fileName: string) {
  const base = rows.find((r) => read(r, 'Title') || read(r, 'Body (HTML)') || read(r, 'Variant Price')) || rows[0];
  const title = read(base, 'Title') || handle;
  const descriptionHtml = read(base, 'Body (HTML)');

  const images: CsvImage[] = rows
    .map((row, idx) => ({ src: read(row, 'Image Src'), position: Number(read(row, 'Image Position')) || idx + 1, alt: read(row, 'Image Alt Text'), source: 'csv' as const }))
    .filter((i) => !!i.src)
    .sort((a, b) => a.position - b.position)
    .filter((img, idx, arr) => arr.findIndex((x) => x.src === img.src) === idx);

  const variants = rows.map((row) => ({
    sku: read(row, 'Variant SKU'), barcode: read(row, 'Variant Barcode'),
    price: toNum(read(row, 'Variant Price')), compareAtPrice: toNum(read(row, 'Variant Compare At Price')),
    inventoryQty: toNum(read(row, 'Variant Inventory Qty')), inventoryTracker: read(row, 'Variant Inventory Tracker'), inventoryPolicy: read(row, 'Variant Inventory Policy'), fulfillmentService: read(row, 'Variant Fulfillment Service'),
    optionValues: [read(row, 'Option1 Value'), read(row, 'Option2 Value'), read(row, 'Option3 Value')].filter(Boolean),
    optionNames: [read(row, 'Option1 Name'), read(row, 'Option2 Name'), read(row, 'Option3 Name')].filter(Boolean),
    requiresShipping: toBool(read(row, 'Variant Requires Shipping'), true), taxable: toBool(read(row, 'Variant Taxable'), true), grams: toNum(read(row, 'Variant Grams')), weightUnit: read(row, 'Variant Weight Unit'), costPerItem: toNum(read(row, 'Cost per item')), image: read(row, 'Variant Image'),
  }));
  const optionMap = new Map<string, Set<string>>();
  variants.forEach((v) => v.optionNames.forEach((name: string, idx: number) => { if (!optionMap.has(name)) optionMap.set(name, new Set()); if (v.optionValues[idx]) optionMap.get(name)!.add(v.optionValues[idx]); }));
  const options = Array.from(optionMap.entries()).map(([name, values]) => ({ name, values: Array.from(values) }));

  const status = (read(base, 'Status') || 'active').toLowerCase();
  const published = toBool(read(base, 'Published'), true);
  const active = published && status !== 'draft' && status !== 'archived';
  const defaultVariant: any = variants.find((v) => v.price > 0) || variants[0] || {};

  const googleShopping: Record<string, string> = {};
  const metafields: Record<string, string> = {};
  Object.keys(base).forEach((k) => { if (k.toLowerCase().startsWith('google shopping')) googleShopping[k] = read(base, k); if (k.toLowerCase().startsWith('metafield:')) metafields[k] = read(base, k); });

  const galleryImages = images.map((i) => i.src);
  const thumbnailImage = galleryImages[0] || '';

  return {
    product: {
      id: handle, handle, slug: handle, title, name: title,
      descriptionHtml, descriptionText: stripHtml(descriptionHtml), description: stripHtml(descriptionHtml),
      vendor: read(base, 'Vendor'), productCategory: read(base, 'Product Category'), category: read(base, 'Product Category') || read(base, 'Type') || 'uncategorized', type: read(base, 'Type'),
      tags: read(base, 'Tags').split(',').map((t) => t.trim()).filter(Boolean),
      published, status, active,
      price: defaultVariant.price || 0, compareAtPrice: defaultVariant.compareAtPrice || 0, sellPrice: defaultVariant.price || 0,
      sku: defaultVariant.sku || '', barcode: defaultVariant.barcode || '',
      inventory: { qty: defaultVariant.inventoryQty || 0, tracker: defaultVariant.inventoryTracker || '', policy: defaultVariant.inventoryPolicy || '', fulfillmentService: defaultVariant.fulfillmentService || '' },
      shipping: { requiresShipping: defaultVariant.requiresShipping ?? true, taxable: defaultVariant.taxable ?? true, grams: defaultVariant.grams || 0, weightUnit: defaultVariant.weightUnit || '', costPerItem: defaultVariant.costPerItem || 0 },
      options, variants,
      images, galleryImages, thumbnailImage, image: thumbnailImage, imageSrc: thumbnailImage,
      seo: { title: read(base, 'SEO Title'), description: read(base, 'SEO Description') },
      googleShopping, metafields,
      source: { type: 'shopify_csv', fileName, rowCount: rows.length, importedFrom: 'admin_bulk_import' },
    },
    errors: !handle || !title ? ['Invalid handle/title'] : [],
  };
}

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'dry-run' | 'importing' | 'complete'>('idle');
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());
  const [existingSlugs, setExistingSlugs] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteProgress, setDeleteProgress] = useState({ completed: 0, total: 0, failed: 0, running: false });
  const [importProgress, setImportProgress] = useState({ total: 0, completed: 0, created: 0, skipped: 0, failed: 0, current: '', percent: 0 });

  const refreshStats = async () => {
    logDB('import_existing_summary_request_start');
    const products = (await getAdminProducts()) || [];
    logDB('import_existing_summary_request_success', { total: products.length });
    const active = products.filter((p) => p.active).length;
    setStats({ total: products.length, active, inactive: products.length - active });
  };
  useEffect(() => { logRoute('route_rendered', { page: 'AdminBulkImport', path: window.location.pathname }); logImport('import_page_loaded'); refreshStats(); }, []);

  const analysis = useMemo(() => {
    const { grouped, blankHandles } = groupRows(rows);
    const mapped = Array.from(grouped.entries()).map(([handle, group]) => ({ handle, ...mapProduct(handle, group, fileName) }));
    const valid = mapped.filter((m) => m.errors.length === 0);
    const invalid = mapped.filter((m) => m.errors.length > 0);
    const existing = valid.filter((m) => existingIds.has(m.handle) || existingSlugs.has(m.handle));
    const ready = valid.filter((m) => !existingIds.has(m.handle) && !existingSlugs.has(m.handle));
    const withMultiImages = valid.filter((m) => m.product.images.length > 1).length;
    return { groupedCount: grouped.size, valid, invalid, blankHandles, existing, ready, withMultiImages };
  }, [rows, fileName, existingIds, existingSlugs]);

  const parseRawCsvText = async (raw: string, name: string) => {
    setFileName(name); setStatus('parsing');
    logImport('parse_start', { parser: 'papaparse', fileName: name });
    const result = Papa.parse<CsvRow>(raw, { header: true, skipEmptyLines: true, delimiter: '', transformHeader: (h) => h.trim() });
    if (result.errors.length) { logImport('parse_failure', { message: result.errors[0].message }); toast.error(result.errors[0].message); setStatus('idle'); return; }
    logImport('parse_success', { totalRows: (result.data||[]).length, headers: Object.keys((result.data||[])[0] || {}) });
    setRows((result.data || []).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v ?? '').trim()]))));
    const handles = Array.from(new Set((result.data || []).map((r) => normalizeHandle(String((r as any).Handle || ''))).filter(Boolean)));
    const ids = new Set<string>(); const slugs = new Set<string>();
    for (let i = 0; i < handles.length; i += 10) {
      const chunk = handles.slice(i, i + 10);
      const byId = await getDocs(query(collection(db, 'products'), where(documentId(), 'in', chunk))); byId.docs.forEach((d) => ids.add(d.id));
      const bySlug = await getDocs(query(collection(db, 'products'), where('slug', 'in', chunk))); bySlug.docs.forEach((d) => slugs.add(String((d.data() as any).slug || '')));
    }
    setExistingIds(ids); setExistingSlugs(slugs); setStatus('dry-run');
  };

  const handleFile = async (file: File) => {
    if (status === 'importing' || deleteProgress.running) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      await parseRawCsvText(csv, file.name);
      return;
    }
    const text = await file.text();
    await parseRawCsvText(text, file.name);
  };

  const onDeleteAll = async () => {
    if (deleteConfirmText !== 'DELETE ALL') { toast.error('Type DELETE ALL to confirm'); return; }
    setDeleteProgress({ completed: 0, total: stats.total, failed: 0, running: true });
    try {
      const result = await deleteAllProducts((p) => setDeleteProgress((prev) => ({ ...prev, ...p, running: true })));
      toast.success(`Deleted ${result.completed - result.failed}/${result.total} products.`);
      setRows([]); setExistingIds(new Set()); setExistingSlugs(new Set()); setStatus('idle');
      await refreshStats();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Delete all failed'); }
    setDeleteProgress((p) => ({ ...p, running: false }));
    setDeleteConfirmOpen(false); setDeleteConfirmText('');
  };

  const handleImport = async () => {
    const total = analysis.ready.length;
    setStatus('importing');
    setImportProgress({ total, completed: 0, created: 0, skipped: analysis.existing.length, failed: 0, current: '', percent: 0 });
    let created = 0; let skipped = analysis.existing.length; let failed = 0;
    for (let i = 0; i < analysis.ready.length; i++) {
      const item = analysis.ready[i];
      setImportProgress((p) => ({ ...p, current: item.product.name || item.handle }));
      try {
        const ref = doc(db, 'products', item.handle);
        const exists = await getDoc(ref);
        if (exists.exists()) { skipped += 1; }
        else {
          const slugTaken = (await getDocs(query(collection(db, 'products'), where('slug', '==', item.handle)))).size > 0;
          if (slugTaken) skipped += 1;
          else { await setDoc(ref, item.product as any, { merge: false }); created += 1; }
        }
      } catch { failed += 1; }
      const completed = i + 1;
      setImportProgress({ total, completed, created, skipped, failed, current: item.product.name || item.handle, percent: Math.round((completed / Math.max(1, total)) * 100) });
    }
    logImport('import_process_complete', { created, skipped, failed, total });
    toast.success(`Import done. Created ${created}, skipped ${skipped}, failed ${failed}.`);
    await refreshStats();
    setStatus('complete');
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-6">
        <div className="flex items-center gap-4"><button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-white rounded-full text-taupe"><ArrowLeft size={20} /></button><h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Bulk Import</h1></div>

        <div className="bg-white border rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Database Summary</h2>
          <div className="grid grid-cols-3 gap-3 text-sm"><div>Total: {stats.total}</div><div>Active: {stats.active}</div><div>Inactive: {stats.inactive}</div></div>
          {stats.total > 0 && <p className="text-amber-700 text-sm">There are already products in the database.</p>}
          <div className="flex gap-3"><button className="btn-secondary" onClick={() => navigate('/admin/products')}>View Products</button><button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => setDeleteConfirmOpen(true)} disabled={deleteProgress.running || status === 'importing'}><Trash2 size={16} /> Delete All Products</button></div>
          {deleteProgress.running && <div className="text-sm text-taupe">Deleting {deleteProgress.completed}/{deleteProgress.total} ({Math.round((deleteProgress.completed / Math.max(1, deleteProgress.total)) * 100)}%) • Failed: {deleteProgress.failed}</div>}
        </div>

        {status === 'idle' && <div onClick={() => fileInputRef.current?.click()} className="aspect-[2/1] rounded-[2rem] border-2 border-dashed border-rose-gold/20 bg-white cursor-pointer flex flex-col items-center justify-center gap-4"><FileUp size={36} /><p>Upload CSV/XLS/XLSX</p><input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} accept=".csv,.tsv,.txt,.xlsx,.xls" className="hidden" disabled={deleteProgress.running} /></div>}
        {status === 'parsing' && <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>}

        {status === 'dry-run' && <div className="bg-white p-6 rounded-3xl border space-y-4"><div className="flex items-center gap-3"><FileSpreadsheet size={20} /><p className="text-sm">{fileName}</p></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm"><div>Total rows: {rows.length}</div><div>Grouped products: {analysis.groupedCount}</div><div>Valid products: {analysis.valid.length}</div><div>Invalid products: {analysis.invalid.length}</div><div>Blank handles: {analysis.blankHandles}</div><div>With multiple images: {analysis.withMultiImages}</div><div>Existing Firestore products: {analysis.existing.length}</div><div>Ready to create: {analysis.ready.length}</div><div>Skipped existing: {analysis.existing.length}</div></div><div className="flex gap-3"><button onClick={handleImport} className="btn-primary" disabled={status === 'importing' || deleteProgress.running || analysis.ready.length === 0}>Confirm Import (Create Missing Only)</button><button onClick={() => { setStatus('idle'); setRows([]); }} className="btn-secondary" disabled={status === 'importing'}>Reset</button></div></div>}

        {status === 'importing' && <div className="bg-white p-6 rounded-3xl border space-y-3"><div className="flex items-center gap-2"><Loader2 className="animate-spin" /><p>Importing… {importProgress.current}</p></div><div className="w-full h-3 bg-warm-gray rounded-full overflow-hidden"><div className="h-full bg-rose-gold" style={{ width: `${importProgress.percent}%` }} /></div><p className="text-sm">{importProgress.completed}/{importProgress.total} ({importProgress.percent}%) • Created: {importProgress.created} • Skipped: {importProgress.skipped} • Failed: {importProgress.failed}</p></div>}

        {status === 'complete' && <div className="bg-white p-8 rounded-3xl border text-center space-y-4"><CheckCircle2 className="mx-auto text-green-600"/><p>Import complete.</p><p className="text-sm text-taupe">Created: {importProgress.created} • Skipped: {importProgress.skipped} • Failed: {importProgress.failed}</p><button onClick={() => navigate('/admin/products')} className="btn-primary">Go to Products</button></div>}

        {deleteConfirmOpen && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4"><div className="flex items-center gap-2 text-red-600"><AlertTriangle size={18} /><h3 className="font-semibold">Confirm Delete All Products</h3></div><p className="text-sm text-taupe">Type <strong>DELETE ALL</strong> to confirm permanent deletion.</p><input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full border rounded-xl px-3 py-2" /><div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button><button className="btn-primary bg-red-600 hover:bg-red-700" onClick={onDeleteAll}>Delete All Products</button></div></div></div>}
      </div>
    </AdminLayout>
  );
}
