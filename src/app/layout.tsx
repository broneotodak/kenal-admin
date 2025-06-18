import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kenal Admin',
  description: 'Admin dashboard for Kenal',
  icons: {
    icon: 'https://etkuxatycjqwvfjjwxqm.supabase.co/storage/v1/object/public/images/kenal-logo-icon.png',
    shortcut: 'https://etkuxatycjqwvfjjwxqm.supabase.co/storage/v1/object/public/images/kenal-logo-icon.png',
    apple: 'https://etkuxatycjqwvfjjwxqm.supabase.co/storage/v1/object/public/images/kenal-logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}