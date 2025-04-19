import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Horizon App',
  description: 'A fullstack app using Next.js and TypeScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
