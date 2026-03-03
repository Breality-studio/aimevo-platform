'use client';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthService } from '../../../services/auth.service';
import { Button, Alert } from '../../../components/ui';

export default function VerifyOtpPage() {
  const [code, setCode]         = useState(['','','','','','']);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resent, setResent]     = useState(false);
  const refs = Array.from({length:6}, ()=>useRef<HTMLInputElement>(null));
  const params = useSearchParams();
  const userId = params.get('userId') ?? '';
  const email  = params.get('email')  ?? '';
  const router = useRouter();

  function handleChange(i:number, val:string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...code]; next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) refs[i+1].current?.focus();
  }

  async function handleSubmit(e:FormEvent) {
    e.preventDefault(); setError('');
    const otp = code.join('');
    if (otp.length < 6) { setError('Entrez le code à 6 chiffres.'); return; }
    setLoading(true);
    try {
      await AuthService.verifyOtp(userId, otp);
      router.push('/login?verified=1');
    } catch (err:any) { setError(err?.message ?? 'Code invalide ou expiré.'); }
    finally { setLoading(false); }
  }

  async function resend() {
    await AuthService.resendOtp(userId, email);
    setResent(true); setTimeout(()=>setResent(false), 30000);
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-[#0F0D0A]">Vérification</h1>
        <p className="text-[#8B7355] text-sm mt-1">Code envoyé à <span className="font-medium text-[#0F0D0A]">{email}</span></p>
      </div>
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}
      {resent && <Alert variant="success" className="mb-5">Code renvoyé !</Alert>}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 justify-center mb-6">
          {code.map((d,i) => (
            <input key={i} ref={refs[i]} value={d} onChange={e=>handleChange(i,e.target.value)}
              onKeyDown={e=>{ if(e.key==='Backspace'&&!d&&i>0) refs[i-1].current?.focus(); }}
              maxLength={1} inputMode="numeric"
              className="w-12 h-14 text-center text-2xl font-display font-semibold rounded-xl border border-[#D4C9B8] bg-white focus:border-[#C4922A] focus:ring-2 focus:ring-[#C4922A]/20 transition-all outline-none"
            />
          ))}
        </div>
        <Button type="submit" loading={loading} className="w-full">Vérifier</Button>
      </form>
      <p className="text-center text-xs text-[#8B7355] mt-6">
        Pas reçu ? <button onClick={resend} className="text-[#C4922A] font-medium hover:underline">Renvoyer le code</button>
      </p>
    </div>
  );
}
