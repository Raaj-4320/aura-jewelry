import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { createEmptyHeroSlide, createEmptyHomepageSection, getHomepageContent, HeroSlide, HomepageContent, HomepageSection, saveHomepageContent } from '../../services/homepageService';
import { logCloudinary, logProduct, logRoute, logUI } from '../../utils/logger';

const input = 'w-full rounded-xl border border-rose-gold/20 bg-warm-gray/20 px-3 py-2 text-sm outline-none focus:border-rose-gold';
const label = 'space-y-1 text-[10px] font-semibold uppercase tracking-widest text-taupe';

export default function Storefront() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState('');
  const { categories } = useCatalogCategories();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    logRoute('route_rendered', { page: 'AdminStorefront', path: window.location.pathname });
    getHomepageContent().then(setContent).catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load storefront settings.'));
  }, []);

  const update = <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => setContent((current) => current ? { ...current, [key]: value } : current);
  const updateSlide = (id: string, patch: Partial<HeroSlide>) => setContent((current) => current ? { ...current, heroSlides: current.heroSlides.map((slide) => slide.id === id ? { ...slide, ...patch } : slide) } : current);
  const updateSection = (id: string, patch: Partial<HomepageSection>) => setContent((current) => current ? { ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...patch } : section) } : current);
  const moveSection = (index: number, direction: -1 | 1) => setContent((current) => {
    if (!current) return current;
    const target = index + direction;
    if (target < 0 || target >= current.sections.length) return current;
    const sections = [...current.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    return { ...current, sections };
  });

  const uploadHeroImage = async (slideId: string, file?: File) => {
    if (!file) return;
    if (!cloudName || !uploadPreset) return toast.error('Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET before uploading.');
    setUploadingSlideId(slideId);
    logCloudinary('storefront_hero_upload_start', { slideId, fileType: file.type, size: file.size });
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', uploadPreset);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data?.secure_url) throw new Error(data?.error?.message || 'Upload failed.');
      updateSlide(slideId, { imageUrl: String(data.secure_url) });
      logCloudinary('storefront_hero_upload_success', { slideId });
      toast.success('Hero image uploaded. Save storefront to publish it.');
    } catch (error) {
      logCloudinary('storefront_hero_upload_failure', { slideId, message: error instanceof Error ? error.message : 'unknown' });
      toast.error(error instanceof Error ? error.message : 'Hero image upload failed.');
    } finally {
      setUploadingSlideId('');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content || saving || uploadingSlideId) return;
    setSaving(true);
    logUI('storefront_save_clicked', { slides: content.heroSlides.length, sections: content.sections.length });
    try {
      const saved = await saveHomepageContent(content);
      setContent(saved);
      logProduct('storefront_save_success', { slides: saved.heroSlides.length, sections: saved.sections.length });
      toast.success('Storefront homepage published successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save storefront homepage.');
    } finally {
      setSaving(false);
    }
  };

  if (!content) return <AdminLayout><div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-rose-gold" /></div></AdminLayout>;

  return <AdminLayout><form onSubmit={save} className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-light uppercase tracking-widest text-deep-taupe">Storefront Editor</h1><p className="text-xs text-taupe">Publish hero slides and choose which homepage collections appear, in order.</p></div><button disabled={saving || !!uploadingSlideId} className="btn-primary flex items-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Publish storefront</button></div>

    <section className="space-y-4 rounded-2xl border border-rose-gold/15 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold uppercase tracking-widest text-deep-taupe">Hero carousel</h2><p className="text-xs text-taupe">One image shows as a banner. Multiple images automatically become a carousel.</p></div><label className="flex items-center gap-2 text-xs text-taupe"><input type="checkbox" checked={content.heroEnabled} onChange={(event) => update('heroEnabled', event.target.checked)} /> Show hero</label></div>
      <label className={`${label} block max-w-xs`}>Carousel autoplay seconds<input type="number" min="0" max="30" value={content.heroAutoplaySeconds} onChange={(event) => update('heroAutoplaySeconds', Number(event.target.value))} className={input} /><span className="block normal-case tracking-normal text-[11px] font-normal">Use 0 to disable automatic rotation.</span></label>
      <div className="space-y-3">{content.heroSlides.map((slide, index) => <div key={slide.id} className="grid gap-3 rounded-xl border border-warm-gray p-3 lg:grid-cols-[11rem_1fr_auto]">
        <div className="space-y-2"><div className="aspect-[4/3] overflow-hidden rounded-xl bg-warm-gray">{slide.imageUrl ? <img src={slide.imageUrl} alt="Hero preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-3 text-center text-[10px] uppercase tracking-widest text-taupe">No hero image</div>}</div><label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-rose-gold/30 px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-taupe"><ImagePlus size={13} /> {uploadingSlideId === slide.id ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/*" className="hidden" disabled={!!uploadingSlideId} onChange={(event) => uploadHeroImage(slide.id, event.target.files?.[0])} /></label></div>
        <div className="grid gap-2 sm:grid-cols-2"><label className={label}>Eyebrow<input value={slide.eyebrow} onChange={(event) => updateSlide(slide.id, { eyebrow: event.target.value })} className={input} /></label><label className={label}>Title<input value={slide.title} onChange={(event) => updateSlide(slide.id, { title: event.target.value })} className={input} /></label><label className={label}>Accent text<input value={slide.accentText} onChange={(event) => updateSlide(slide.id, { accentText: event.target.value })} className={input} /></label><label className={label}>Trailing text<input value={slide.trailingText} onChange={(event) => updateSlide(slide.id, { trailingText: event.target.value })} className={input} /></label><label className={label}>Primary button<input value={slide.primaryLabel} onChange={(event) => updateSlide(slide.id, { primaryLabel: event.target.value })} className={input} /></label><label className={label}>Primary link<input value={slide.primaryLink} onChange={(event) => updateSlide(slide.id, { primaryLink: event.target.value })} className={input} /></label><label className={label}>Secondary button<input value={slide.secondaryLabel} onChange={(event) => updateSlide(slide.id, { secondaryLabel: event.target.value })} className={input} /></label><label className={label}>Secondary link<input value={slide.secondaryLink} onChange={(event) => updateSlide(slide.id, { secondaryLink: event.target.value })} className={input} /></label></div>
        <button type="button" aria-label={`Remove hero slide ${index + 1}`} onClick={() => update('heroSlides', content.heroSlides.filter((item) => item.id !== slide.id))} className="self-start p-2 text-taupe hover:text-red-500"><Trash2 size={17} /></button>
      </div>)}</div>
      <button type="button" onClick={() => update('heroSlides', [...content.heroSlides, createEmptyHeroSlide()])} className="flex items-center gap-2 rounded-xl border border-rose-gold/30 px-3 py-2 text-xs font-semibold text-taupe hover:bg-blush"><Plus size={14} /> Add hero slide</button>
    </section>

    <section className="space-y-4 rounded-2xl border border-rose-gold/15 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold uppercase tracking-widest text-deep-taupe">Homepage collections</h2><p className="text-xs text-taupe">Choose what appears below the hero and move sections into the desired order.</p></div><button type="button" onClick={() => update('sections', [...content.sections, createEmptyHomepageSection()])} className="flex items-center gap-2 rounded-xl border border-rose-gold/30 px-3 py-2 text-xs font-semibold text-taupe hover:bg-blush"><Plus size={14} /> Add collection section</button></div>
      <div className="space-y-3">{content.sections.map((section, index) => <div key={section.id} className="grid gap-2 rounded-xl border border-warm-gray p-3 md:grid-cols-[auto_1fr_1fr_10rem_7rem_auto] md:items-end">
        <div className="flex gap-1"><button type="button" aria-label="Move section up" onClick={() => moveSection(index, -1)} className="p-1 text-taupe disabled:opacity-30" disabled={index === 0}><ArrowUp size={15} /></button><button type="button" aria-label="Move section down" onClick={() => moveSection(index, 1)} className="p-1 text-taupe disabled:opacity-30" disabled={index === content.sections.length - 1}><ArrowDown size={15} /></button></div>
        <label className={label}>Section title<input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} className={input} /></label><label className={label}>Subtitle<input value={section.subtitle} onChange={(event) => updateSection(section.id, { subtitle: event.target.value })} className={input} /></label><label className={label}>Collection<select value={section.collection} onChange={(event) => updateSection(section.id, { collection: event.target.value as HomepageSection['collection'] })} className={input}><option value="featured">Featured products</option><option value="new-arrivals">New arrivals</option><option value="bridal">Bridal products</option><option value="minimal">Minimal products</option><option value="category">Specific category</option></select></label><label className={label}>Products<input type="number" min="1" max="12" value={section.productLimit} onChange={(event) => updateSection(section.id, { productLimit: Number(event.target.value) })} className={input} /></label><div className="flex items-center gap-2 pb-2"><label className="flex items-center gap-1 text-xs text-taupe"><input type="checkbox" checked={section.visible} onChange={(event) => updateSection(section.id, { visible: event.target.checked })} /> Show</label><button type="button" aria-label={`Remove ${section.title}`} onClick={() => update('sections', content.sections.filter((item) => item.id !== section.id))} className="p-1 text-taupe hover:text-red-500"><Trash2 size={16} /></button></div>
        {section.collection === 'category' && <label className={`${label} md:col-start-4 md:col-span-2`}>Category<select value={section.categorySlug} onChange={(event) => updateSection(section.id, { categorySlug: event.target.value, shopLink: `/shop?category=${event.target.value}` })} className={input}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>}<label className={`${label} md:col-span-2`}>View all link<input value={section.shopLink} onChange={(event) => updateSection(section.id, { shopLink: event.target.value })} className={input} /></label>
      </div>)}</div>
    </section>

    <section className="grid gap-3 rounded-2xl border border-rose-gold/15 bg-white p-5 shadow-sm sm:grid-cols-2"><label className="flex items-center gap-2 text-sm text-taupe"><input type="checkbox" checked={content.categoriesEnabled} onChange={(event) => update('categoriesEnabled', event.target.checked)} /> Show category cards</label><label className={label}>Category section title<input value={content.categoriesTitle} onChange={(event) => update('categoriesTitle', event.target.value)} className={input} /></label><label className={label}>Category cards<input type="number" min="1" max="12" value={content.categoryLimit} onChange={(event) => update('categoryLimit', Number(event.target.value))} className={input} /></label><label className="flex items-center gap-2 text-sm text-taupe"><input type="checkbox" checked={content.quoteEnabled} onChange={(event) => update('quoteEnabled', event.target.checked)} /> Show quote</label><label className={label}>Quote text<input value={content.quoteText} onChange={(event) => update('quoteText', event.target.value)} className={input} /></label><label className="flex items-center gap-2 text-sm text-taupe"><input type="checkbox" checked={content.instagramEnabled} onChange={(event) => update('instagramEnabled', event.target.checked)} /> Show Instagram block when URL exists</label></section>
  </form></AdminLayout>;
}
