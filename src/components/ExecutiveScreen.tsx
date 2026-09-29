'use client';

import React, { useEffect, useState } from 'react';
import { ExecResource } from '@/lib/types';
import { Crown, FileText, Table2, Link2, ExternalLink, X } from 'lucide-react';

interface ExecutiveScreenProps {
  resources: ExecResource[];
}

// Rewrites a normal Google Docs/Sheets share link into its embeddable /preview form.
// Anything already embeddable (or not a recognized Google Docs/Sheets URL) passes through
// unchanged, so an admin can also paste an already-published embed URL directly.
function toEmbedUrl(url: string): string {
  const docMatch = url.match(/docs\.google\.com\/document\/d\/([^/]+)/);
  if (docMatch) return `https://docs.google.com/document/d/${docMatch[1]}/preview`;

  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch) return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`;

  return url;
}

const KIND_META: Record<ExecResource['kind'], { label: string; Icon: typeof FileText; accent: string }> = {
  doc: { label: 'Google Doc', Icon: FileText, accent: 'text-blue-700 bg-blue-50 border-blue-200' },
  sheet: { label: 'Google Sheet', Icon: Table2, accent: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  other: { label: 'Link', Icon: Link2, accent: 'text-[var(--muted)] bg-[var(--bg2)] border-[var(--border)]' },
};

export const ExecutiveScreen: React.FC<ExecutiveScreenProps> = ({ resources }) => {
  const [selected, setSelected] = useState<ExecResource | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <section className="hero-panel p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-[var(--gold-light)]" />
          <span className="text-xs text-[var(--gold-light)] font-medium uppercase tracking-wider">Youth Executives</span>
        </div>
        <h2 className="font-serif text-3xl font-bold leading-[1.1] text-balance text-white">Executive Resources</h2>
        <p className="text-sm text-[#D9CDB2] mt-2">
          Shared Google Docs and Sheets for ministry leadership. Tap any resource to open it right here.
        </p>
      </section>

      {resources.length === 0 ? (
        <div className="regal-card p-10 text-center">
          <p className="text-sm text-[var(--muted)]">
            No resources yet. Ask an admin to add a Google Doc or Sheet from the Youth Executives tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {resources.map(r => {
            const meta = KIND_META[r.kind] || KIND_META.other;
            const Icon = meta.Icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r)}
                className="regal-card p-4 flex items-start gap-3.5 text-left group hover:border-[var(--gold)] hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border ${meta.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[var(--deep)] truncate group-hover:text-[#8A6800] transition-colors">
                    {r.title}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">{meta.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Embedded viewer */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-0 sm:p-6 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white w-full h-full sm:rounded-2xl sm:h-[90vh] sm:max-w-6xl sm:w-[90vw] overflow-hidden flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-light)] bg-[#FAF5EB]">
              <h3 className="font-semibold text-sm text-[var(--deep)] truncate">{selected.title}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--deep)] px-2.5 py-1.5 rounded-lg hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Google</span>
                </a>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--deep)] hover:bg-white transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
            <iframe
              src={toEmbedUrl(selected.url)}
              title={selected.title}
              className="flex-1 w-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};
