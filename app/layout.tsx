import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingProvider } from '@/hooks/useLoading';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'], weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans', display: 'swap',
});

export const metadata: Metadata = {
  title: { template: '%s — AÏMEVO', default: 'AÏMEVO — Psychologie mindful africaine' },
  description: 'Plateforme de bien-être mental ancrée dans la sagesse africaine. Ressources, tests psychologiques et accompagnement professionnel.',
  keywords: ['psychologie', 'bien-être', 'Afrique', 'Bénin', 'santé mentale', 'mindfulness'],
  authors: [{ name: 'AÏMEVO' }],
  openGraph: {
    type: 'website', locale: 'fr_FR', siteName: 'AÏMEVO',
    title: 'AÏMEVO — Psychologie mindful africaine',
    description: 'Plateforme de bien-être mental ancrée dans la sagesse africaine.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <AuthProvider>
          <TooltipProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}