import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Саян Дент | Sayan Dent',
  description: 'Мэргэжлийн шүдний эмнэлэг. Professional dental care for the whole family.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
