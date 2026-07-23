import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Conferma Operazione',
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/20 text-red-400 border border-red-500/30',
          confirmBtn: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20',
          Icon: AlertTriangle,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
          Icon: AlertTriangle,
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
          confirmBtn: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20',
          Icon: HelpCircle,
        };
    }
  };

  const { iconBg, confirmBtn, Icon } = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg cursor-pointer ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
