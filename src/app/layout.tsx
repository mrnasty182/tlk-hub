import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TLK Hub — The Loin Kings',
  description: 'The ultimate hub for The Loin Kings crew',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥩</text></svg>" />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}