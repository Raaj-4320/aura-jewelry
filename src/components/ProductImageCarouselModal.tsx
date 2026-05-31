import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { JEWELRY_IMAGE_FALLBACK } from '../constants';

interface Props { open: boolean; images: string[]; title: string; initialIndex?: number; onClose: () => void; }

export default function ProductImageCarouselModal({ open, images, title, initialIndex = 0, onClose }: Props) {
  const cleanImages = images.filter(Boolean);
  const gallery = cleanImages.length ? cleanImages : [JEWELRY_IMAGE_FALLBACK];
  const [active, setActive] = useState(initialIndex);

  useEffect(() => { if (open) setActive(Math.min(initialIndex, gallery.length - 1)); }, [open, initialIndex, gallery.length]);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); if (event.key === 'ArrowLeft') setActive((current) => current === 0 ? gallery.length - 1 : current - 1); if (event.key === 'ArrowRight') setActive((current) => current === gallery.length - 1 ? 0 : current + 1); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [gallery.length, onClose, open]);
  if (!open) return null;

  const previous = () => setActive((current) => current === 0 ? gallery.length - 1 : current - 1);
  const next = () => setActive((current) => current === gallery.length - 1 ? 0 : current + 1);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-taupe/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${title} image gallery`} onClick={onClose}>
    <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col gap-3 rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="text-sm font-semibold text-deep-taupe">{title}</h2><p className="text-xs text-taupe">Image {active + 1} of {gallery.length}</p></div><button onClick={onClose} aria-label="Close gallery" className="rounded-full p-2 text-taupe hover:bg-blush"><X size={20} /></button></div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-warm-gray"><img src={gallery[active]} alt={`${title} image ${active + 1}`} className="max-h-[70vh] w-full object-contain" onError={(event) => { event.currentTarget.src = JEWELRY_IMAGE_FALLBACK; }} />{gallery.length > 1 && <><button onClick={previous} aria-label="Previous image" className="absolute left-3 rounded-full bg-white/90 p-3 text-taupe shadow hover:bg-rose-gold hover:text-white"><ChevronLeft size={20} /></button><button onClick={next} aria-label="Next image" className="absolute right-3 rounded-full bg-white/90 p-3 text-taupe shadow hover:bg-rose-gold hover:text-white"><ChevronRight size={20} /></button></>}</div>
      {gallery.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{gallery.map((image, index) => <button key={`${image}-${index}`} onClick={() => setActive(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${active === index ? 'border-rose-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div>}
    </div>
  </div>;
}
