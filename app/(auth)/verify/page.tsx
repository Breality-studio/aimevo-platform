'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { useLoading } from '@/hooks/useLoading';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isLoading, setLoading } = useLoading();

    useEffect(() => {
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        if (!userId || !secret) {
            router.push('/signup?error=invalid-verification');
            return;
        }

        const verify = async () => {
            try {
                await AuthService.verifyEmail(userId, secret);
                alert('Votre email a été vérifié avec succès !');
                router.push('/');
            } catch (err: any) {
                alert('Échec de la vérification : ' + (err.message || 'Lien invalide ou expiré'));
                router.push('/register');
            }
        };

        verify();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
            <div className="text-center">
                <h1 className="font-display text-2xl font-semibold text-[#0F0D0A] mb-4">
                    Vérification de votre email
                </h1>
                <p className="text-[#8B7355]">Veuillez patienter...</p>
            </div>
        </div>
    );
}