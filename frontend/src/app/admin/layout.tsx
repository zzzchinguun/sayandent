import type { Metadata } from 'next';
import Script from 'next/script';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Admin | Sayan Dent',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <Script
          id="admin-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('sayandent.theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(!s&&d))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="bg-stone-50 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
