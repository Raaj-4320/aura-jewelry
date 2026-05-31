import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Instagram, Loader2, Save, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../firebase';
import { CATEGORIES, SUB_CATEGORIES } from '../../constants';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { generateSlug, normalizeCategory, normalizeSubcategory } from '../../lib/utils';
import { createProduct, getProductById, updateProduct } from '../../services/firebaseService';
import { logCloudinary, logDB, logProduct, logRoute, logUI } from '../../utils/logger';
import ThemedSelect from '../../components/ThemedSelect';

export default function AddProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { categories, subcategories } = useCatalogCategories();


  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStage, setSaveStage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const [existingSlug, setExistingSlug] = useState('');
  const [existingProductRaw, setExistingProductRaw] = useState<Record<string, any> | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    category: CATEGORIES[0].slug,
    subcategory: SUB_CATEGORIES[0].id,
    price: 0,
    quantity: 1,
    active: true,
    status: 'in-stock',
    shortDescription: '',
    fullDescription: '',
    featured: false,
    trending: false,
    bridal: false,
    madeToOrder: false,
    onlyFewLeft: false,
    whatsappEnabled: true,
    instagramUrl: '',
    thumbnailImage: '',
    galleryImages: [] as string[],
  });

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const isCloudinaryConfigured = !!cloudName && !!uploadPreset;

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const setSaveStageWithLog = (stage: string) => {
    setSaveStage(stage);
    logProduct('product_save_stage_changed', { stage });
  };

  useEffect(() => {
    logRoute('route_rendered', { page: isEdit ? 'AdminEditProduct' : 'AdminAddProduct', path: window.location.pathname });
    if (!isEdit) return;
    (async () => {
      const product = await getProductById(id!);
      if (!product) return;
      const data = product as any;
      setExistingSlug(data.slug || '');
      setExistingProductRaw(data);
      setFormData((prev) => ({
        ...prev,
        ...data,
        name: data.name || data.title || '',
        productCode: data.productCode || data.code || data.sku || '',
        category: normalizeCategory(data.category || CATEGORIES[0].slug),
        subcategory: normalizeSubcategory(data.subcategory || SUB_CATEGORIES[0].id),
        quantity: Number(data.quantity ?? data.inventoryQty ?? data.inventory?.qty ?? (data.active === false ? 0 : 1)),
        status: Number(data.quantity ?? data.inventoryQty ?? data.inventory?.qty ?? (data.active === false ? 0 : 1)) > 0 ? 'in-stock' : 'stockout',
        galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages.filter(Boolean) : [],
        thumbnailImage: data.thumbnailImage || data.mainImage || data.image || data.imageSrc || data.galleryImages?.[0] || '',
      }));
    })();
  }, [id, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const uploadToCloudinary = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: uploadData });
    const data = await res.json();
    if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message || 'Upload failed');
    return String(data.secure_url);
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    logUI('multiple_images_selected', { count: files.length });
    if (!isCloudinaryConfigured) {
      toast.error('Image upload is unavailable: configure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
      return;
    }

    setUploading(true);
    setUploadProgress({ completed: 0, total: files.length });
    logCloudinary('multi_upload_start', { total: files.length });

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const url = await uploadToCloudinary(files[i]);
        uploaded.push(url);
        const completed = i + 1;
        setUploadProgress({ completed, total: files.length });
        logCloudinary('multi_upload_progress', { completed, total: files.length });
      }

      setFormData((prev) => {
        const merged = [...(prev.galleryImages || []), ...uploaded].filter(Boolean);
        const thumbnailImage = prev.thumbnailImage || merged[0] || '';
        if (!prev.thumbnailImage && thumbnailImage) logProduct('thumbnail_auto_selected', { source: 'multi_upload' });
        return { ...prev, galleryImages: merged, thumbnailImage };
      });

      logCloudinary('multi_upload_success', { count: uploaded.length });
      toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? 's' : ''}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getUniqueSlug = async (name: string) => {
    const baseSlug = generateSlug(name);
    if (!baseSlug) return '';
    let candidate = baseSlug;
    let index = 1;
    while (true) {
      const snap = await getDocs(query(collection(db, 'products'), where('slug', '==', candidate), limit(1)));
      if (snap.empty || (isEdit && snap.docs[0].id === id)) return candidate;
      index += 1;
      candidate = `${baseSlug}-${index}`;
    }
  };

  const setAsThumbnail = (url: string) => {
    setFormData((prev) => ({ ...prev, thumbnailImage: url }));
    logProduct('thumbnail_changed', { by: 'manual' });
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => {
      const nextGallery = prev.galleryImages.filter((_, i) => i !== index);
      const removed = prev.galleryImages[index];
      const nextThumb = prev.thumbnailImage === removed ? (nextGallery[0] || '') : prev.thumbnailImage;
      if (prev.thumbnailImage === removed && nextThumb) logProduct('thumbnail_auto_selected', { source: 'remove_image' });
      return { ...prev, galleryImages: nextGallery, thumbnailImage: nextThumb };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logUI('product_save_button_clicked', { mode: isEdit ? 'edit' : 'create' });

    if (isSaving) return;
    if (uploading) {
      toast.error('Please wait for image uploads to finish.');
      return;
    }

    setIsSaving(true);
    logProduct('product_validation_start', { mode: isEdit ? 'edit' : 'create' });

    const name = formData.name.trim();
    const galleryImages = (formData.galleryImages || []).filter(Boolean);
    const thumbnailImage = formData.thumbnailImage || galleryImages[0] || '';

    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!galleryImages.length) missingFields.push('galleryImages');
    if (!thumbnailImage) missingFields.push('thumbnailImage');
    if (!Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) < 0) missingFields.push('quantity');
    if (missingFields.length) {
      logProduct('product_validation_failed', { missingFields });
      toast.error('Name, thumbnail, gallery image, and a valid whole-number quantity are required.');
      setIsSaving(false);
      setSaveStage(null);
      return;
    }

    let saveSucceeded = false;
    try {
      logProduct('product_save_started', { mode: isEdit ? 'edit' : 'create' });
      setSaveStageWithLog('Preparing product details…');

      const slug = isEdit ? (existingSlug || await getUniqueSlug(name)) : await getUniqueSlug(name);
      if (!slug) throw new Error('Please enter a valid product name.');

      const quantity = Math.max(0, Number(formData.quantity || 0));
      const active = quantity > 0;
      const status = active ? 'in-stock' : 'stockout';
      const images = galleryImages.map((src, idx) => ({ src, position: idx + 1, alt: name, source: 'admin' }));
      const canonical = {
        ...formData,
        name,
        title: name,
        productCode: formData.productCode.trim(),
        slug,
        handle: existingProductRaw?.handle || slug,
        category: normalizeCategory(formData.category),
        subcategory: normalizeSubcategory(formData.subcategory),
        price: Number(formData.price || 0),
        quantity,
        inventoryQty: quantity,
        active,
        status,
        thumbnailImage,
        mainImage: thumbnailImage,
        image: thumbnailImage,
        imageSrc: thumbnailImage,
        galleryImages,
        images,
        shortDescription: formData.shortDescription || name,
        fullDescription: formData.fullDescription || formData.shortDescription || name,
      } as Record<string, unknown>;

      const productData = isEdit ? { ...(existingProductRaw || {}), ...canonical } : canonical;
      logUI('product_submit_clicked', { mode: isEdit ? 'edit' : 'create', name, slug, imageCount: galleryImages.length });

      setSaveStageWithLog(isEdit ? 'Updating product…' : 'Creating product…');
      if (isEdit) await updateProduct(id!, productData as any);
      else await createProduct(productData as any);
      saveSucceeded = true;

      logProduct('product_save_success', { mode: isEdit ? 'edit' : 'create', slug });
      toast.success(isEdit ? 'Product updated successfully.' : 'Product created successfully.');
      setSaveStageWithLog('Product saved. Loading products table…');
      logRoute('product_save_redirect_to_products', { to: '/admin/products', mode: isEdit ? 'edit' : 'create' });
      setTimeout(() => navigate('/admin/products'), 350);
    } catch (error) {
      logProduct('product_save_failure', { mode: isEdit ? 'edit' : 'create', message: error instanceof Error ? error.message : 'unknown' });
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      if (!saveSucceeded && isMountedRef.current) {
        setIsSaving(false);
        setSaveStage(null);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-taupe transition-all hover:bg-white"><ArrowLeft size={18} /></button>
            <div><h1 className="text-xl font-light uppercase tracking-widest text-deep-taupe">{isEdit ? 'Edit Piece' : 'Add New Piece'}</h1><p className="text-xs text-taupe">Add details and upload images without leaving this screen.</p></div>
          </div>
          <button type="submit" form="product-form" disabled={isSaving || uploading} className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 disabled:opacity-50">
            {(isSaving || uploading) ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {uploading ? 'Uploading…' : isSaving ? 'Saving…' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
        </div>

        {!isCloudinaryConfigured && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Cloudinary is not configured. Set <code>VITE_CLOUDINARY_CLOUD_NAME</code> and <code>VITE_CLOUDINARY_UPLOAD_PRESET</code>.</div>}

        <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <section className="space-y-3 rounded-2xl border border-rose-gold/15 bg-white p-4 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-gold">Basic Details</h3>
              <div className="grid gap-3 sm:grid-cols-[1fr_13rem]">
                <label className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Product name</span><input name="name" value={formData.name} onChange={handleInputChange} placeholder="Product name" className="w-full rounded-xl bg-warm-gray/40 px-4 py-3 text-sm" /></label>
                <label className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Product code</span><input name="productCode" value={formData.productCode} onChange={handleInputChange} placeholder="Optional" className="w-full rounded-xl bg-warm-gray/40 px-4 py-3 text-sm" /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Category</span><ThemedSelect ariaLabel="Category" value={formData.category} onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))} options={categories.map((category) => ({ value: category.slug, label: category.name }))} /></label>
                <label className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Subcategory</span><ThemedSelect ariaLabel="Subcategory" value={formData.subcategory} onChange={(value) => setFormData((prev) => ({ ...prev, subcategory: value }))} options={subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))} /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Price</span><input type="number" min="0" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" className="w-full rounded-xl bg-warm-gray/40 px-4 py-3 text-sm" /></label>
                <label className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Quantity</span><input type="number" min="0" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="Quantity" className="w-full rounded-xl bg-warm-gray/40 px-4 py-3 text-sm" /></label>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-rose-gold/15 bg-white p-4 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-gold">Descriptions</h3>
              <label className="block space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Short summary</span><textarea name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} placeholder="Short summary" rows={2} className="w-full rounded-xl bg-warm-gray/40 px-4 py-3 text-sm" /></label>
              <label className="block space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Full description</span><textarea name="fullDescription" value={formData.fullDescription} onChange={handleInputChange} placeholder="Full description" rows={4} className="w-full rounded-xl bg-warm-gray/40 px-4 py-3 text-sm" /></label>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <section className="space-y-3 rounded-2xl border border-rose-gold/15 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-gold">Images</h3><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-gold/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-taupe hover:bg-blush"><Upload size={14} /> Upload images<input type="file" multiple accept="image/*" disabled={!isCloudinaryConfigured || uploading} className="hidden" onChange={handleMultiImageUpload} /></label></div>
              {uploading && <p className="text-xs text-amber-700">Uploading {uploadProgress.completed} / {uploadProgress.total} images. Please wait before saving.</p>}
              <div className="grid grid-cols-[8rem_1fr] gap-3">
                <div className="h-32 overflow-hidden rounded-xl bg-warm-gray">{formData.thumbnailImage ? <img src={formData.thumbnailImage} alt="Thumbnail" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-widest text-taupe">Thumbnail preview</div>}</div>
                <div className="max-h-32 overflow-y-auto rounded-xl border border-warm-gray p-2">
                  {formData.galleryImages.length ? <div className="grid grid-cols-3 gap-2">{formData.galleryImages.map((img, idx) => <div key={img + idx} className="group relative overflow-hidden rounded-lg bg-warm-gray"><img src={img} alt="Gallery" className="aspect-square w-full object-cover" /><div className="absolute inset-x-1 bottom-1 flex gap-1"><button type="button" onClick={() => setAsThumbnail(img)} className="rounded bg-white/90 px-1 py-0.5 text-[8px]">Main</button><button type="button" onClick={() => removeGalleryImage(idx)} className="rounded bg-red-500 p-0.5 text-white"><X size={8} /></button></div></div>)}</div> : <div className="flex h-full min-h-24 items-center justify-center text-center text-xs text-taupe">Upload one or more images here.</div>}
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-rose-gold/15 bg-white p-4 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-gold">Display Flags</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">{['featured','trending','bridal','madeToOrder','onlyFewLeft','whatsappEnabled'].map((flag) => <label key={flag} className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-taupe"><span>{flag}</span><input type="checkbox" name={flag} checked={(formData as any)[flag]} onChange={handleInputChange} /></label>)}</div>
            </section>

            <section className="space-y-2 rounded-2xl border border-rose-gold/15 bg-white p-4 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-gold">Social</h3>
              <label className="block space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Instagram / social URL</span><div className="relative"><Instagram className="absolute left-3 top-2.5 text-taupe/50" size={15} /><input type="url" name="instagramUrl" value={formData.instagramUrl} onChange={handleInputChange} placeholder="Instagram/social URL" className="w-full rounded-xl bg-warm-gray/40 py-2.5 pl-9 pr-3 text-xs" /></div></label>
            </section>
          </div>
        </form>
      </div>

        {isSaving && (
          <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl border p-6 w-full max-w-md text-center space-y-3">
              <Loader2 className="animate-spin mx-auto text-rose-gold" size={28} />
              <h3 className="text-lg font-medium text-deep-taupe">Saving product</h3>
              <p className="text-sm text-taupe">{saveStage || 'Saving product…'}</p>
              <p className="text-xs text-taupe uppercase tracking-widest">Please do not close this page.</p>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
