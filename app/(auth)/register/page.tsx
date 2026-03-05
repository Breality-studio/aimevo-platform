'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Alert } from '@/components/ui';
import { AuthService } from '@/services/auth.service';
import { Mail } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function SignupPage() {
  const { isLoggedIn, role, register, refreshUser } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // État pour savoir si l'inscription a réussi
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Redirection si déjà connecté
  if (isLoggedIn) {
    const redirectPath =
      role === 'admin' ? '/admin/dashboard' :
        role === 'professional' ? '/pro/dashboard' :
          '/dashboard';
    router.replace(redirectPath);
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await refreshUser();

      // Succès → on masque le formulaire et on affiche le message de vérification
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Une erreur est survenue lors de l’inscription.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
      <div className="w-full max-w-md">
        {!registrationSuccess ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-semibold text-[#0F0D0A]">Inscription</h1>
              <p className="text-[#8B7355] text-sm mt-1">
                Créez votre compte membre pour accéder aux ressources et à l’accompagnement.
              </p>
            </div>

            {error && <Alert variant="error" className="mb-5">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
                <Input
                  label="Nom"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>

              <Input
                label="Adresse email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="space-y-4">
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full mt-2 bg-[#C4922A] hover:bg-[#A07520]"
              >
                Créer mon compte membre
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D4C9B8]" />
              </div>
              <div className="relative flex justify-center text-xs text-[#8B7355]">
                <span className="bg-[#FAFAF8] px-3">ou continuer avec</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    disabled
                    onClick={() =>
                      AuthService.loginWithGoogle(
                        `${window.location.origin}/auth/callback`,
                        `${window.location.origin}/signup?error=oauth`
                      )
                    }
                    className="flex-1 h-10 rounded-lg border border-[#D4C9B8] bg-white text-sm font-medium flex items-center justify-center gap-2 hover:border-[#8B7355] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Cette fonctionnalité est en maintenance.  
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="text-center text-xs text-[#8B7355] mt-6">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-[#C4922A] font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </>
        ) : (
          // Message de succès après inscription
          <div className="text-center p-8 bg-[#FFF8E1]/70 border-2 border-[#C4922A]/40 rounded-2xl shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#C4922A]/10 flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-[#C4922A]" />
            </div>

            <h2 className="font-display text-2xl font-semibold text-[#0F0D0A] mb-4">
              Vérifiez votre email
            </h2>

            <p className="text-[#8B7355] leading-relaxed mb-6">
              Un lien de vérification vous a été envoyé à l’adresse <strong>{email}</strong>.<br />
              Consultez votre boîte de réception (et éventuellement vos spams) pour activer votre compte.
            </p>

            <p className="text-sm text-[#8B7355] mb-6">
              Une fois votre email vérifié, vous pourrez accéder à toutes les fonctionnalités.
            </p>

            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full border-[#C4922A] text-[#C4922A] hover:bg-[#C4922A]/10"
                onClick={() => router.push('/')}
              >
                Retour à l’accueil
              </Button>

              <Button
                className="w-full bg-[#C4922A] hover:bg-[#A07520]"
                onClick={() => router.push('/login')}
              >
                Me connecter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}