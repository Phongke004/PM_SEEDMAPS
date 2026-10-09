import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  if (!actions) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-6">
      <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-brand-500" size={32} />
      {label && <p className="mt-3 text-sm text-gray-500">{label}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
      {message}
    </div>
  );
}
