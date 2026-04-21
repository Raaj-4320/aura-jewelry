import React from 'react';

interface InfoPageProps {
  title: string;
  description: string;
}

export default function InfoPage({ title, description }: InfoPageProps) {
  return (
    <div className="min-h-[70vh] bg-ivory px-6 py-20">
      <div className="max-w-4xl mx-auto bg-white border border-rose-gold/10 rounded-[2rem] p-10 space-y-4">
        <h1 className="text-3xl font-light text-deep-taupe uppercase tracking-[0.2em]">{title}</h1>
        <p className="text-sm text-taupe leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
