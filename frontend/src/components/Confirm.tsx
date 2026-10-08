import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: (value: boolean) => void;
  }>({
    isOpen: false,
    options: null,
    resolve: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    modalState.resolve(value);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalState.isOpen && modalState.options && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => handleClose(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-up overflow-hidden">
            <div className="flex gap-4 items-start">
              <div className={`p-3 rounded-full flex-shrink-0 ${modalState.options.danger !== false ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-500'}`}>
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                  {modalState.options.title || 'Xác nhận'}
                </h3>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  {modalState.options.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {modalState.options.cancelText || 'Hủy'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${
                  modalState.options.danger !== false
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-500 hover:bg-brand-600'
                }`}
              >
                {modalState.options.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
