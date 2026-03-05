'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { ResourceService } from '@/services/resource.service';
import { SubscriptionService } from '@/services/subscription.service';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Button, Alert } from '@/components/ui';
import { AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Lock, Play, FileText, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { setLoading } = useLoading();
  const router = useRouter();

  const [resource, setResource] = useState<any>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [loading, setLocalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadResource();
  }, [id]);

  const loadResource = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement de la ressource...');

    try {
      // Vérification abonnement
      const activeSub = await SubscriptionService.getActive(profile?.$id || '');
      const premium = !!activeSub;
      setHasPremium(premium);

      // Chargement de la ressource (méthode publique)
      const data = await ResourceService.getPublic(id, premium);
      setResource(data);

      // Incrémenter le compteur de vues (optionnel, sans bloquer)
      ResourceService.incrementView(id).catch(console.warn);
    } catch (err: any) {
      console.error('Erreur chargement ressource', err);
      setError(err.message || 'Ressource introuvable ou accès réservé.');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Le GlobalLoader s'affiche via le provider
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <Alert variant="error">
            <AlertDescription>{error || 'Ressource non disponible'}</AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/resources')}
            className="bg-[#C4922A] hover:bg-[#A07520]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const isPremiumLocked = resource.isPremium && !hasPremium;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing */}
      <Header />

      {/* Contenu principal */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-5xl mx-auto animate-fade-up space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-[#0F0D0A] hover:bg-[#C4922A]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <Badge
            variant={resource.isPremium ? 'gold' : 'purple'}
            className={resource.isPremium ? 'bg-[#C4922A] text-white' : 'border-[#8B7355] text-[#8B7355]'}
          >
            {resource.isPremium ? 'Premium' : 'Gratuit'}
          </Badge>
        </div>

        <Card className="border-[#D4C9B8]/60 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="p-8">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#0F0D0A] mb-4">
              {resource.title}
            </h1>

            <p className="text-[#8B7355] mb-8 leading-relaxed">
              {resource.description}
            </p>

            {isPremiumLocked ? (
              <Alert className="bg-[#FFF8E1]/70 border-[#C4922A]/40 text-[#0F0D0A]">
                <Lock className="h-5 w-5 text-[#C4922A]" />
                <AlertDescription>
                  Ce contenu est réservé aux abonnés.{' '}
                  <Link href="/abonnements" className="underline font-medium hover:text-[#C4922A]">
                    Découvrir les abonnements
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-10">
                {/* Contenu selon type */}
                {resource.type === 'article' && resource.contentBase64 && (
                  <div className="prose prose-lg max-w-none text-[#0F0D0A]">
                    <div dangerouslySetInnerHTML={{ __html: resource.contentBase64 }} />
                  </div>
                )}

                {resource.type === 'video' && (
                  <div className="aspect-video rounded-xl overflow-hidden border border-[#D4C9B8]/60 shadow-sm">
                    {resource.externalUrl || resource.iframeUrl ? (
                      <iframe
                        src={resource.iframeUrl || resource.externalUrl}
                        title={resource.title}
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-[#FAFAF8]">
                        Vidéo non disponible
                      </div>
                    )}
                  </div>
                )}

                {resource.type === 'audio' && (
                  <div className="space-y-4">
                    {resource.externalUrl || resource.contentBase64 ? (
                      <audio controls className="w-full rounded-lg">
                        <source src={resource.contentBase64 || resource.externalUrl} type="audio/mpeg" />
                        Votre navigateur ne supporte pas la lecture audio.
                      </audio>
                    ) : (
                      <p className="text-[#8B7355] text-center">Audio non disponible</p>
                    )}
                  </div>
                )}

                {resource.type === 'pdf' && resource.externalUrl && (
                  <Button variant="primary" className="w-full border-[#C4922A] text-[#C4922A] hover:bg-[#C4922A]/10">
                    <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer">
                      Ouvrir le PDF
                    </a>
                  </Button>
                )}

                {/* Image de couverture */}
                {resource.previewImageBase64 && (
                  <div className="rounded-xl overflow-hidden border border-[#D4C9B8]/60 shadow-sm">
                    <img
                      src={resource.previewImageBase64}
                      alt={resource.title}
                      className="w-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}