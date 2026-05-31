import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ThemedSelectOption {
  value: string;
  label: string;
}

interface ThemedSelectProps {
  value: string;
  options: ThemedSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ThemedSelect({ value, options, onChange, ariaLabel, className, menuClassName, placeholder = 'Select an option', disabled = false }: ThemedSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return <div ref={ref} className={cn('relative', className)}>
    <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-rose-gold/20 bg-white px-3 py-2 text-left text-xs text-deep-taupe shadow-sm outline-none transition hover:border-rose-gold/50 focus:ring-2 focus:ring-rose-gold/20 disabled:opacity-50">
      <span className="truncate">{selected?.label || placeholder}</span><ChevronDown size={14} className={cn('shrink-0 text-taupe transition-transform', open && 'rotate-180')} />
    </button>
    {open && <div role="listbox" aria-label={ariaLabel} className={cn('absolute z-[80] mt-1 max-h-64 min-w-full overflow-y-auto rounded-xl border border-rose-gold/20 bg-white p-1 shadow-xl shadow-deep-taupe/10', menuClassName)}>
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); }} className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-taupe transition hover:bg-blush hover:text-deep-taupe', option.value === value && 'bg-rose-gold-light/50 font-semibold text-deep-taupe')}><span>{option.label}</span>{option.value === value && <Check size={13} className="text-rose-gold" />}</button>)}
    </div>}
  </div>;
}
