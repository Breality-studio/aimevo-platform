'use client';

import { Loader2 } from 'lucide-react';

interface GlobalLoaderProps {
  /**
   * Message optionnel à afficher sous le spinner
   * @default "Chargement en cours..."
   */
  message?: string;
  /**
   * Taille du spinner (small, medium, large)
   * @default "medium"
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Loader global de l'application, affiché lors des chargements de pages ou d'opérations longues.
 * Intègre le nom et le slogan de AÏMEVO.
 */
export function GlobalLoader({ message = 'Chargement en cours...', size = 'medium' }: GlobalLoaderProps) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFAF8]/90 backdrop-blur-sm">
      {/* Logo + Nom + Slogan */}
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#0F0D0A]">
          AÏ<span className="text-[#C4922A]">MEVO</span>
        </h1>
        <p className="mt-1 text-sm md:text-base font-medium text-[#8B7355] tracking-wide uppercase">
          Psychologie mindful africaine
        </p>
      </div>

      {/* Spinner */}
      <div className="relative mb-6">
        <Loader2
          className={`animate-spin text-[#C4922A] ${sizeClasses}`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-[#FAFAF8]" />
        </div>
      </div>

      {/* Message personnalisable */}
      <p className="text-sm font-medium text-[#0F0D0A]">{message}</p>
    </div>
  );
}