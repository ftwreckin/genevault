import '@/app/globals.css';
import { ReactNode } from 'react';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'GeneVault',
  description: 'A comprehensive cannabis genetics knowledge base and inventory platform.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
        <NavBar />
        <main className="flex-1 container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}