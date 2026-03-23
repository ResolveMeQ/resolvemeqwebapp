import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * Accessible confirmation dialog (replaces window.confirm). Renders in a portal above the app.
 */
const ConfirmModal = ({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      return;
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  const handleConfirm = async () => {
    if (!onConfirm || loading) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      /* parent showed error; keep modal open */
    } finally {
      setLoading(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-desc">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 dark:bg-black/60"
        aria-label="Dismiss"
        onClick={() => !loading && onClose()}
      />
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl border shadow-2xl p-6',
          'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
        )}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p id="confirm-modal-desc" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
