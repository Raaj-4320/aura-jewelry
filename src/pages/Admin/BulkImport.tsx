import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { motion } from 'motion/react';
import { 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  X,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateSlug, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

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
}

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'preview' | 'uploading' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);

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
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as ImportRow[];
        setParsedData(data);
        setImportStatus('preview');
      };
      reader.onerror = () => {
        toast.error("Excel file reading failed");
        setImportStatus('idle');
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Please upload a CSV or Excel file");
      setImportStatus('idle');
    }
  };

  const processBoolean = (val: any) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      return lower === 'true' || lower === 'yes' || lower === '1';
    }
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

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setImportStatus('uploading');
    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    const productsRef = collection(db, 'products');

    for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        if (!row.Name || !row.Category) {
            failCount++;
            continue;
        }

        try {
            const productData = {
                name: row.Name,
                slug: generateSlug(row.Name),
                category: row.Category,
                subcategory: row.Subcategory || '',
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
                active: true,
                sortOrder: 0,
                styleTags: [],
                occasionTags: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(productsRef, productData);
            successCount++;
            setProgress(Math.round(((i + 1) / parsedData.length) * 100));
        } catch (err) {
            console.error("Import failed for row", i, err);
            failCount++;
        }
    }

    toast.success(`Successfully imported ${successCount} products. ${failCount} failed.`);
    setImportStatus('complete');
    setLoading(false);
  };

  const downloadTemplate = () => {
    const headers = [
      'Name', 'Category', 'Subcategory', 'Price', 'PriceOnRequest', 
      'ShortDescription', 'FullDescription', 'Material', 'CareInstructions', 
      'ThumbnailImage', 'Featured', 'Trending', 'Bridal', 'MadeToOrder', 
      'OnlyFewLeft', 'InstagramUrl'
    ];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "aura_jewelry_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-white rounded-full transition-all text-taupe">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Bulk Import</h1>
            <p className="text-xs text-taupe tracking-widest uppercase">Import multiple products via CSV or Excel</p>
          </div>
        </div>

        {/* Info & Template */}
        <div className="bg-blush p-6 rounded-3xl border border-rose-gold/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl text-rose-gold">
              <Download size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-deep-taupe">Download Template</h3>
              <p className="text-xs text-taupe">Get the correctly formatted file to avoid import errors.</p>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            className="btn-secondary whitespace-nowrap"
          >
            Download CSV Template
          </button>
        </div>

        {/* Upload Area */}
        {importStatus === 'idle' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[2/1] rounded-[2.5rem] border-2 border-dashed border-rose-gold/20 bg-white hover:bg-rose-gold-light/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group"
          >
            <div className="w-20 h-20 rounded-full bg-blush flex items-center justify-center text-rose-gold group-hover:scale-110 transition-transform">
              <FileUp size={36} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-light text-deep-taupe">Click to select or drag and drop</p>
              <p className="text-xs text-taupe uppercase tracking-widest">Supports CSV, XLSX, XLS</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv, .xlsx, .xls"
              className="hidden" 
            />
          </div>
        )}

        {/* Parsing State */}
        {importStatus === 'parsing' && (
          <div className="py-20 text-center space-y-6">
            <Loader2 className="animate-spin mx-auto text-rose-gold" size={48} />
            <p className="text-sm text-taupe uppercase tracking-widest">Analyzing file data...</p>
          </div>
        )}

        {/* Preview State */}
        {importStatus === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-rose-gold/10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="text-rose-gold" size={24} />
                <div>
                  <p className="text-sm font-semibold text-deep-taupe">{fileName}</p>
                  <p className="text-xs text-taupe">{parsedData.length} records found</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setImportStatus('idle');
                    setParsedData([]);
                  }}
                  className="p-2 text-taupe hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
                <button 
                  onClick={handleImport}
                  className="btn-primary"
                >
                  Confirm & Import
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-rose-gold/10 overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-warm-gray z-10">
                    <tr className="border-b border-warm-gray">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-taupe">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-taupe">Category</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-taupe">Price</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-taupe">Featured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-gray">
                    {parsedData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-warm-gray/10">
                        <td className="px-6 py-3 text-xs text-deep-taupe">{row.Name}</td>
                        <td className="px-6 py-3 text-xs text-taupe">{row.Category}</td>
                        <td className="px-6 py-3 text-xs text-rose-gold font-medium">{row.Price}</td>
                        <td className="px-6 py-3 text-xs text-taupe">{String(row.Featured)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 50 && (
                <div className="p-4 bg-warm-gray/30 text-center text-[10px] text-taupe uppercase tracking-widest">
                  Showing first 50 records
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uploading State */}
        {importStatus === 'uploading' && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-rose-gold/10 text-center space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-light text-deep-taupe uppercase tracking-widest">Importing Products</h3>
              <p className="text-sm text-taupe">Please do not close this window</p>
            </div>
            
            <div className="w-full h-3 bg-warm-gray rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-rose-gold transition-all duration-300"
              />
            </div>
            <p className="text-lg font-medium text-rose-gold">{progress}% Complete</p>
            
            <div className="flex items-center justify-center gap-3 text-taupe animate-pulse">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs uppercase tracking-widest">Uploading to Firestore...</span>
            </div>
          </div>
        )}

        {/* Complete State */}
        {importStatus === 'complete' && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-rose-gold/10 text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-light text-deep-taupe uppercase tracking-widest">Import Successful!</h3>
              <p className="text-sm text-taupe">Your collection has been updated.</p>
            </div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigate('/admin/products')}
                className="btn-primary"
              >
                Go to Products
              </button>
              <button 
                onClick={() => {
                  setImportStatus('idle');
                  setParsedData([]);
                  setProgress(0);
                }}
                className="btn-secondary"
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
