'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ResourceService } from '@/services/resource.service';
import { SubscriptionService } from '@/services/subscription.service';
import { Card, Badge, Button } from '@/components/ui';
import { ArrowLeft, Lock, Play, FileText, Headphones } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [resource, setResource] = useState<any>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    setLoading(true);
    setError(null);

    try {
      const activeSub = await SubscriptionService.getActive(profile?.$id || '');
      const premium = !!activeSub;
      setHasPremium(premium);

      const data = await ResourceService.getPublic(id, premium);
      setResource(data);

      // Incrémenter vue
      await ResourceService.incrementView(id);
    } catch (err: any) {
      setError(err.message || 'Ressource introuvable ou accès réservé.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement de la ressource...</div>;
  }

  if (error || !resource) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Ressource non disponible'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/resources')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au catalogue
        </Button>
      </div>
    );
  }

  const isPremiumLocked = resource.isPremium && !hasPremium;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Badge variant={resource.isPremium ? 'gold' : 'stone'}>
          {resource.isPremium ? 'Premium' : 'Gratuit'}
        </Badge>
      </div>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-4">{resource.title}</h1>
        <p className="text-muted-foreground mb-6">{resource.description}</p>

        {isPremiumLocked ? (
          <Alert className="bg-amber-50 border-amber-200">
            <Lock className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Ce contenu est réservé aux abonnés.{' '}
              <Link href="/abonnements" className="underline font-medium">
                Découvrir les abonnements
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Contenu selon type */}
            {resource.type === 'article' && resource.contentBase64 && (
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: resource.contentBase64 }} />
              </div>
            )}

            {resource.type === 'video' && (
              <div className="aspect-video rounded-lg overflow-hidden border">
                {resource.externalUrl || resource.iframeUrl ? (
                  <iframe
                    src={resource.iframeUrl || resource.externalUrl}
                    title={resource.title}
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted">
                    Vidéo non disponible
                  </div>
                )}
              </div>
            )}

            {resource.type === 'audio' && (
              <div className="space-y-4">
                {resource.externalUrl || resource.contentBase64 ? (
                  <audio controls className="w-full">
                    <source src={resource.contentBase64 || resource.externalUrl} type="audio/mpeg" />
                    Votre navigateur ne supporte pas la lecture audio.
                  </audio>
                ) : (
                  <p className="text-muted-foreground">Audio non disponible</p>
                )}
              </div>
            )}

            {resource.type === 'pdf' && resource.externalUrl && (
              <Button variant="ghost" className="w-full">
                <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer">
                  Ouvrir le PDF
                </a>
              </Button>
            )}

            {/* Image de couverture */}
            {resource.previewImageBase64 && (
              <div className="rounded-lg overflow-hidden border">
                <img src={resource.previewImageBase64} alt={resource.title} className="w-full" />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}