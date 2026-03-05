'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { useLoading } from '@/hooks/useLoading';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setLoading } = useLoading();

  useEffect(() => {
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
      router.replace('/signup?error=invalid-verification');
      return;
    }

    const verify = async () => {
      setLoading(true, 'Vérification de votre adresse email en cours...');

      try {
        await AuthService.verifyEmail(userId, secret);
        setLoading(false);
        alert('Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.');
        router.replace('/login');
      } catch (err: any) {
        setLoading(false);
        alert('Échec de la vérification : ' + (err.message || 'Lien invalide ou expiré'));
        router.replace('/signup');
      }
    };

    verify();
  }, [searchParams, router, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="text-center space-y-4 max-w-md px-6">
        <h1 className="font-display text-3xl font-semibold text-[#0F0D0A]">
          Vérification de votre email
        </h1>
        <p className="text-[#8B7355] text-lg">
          Nous vérifions votre adresse email. Veuillez patienter un instant...
        </p>
      </div>
    </div>
  );
}