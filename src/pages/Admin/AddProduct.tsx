import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Save, 
  Plus, 
  Image as ImageIcon,
  Loader2,
  Instagram
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CATEGORIES, SUB_CATEGORIES } from '../../constants';
import { generateSlug, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AddProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0].name,
    subcategory: SUB_CATEGORIES[0].name,
    price: 0,
    priceOnRequest: false,
    shortDescription: '',
    fullDescription: '',
    material: '',
    careInstructions: '',
    featured: false,
    trending: false,
    bridal: false,
    madeToOrder: false,
    onlyFewLeft: false,
    whatsappEnabled: true,
    instagramUrl: '',
    thumbnailImage: '',
    galleryImages: [] as string[],
    active: true,
    sortOrder: 0,
    styleTags: [] as string[],
    occasionTags: [] as string[],
  });

  useEffect(() => {
    if (isEdit) {
      const fetchProduct = async () => {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Cloudinary Upload Logic
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        // Fallback for demo if env not set
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (isThumbnail) {
            setFormData(prev => ({ ...prev, thumbnailImage: base64 }));
          } else {
            setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, base64] }));
          }
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();

      if (isThumbnail) {
        setFormData(prev => ({ ...prev, thumbnailImage: data.secure_url }));
      } else {
        setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, data.secure_url] }));
      }
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.thumbnailImage) {
      toast.error('Thumbnail image is required');
      return;
    }

    setLoading(true);
    try {
      const slug = generateSlug(formData.name);
      const productData = {
        ...formData,
        slug,
        updatedAt: serverTimestamp(),
      };

      if (isEdit) {
        await updateDoc(doc(db, 'products', id), productData);
        toast.success('Product updated');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast.success('Product added');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-all text-taupe">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">
              {isEdit ? 'Edit Piece' : 'Add New Piece'}
            </h1>
            <p className="text-xs text-taupe tracking-widest uppercase">Fill in the details for your luxury jewelry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold border-b border-warm-gray pb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rose Gold Luminescence Ring"
                    className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none appearance-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Subcategory</label>
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none appearance-none"
                    >
                      {SUB_CATEGORIES.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Price (INR)</label>
                    <input
                      type="number"
                      name="price"
                      disabled={formData.priceOnRequest}
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      name="priceOnRequest"
                      id="priceOnRequest"
                      checked={formData.priceOnRequest}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-rose-gold/30 text-rose-gold focus:ring-rose-gold"
                    />
                    <label htmlFor="priceOnRequest" className="text-xs font-medium text-taupe uppercase tracking-widest">Price on Request</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold border-b border-warm-gray pb-4">Descriptions & Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Short Summary</label>
                  <textarea
                    name="shortDescription"
                    rows={2}
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="A brief elegant summary for the product card..."
                    className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Full Description</label>
                  <textarea
                    name="fullDescription"
                    rows={6}
                    value={formData.fullDescription}
                    onChange={handleInputChange}
                    placeholder="Detailed story and specifications of the piece..."
                    className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Material</label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      placeholder="e.g. 18K Rose Gold, VVS Diamonds"
                      className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Care Instructions</label>
                    <input
                      type="text"
                      name="careInstructions"
                      value={formData.careInstructions}
                      onChange={handleInputChange}
                      placeholder="e.g. Keep away from moisture..."
                      className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold border-b border-warm-gray pb-4">Gallery Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.galleryImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-warm-gray group">
                    <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-rose-gold/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-rose-gold-light/20 transition-all">
                  <Plus size={24} className="text-rose-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-taupe">Add Image</span>
                  <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, false)} accept="image/*" />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Thumbnail */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold border-b border-warm-gray pb-4">Main Thumbnail</h3>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-warm-gray border-2 border-dashed border-rose-gold/10">
                {formData.thumbnailImage ? (
                  <>
                    <img src={formData.thumbnailImage} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, thumbnailImage: '' }))}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-full shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-rose-gold-light/10 transition-all">
                    <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center text-rose-gold">
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-deep-taupe">Upload Thumbnail</p>
                      <p className="text-[10px] text-taupe mt-1">JPG, PNG up to 5MB</p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, true)} accept="image/*" />
                  </label>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="text-rose-gold animate-spin" size={32} />
                  </div>
                )}
              </div>
            </div>

            {/* Flags */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold border-b border-warm-gray pb-4">Display Flags</h3>
              <div className="space-y-4">
                {[
                  { id: 'active', label: 'Active Listing' },
                  { id: 'featured', label: 'Featured Piece' },
                  { id: 'trending', label: 'Trending Now' },
                  { id: 'bridal', label: 'Bridal Collection' },
                  { id: 'madeToOrder', label: 'Made to Order' },
                  { id: 'onlyFewLeft', label: 'Only Few Left' },
                ].map(flag => (
                  <div key={flag.id} className="flex items-center justify-between">
                    <label htmlFor={flag.id} className="text-xs font-medium text-taupe uppercase tracking-widest">{flag.label}</label>
                    <input
                      type="checkbox"
                      id={flag.id}
                      name={flag.id}
                      checked={(formData as any)[flag.id]}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-rose-gold/30 text-rose-gold focus:ring-rose-gold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-gold border-b border-warm-gray pb-4">Social Links</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Instagram Post URL</label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={16} />
                    <input
                      type="url"
                      name="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/p/..."
                      className="w-full pl-10 pr-4 py-3 bg-warm-gray/30 border border-transparent rounded-xl text-xs focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full btn-primary py-5 flex items-center justify-center gap-3 shadow-xl shadow-rose-gold/30 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isEdit ? 'Update Piece' : 'Save Piece'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
