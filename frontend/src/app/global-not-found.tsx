import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '404 | Саян Дент',
};

// Rendered for URLs that match no route at all. Both route trees
// ([locale]/ and admin/) define their own <html>, so this file must
// provide the full document itself.
export default function GlobalNotFound() {
  return (
    <html lang="mn">
      <body className="font-sans antialiased bg-base-50 text-primary-900">
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-6xl font-semibold">404</p>
          <h1 className="text-xl font-medium">Хуудас олдсонгүй / Page not found</h1>
          <a href="/" className="mt-2 underline underline-offset-4 hover:opacity-70">
            Нүүр хуудас руу буцах
          </a>
        </main>
      </body>
    </html>
  );
}
