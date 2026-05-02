import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { motion } from 'motion/react';
import {
  FileUp,
  Download,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { generateSlug, normalizeCategory, normalizeSubcategory } from '../../lib/utils';
import toast from 'react-hot-toast';
import { createProduct } from '../../services/firebaseService';

interface ImportRow {
  Name: string;
  Category: string;
  Subcategory?: string;
  Price?: string | number;
  PriceOnRequest?: string | boolean;
  ShortDescription?: string;
  FullDescription?: string;
  Material?: string;
  CareInstructions?: string;
  ThumbnailImage?: string;
  Featured?: string | boolean;
  Trending?: string | boolean;
  Bridal?: string | boolean;
  MadeToOrder?: string | boolean;
  OnlyFewLeft?: string | boolean;
  InstagramUrl?: string;
  Active?: string | boolean;
}

interface PreparedRow {
  row: ImportRow;
  normalizedCategory: string;
  normalizedSubcategory: string;
  productName: string;
  errors: string[];
}

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'preview' | 'uploading' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);

  const processBoolean = (val: any, fallback = false) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      return lower === 'true' || lower === 'yes' || lower === '1';
    }
    if (val === undefined || val === null || val === '') return fallback;
    return !!val;
  };

  const processPrice = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  };

  const preparedRows = useMemo<PreparedRow[]>(() => {
    return parsedData.map((row) => {
      const productName = String(row.Name || '').trim();
      const normalizedCategory = normalizeCategory(String(row.Category || ''));
      const normalizedSubcategory = normalizeSubcategory(String(row.Subcategory || ''));
      const errors: string[] = [];

      if (!productName) errors.push('Missing Name');
      if (!normalizedCategory) errors.push('Missing Category');
      if (!generateSlug(productName)) errors.push('Invalid Name for slug');

      return {
        row,
        normalizedCategory,
        normalizedSubcategory,
        productName,
        errors,
      };
    });
  }, [parsedData]);

  const validRows = preparedRows.filter((entry) => entry.errors.length === 0);
  const invalidRows = preparedRows.filter((entry) => entry.errors.length > 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus('parsing');
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data as ImportRow[]);
          setImportStatus('preview');
        },
        error: (error) => {
          toast.error(`CSV Parsing Error: ${error.message}`);
          setImportStatus('idle');
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setParsedData(XLSX.utils.sheet_to_json(ws) as ImportRow[]);
        setImportStatus('preview');
      };
      reader.onerror = () => {
        toast.error('Excel file reading failed');
        setImportStatus('idle');
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Please upload a CSV or Excel file');
      setImportStatus('idle');
    }
  };

  const getUniqueSlug = async (name: string) => {
    const baseSlug = generateSlug(name);
    if (!baseSlug) return '';
    let candidate = baseSlug;
    let index = 1;
    while (true) {
      const snap = await getDocs(query(collection(db, 'products'), where('slug', '==', candidate), limit(1)));
      if (snap.empty) return candidate;
      index += 1;
      candidate = `${baseSlug}-${index}`;
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows to import.');
      return;
    }

    setImportStatus('uploading');
    setLoading(true);

    let successCount = 0;
    let failCount = invalidRows.length;
    const runtimeFailures: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const prepared = validRows[i];
      const row = prepared.row;

      try {
        const uniqueSlug = await getUniqueSlug(prepared.productName);
        const productData = {
          name: prepared.productName,
          slug: uniqueSlug,
          category: prepared.normalizedCategory,
          subcategory: prepared.normalizedSubcategory,
          price: processPrice(row.Price),
          priceOnRequest: processBoolean(row.PriceOnRequest),
          shortDescription: row.ShortDescription || '',
          fullDescription: row.FullDescription || '',
          material: row.Material || '',
          careInstructions: row.CareInstructions || '',
          thumbnailImage: row.ThumbnailImage || 'https://picsum.photos/seed/jewelry/800/1000',
          galleryImages: [],
          featured: processBoolean(row.Featured),
          trending: processBoolean(row.Trending),
          bridal: processBoolean(row.Bridal),
          madeToOrder: processBoolean(row.MadeToOrder),
          onlyFewLeft: processBoolean(row.OnlyFewLeft),
          instagramUrl: row.InstagramUrl || '',
          whatsappEnabled: true,
          active: processBoolean(row.Active, true),
          sortOrder: 0,
          styleTags: [],
          occasionTags: [],
          currency: 'INR',
        };

        await createProduct(productData as any);
        successCount++;
      } catch (error) {
        console.error('Import failed', error);
        runtimeFailures.push(`Row ${i + 1} (${prepared.productName}): ${(error as Error)?.message || 'Unknown error'}`);
        failCount++;
      } finally {
        setProgress(Math.round(((i + 1) / validRows.length) * 100));
      }
    }

    if (runtimeFailures.length) {
      toast.error(`Imported ${successCount}. ${failCount} failed. Check console for row errors.`);
      console.error('Bulk import row failures:', runtimeFailures);
    } else {
      toast.success(`Imported ${successCount} products. ${failCount} rows skipped/failed.`);
    }
    setImportStatus('complete');
    setLoading(false);
  };

  const downloadTemplate = () => {
    const headers = [
      'Name', 'Category', 'Subcategory', 'Price', 'PriceOnRequest',
      'ShortDescription', 'FullDescription', 'Material', 'CareInstructions',
      'ThumbnailImage', 'Featured', 'Trending', 'Bridal', 'MadeToOrder',
      'OnlyFewLeft', 'InstagramUrl', 'Active',
    ];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'aura_jewelry_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-white rounded-full transition-all text-taupe">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Bulk Import</h1>
            <p className="text-xs text-taupe tracking-widest uppercase">Import products via CSV or Excel</p>
          </div>
        </div>

        <div className="bg-blush p-6 rounded-3xl border border-rose-gold/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-deep-taupe">Download Template</h3>
            <p className="text-xs text-taupe">Use slug-friendly categories (e.g. necklaces, bridal-sets, minimal).</p>
          </div>
          <button onClick={downloadTemplate} className="btn-secondary whitespace-nowrap">Download CSV Template</button>
        </div>

        {importStatus === 'idle' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[2/1] rounded-[2rem] border-2 border-dashed border-rose-gold/20 bg-white hover:bg-rose-gold-light/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group px-4"
          >
            <div className="w-20 h-20 rounded-full bg-blush flex items-center justify-center text-rose-gold group-hover:scale-110 transition-transform">
              <FileUp size={36} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-base sm:text-lg font-light text-deep-taupe">Click to select import file</p>
              <p className="text-xs text-taupe uppercase tracking-widest">Supports CSV, XLSX, XLS</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
          </div>
        )}

        {importStatus === 'parsing' && (
          <div className="py-20 text-center space-y-6">
            <Loader2 className="animate-spin mx-auto text-rose-gold" size={48} />
            <p className="text-sm text-taupe uppercase tracking-widest">Analyzing file data...</p>
          </div>
        )}

        {importStatus === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-rose-gold/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="text-rose-gold" size={24} />
                <div>
                  <p className="text-sm font-semibold text-deep-taupe break-all">{fileName}</p>
                  <p className="text-xs text-taupe">{validRows.length} valid / {invalidRows.length} invalid rows</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setImportStatus('idle'); setParsedData([]); }} className="p-2 text-taupe hover:text-red-500 transition-colors"><X size={20} /></button>
                <button onClick={handleImport} className="btn-primary" disabled={validRows.length === 0}>Confirm & Import</button>
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5" />
                <div>Rows with missing Name/Category or invalid slug source will be skipped automatically.</div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-rose-gold/10 overflow-hidden">
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead className="sticky top-0 bg-warm-gray z-10">
                    <tr className="border-b border-warm-gray">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-taupe">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-taupe">Name</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-taupe">Category</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-taupe">Normalized Category</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-taupe">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-gray">
                    {preparedRows.slice(0, 100).map((prepared, idx) => (
                      <tr key={idx} className="hover:bg-warm-gray/10">
                        <td className="px-4 py-3 text-xs">{prepared.errors.length ? '❌' : '✅'}</td>
                        <td className="px-4 py-3 text-xs text-deep-taupe">{prepared.productName || '-'}</td>
                        <td className="px-4 py-3 text-xs text-taupe">{prepared.row.Category || '-'}</td>
                        <td className="px-4 py-3 text-xs text-rose-gold">{prepared.normalizedCategory || '-'}</td>
                        <td className="px-4 py-3 text-xs text-red-500">{prepared.errors.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {importStatus === 'uploading' && (
          <div className="bg-white p-12 rounded-[2rem] border border-rose-gold/10 text-center space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-light text-deep-taupe uppercase tracking-widest">Importing Products</h3>
              <p className="text-sm text-taupe">Please keep this page open</p>
            </div>
            <div className="w-full h-3 bg-warm-gray rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-rose-gold transition-all duration-300" />
            </div>
            <p className="text-lg font-medium text-rose-gold">{progress}% Complete</p>
          </div>
        )}

        {importStatus === 'complete' && (
          <div className="bg-white p-12 rounded-[2rem] border border-rose-gold/10 text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-light text-deep-taupe uppercase tracking-widest">Import Complete</h3>
              <p className="text-sm text-taupe">Your products are ready in the catalog.</p>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/admin/products')} className="btn-primary">Go to Products</button>
              <button onClick={() => { setImportStatus('idle'); setParsedData([]); setProgress(0); }} className="btn-secondary">Import More</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
