'use client';

import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: 'rgba(4,3,10,.66)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="w-full animate-rise rounded-[18px] border border-white/10 p-[26px]"
        style={{ maxWidth, background: 'linear-gradient(180deg,rgba(24,20,38,.96),rgba(14,11,24,.98))', boxShadow: '0 30px 90px rgba(76,29,149,.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="m-0 mb-[18px] text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
        {children}
      </div>
    </div>
  );
}
