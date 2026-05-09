import { Construction } from 'lucide-react';

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-12 text-center dark:bg-stone-900 dark:border-stone-800">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-500 mb-4 dark:bg-stone-800 dark:text-stone-400">
        <Construction size={20} />
      </div>
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-1">{title}</h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
        {description ?? 'Энэ хэсэг боловсруулагдаж байна. Удахгүй ашиглахад бэлэн болно.'}
      </p>
    </div>
  );
}
