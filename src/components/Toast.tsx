'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container no-print" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`toast-pill cursor-pointer ${
            t.type === 'error' ? 'toast-error' : 'toast-success'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#E8C97A]" />}
          {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#FF8E8E]" />}
          {t.type === 'info' && <Info className="w-4 h-4 text-[#E8C97A]" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
