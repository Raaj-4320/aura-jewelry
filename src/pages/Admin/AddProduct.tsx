import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Instagram, Loader2, Save, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { db } from '../../firebase';
import { CATEGORIES, SUB_CATEGORIES } from '../../constants';
import { generateSlug, normalizeCategory, normalizeSubcategory } from '../../lib/utils';
import { createProduct, getProductById, updateProduct } from '../../services/firebaseService';
import { logCloudinary, logDB, logProduct, logRoute, logUI } from '../../utils/logger';

export default function AddProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [existingSlug, setExistingSlug] = useState('');
  const [existingProductRaw, setExistingProductRaw] = useState<Record<string, any> | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0].slug,
    subcategory: SUB_CATEGORIES[0].id,
    price: 0,
    active: true,
    status: 'active',
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
        category: normalizeCategory(data.category || CATEGORIES[0].slug),
        subcategory: normalizeSubcategory(data.subcategory || SUB_CATEGORIES[0].id),
        status: data.status || (data.active ? 'active' : 'inactive'),
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
    const name = formData.name.trim();
    const galleryImages = (formData.galleryImages || []).filter(Boolean);
    const thumbnailImage = formData.thumbnailImage || galleryImages[0] || '';

    const missingFields: string[] = [];
    if (!name) missingFields.push('name');
    if (!galleryImages.length) missingFields.push('galleryImages');
    if (!thumbnailImage) missingFields.push('thumbnailImage');
    if (missingFields.length) {
      logProduct('product_validation_failed', { missingFields });
      toast.error('Name, thumbnail, and at least one gallery image are required.');
      return;
    }

    setLoading(true);
    try {
      const slug = isEdit ? (existingSlug || await getUniqueSlug(name)) : await getUniqueSlug(name);
      if (!slug) throw new Error('Please enter a valid product name.');

      const status = formData.active ? 'active' : 'inactive';
      const images = galleryImages.map((src, idx) => ({ src, position: idx + 1, alt: name, source: 'admin' }));
      const canonical = {
        ...formData,
        name,
        title: name,
        slug,
        handle: existingProductRaw?.handle || slug,
        category: normalizeCategory(formData.category),
        subcategory: normalizeSubcategory(formData.subcategory),
        price: Number(formData.price || 0),
        active: !!formData.active,
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

      if (isEdit) await updateProduct(id!, productData as any);
      else await createProduct(productData as any);

      toast.success(isEdit ? 'Product updated' : 'Product added');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-all text-taupe"><ArrowLeft size={20} /></button>
          <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">{isEdit ? 'Edit Piece' : 'Add New Piece'}</h1>
        </div>

        {!isCloudinaryConfigured && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl text-sm">Cloudinary is not configured. Set <code>VITE_CLOUDINARY_CLOUD_NAME</code> and <code>VITE_CLOUDINARY_UPLOAD_PRESET</code>.</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold">Basic Details</h3>
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Product name" className="w-full px-6 py-4 bg-warm-gray/30 rounded-2xl text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-6 py-4 bg-warm-gray/30 rounded-2xl text-sm">{CATEGORIES.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
                <select name="subcategory" value={formData.subcategory} onChange={handleInputChange} className="w-full px-6 py-4 bg-warm-gray/30 rounded-2xl text-sm">{SUB_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" className="w-full px-6 py-4 bg-warm-gray/30 rounded-2xl text-sm" />
                <label className="flex items-center gap-3 text-xs uppercase tracking-widest"><input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} /> Active</label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold">Descriptions</h3>
              <textarea name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} placeholder="Short summary" rows={2} className="w-full px-6 py-4 bg-warm-gray/30 rounded-2xl text-sm" />
              <textarea name="fullDescription" value={formData.fullDescription} onChange={handleInputChange} placeholder="Full description" rows={6} className="w-full px-6 py-4 bg-warm-gray/30 rounded-2xl text-sm" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold">Images</h3>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-xs uppercase tracking-widest">
                <Upload size={16} /> Select Multiple Images
                <input type="file" multiple accept="image/*" disabled={!isCloudinaryConfigured || uploading} className="hidden" onChange={handleMultiImageUpload} />
              </label>
              {uploading && <div className="text-xs text-taupe">Uploading {uploadProgress.completed} / {uploadProgress.total} images...</div>}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.galleryImages.map((img, idx) => (
                  <div key={img + idx} className="relative rounded-2xl overflow-hidden bg-warm-gray group">
                    <img src={img} alt="Gallery" className="w-full aspect-square object-cover" />
                    <div className="absolute inset-x-1 bottom-1 flex gap-1">
                      <button type="button" onClick={() => setAsThumbnail(img)} className="text-[10px] bg-white/90 px-2 py-1 rounded">Set thumbnail</button>
                      <button type="button" onClick={() => removeGalleryImage(idx)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded"><X size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold">Main Thumbnail</h3>
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-warm-gray">{formData.thumbnailImage ? <img src={formData.thumbnailImage} alt="Thumbnail" className="w-full h-full object-cover" /> : null}</div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold">Display Flags</h3>
              {['featured','trending','bridal','madeToOrder','onlyFewLeft','whatsappEnabled'].map((flag) => (
                <label key={flag} className="flex items-center justify-between text-xs uppercase tracking-widest"><span>{flag}</span><input type="checkbox" name={flag} checked={(formData as any)[flag]} onChange={handleInputChange} /></label>
              ))}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold">Social</h3>
              <div className="relative"><Instagram className="absolute left-3 top-3 text-taupe/40" size={16} /><input type="url" name="instagramUrl" value={formData.instagramUrl} onChange={handleInputChange} placeholder="Instagram/social URL" className="w-full pl-9 pr-4 py-3 bg-warm-gray/30 rounded-xl text-xs" /></div>
            </div>

            <button type="submit" disabled={loading || uploading} className="w-full btn-primary py-5 flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {isEdit ? 'Update Piece' : 'Save Piece'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
