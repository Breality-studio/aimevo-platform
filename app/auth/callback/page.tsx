'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui';

export default function OAuthCallbackPage() {
  const router      = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await AuthService.finalizeOAuthLogin();
        await refreshUser();
        router.replace('/pro/dashboard');
      } catch (err: any) {
        setError(err?.message ?? 'Erreur OAuth');
        setTimeout(() => router.replace('/login?error=oauth'), 3000);
      }
    })();
  }, []);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <p className="text-sm text-[#8B7355]">Redirection vers la connexion…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-[#8B7355]">Finalisation de la connexion…</p>
      </div>
    </div>
  );
}
