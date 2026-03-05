import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const dynamic = 'force-dynamic'; // Force le rendu dynamique (pas de prerender statique)

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="text-center space-y-4">
            <h1 className="font-display text-3xl font-semibold text-[#0F0D0A]">
              Vérification en cours
            </h1>
            <p className="text-[#8B7355]">Chargement de la page de vérification...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}