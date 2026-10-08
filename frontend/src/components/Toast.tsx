import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_STYLES: Record<ToastType, { icon: typeof CheckCircle2; iconColor: string }> = {
  success: { icon: CheckCircle2, iconColor: 'text-emerald-400' },
  error: { icon: XCircle, iconColor: 'text-rose-400' },
  warning: { icon: AlertCircle, iconColor: 'text-amber-400' },
  info: { icon: Info, iconColor: 'text-blue-400' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-[360px] w-full pointer-events-none">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className="group flex items-start gap-3 px-4 py-3.5 bg-gray-900 border border-gray-800/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl animate-slide-up pointer-events-auto transition-all hover:border-gray-700"
            >
              <Icon size={18} className={`flex-shrink-0 mt-0.5 ${style.iconColor}`} />
              <p className="text-[14px] font-medium text-gray-50 flex-1 leading-relaxed tracking-wide">
                {toast.message}
              </p>
              <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
