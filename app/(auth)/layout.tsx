import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-10 bg-[#0F0D0A] relative overflow-hidden">
        {/* Geometric accent */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full border border-[#C4922A] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full border border-[#C4922A] -translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 border border-[#C4922A]/50 rotate-45" />
        </div>

        <div className="relative z-10">
          <span className="font-display text-2xl font-semibold text-white tracking-tight">
            AÏ<span className="text-[#C4922A]">MEVO</span>
          </span>
        </div>

        <div className="relative z-10">
          <blockquote className="font-display text-3xl font-light text-white leading-relaxed">
            « Le bien-être commence<br/>par se connaître soi-même. »
          </blockquote>
          <p className="text-[#8B7355] text-sm mt-4">Sagesse africaine • Psychologie moderne</p>
        </div>

        <div className="relative z-10 flex gap-3">
          {/* {['🇧🇯', '🇸🇳', '🇨🇮', '🇬🇭', '🇨🇲'].map((flag) => (
            <span key={flag} className="text-xl opacity-70">{flag}</span>
          ))} */}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAF8]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display text-2xl font-semibold text-[#0F0D0A]">
              AÏ<span className="text-[#C4922A]">MEVO</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
