import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Sayan Dent',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
