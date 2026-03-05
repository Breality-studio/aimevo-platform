'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { EventService } from '@/services/event.service';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Button, Alert } from '@/components/ui';
import { AlertDescription } from '@/components/ui/alert';
import { Calendar, Video, MapPin, Users, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { setLoading } = useLoading();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLocalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement de l’événement...');

    try {
      const data = await EventService.getPublic(id);
      setEvent(data);

      if (profile?.$id) {
        const registered = await EventService.isRegistered(profile.$id, id);
        setIsRegistered(registered);
      }
    } catch (err: any) {
      setError(err.message || 'Événement introuvable ou non disponible.');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!profile?.$id) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      await EventService.register(profile.$id, id);
      setIsRegistered(true);
      alert('Inscription confirmée ! Vous recevrez un rappel avant l’événement.');
      loadEvent(); // Rafraîchir places restantes
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’inscription.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return null; // Le GlobalLoader s'affiche via le provider
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <Alert variant="error">
            <AlertDescription>{error || 'Événement non disponible'}</AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/events')}
            className="bg-[#C4922A] hover:bg-[#A07520]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux événements
          </Button>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.startDate) < new Date();
  const isFull = event.remainingPlaces <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing */}
      <Header />

      {/* Contenu principal */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-5xl mx-auto animate-fade-up space-y-10">
        {/* Bouton retour + badge statut */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/events')}
            className="text-[#0F0D0A] hover:bg-[#C4922A]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Button>

          <Badge
            variant={event.type === 'online' ? 'green' : 'gray'}
            className={event.type === 'online' ? 'bg-blue-600 text-white' : 'border-[#8B7355] text-[#8B7355]'}
          >
            {event.type === 'online' ? 'En ligne' : 'Présentiel'}
          </Badge>
        </div>

        {/* Carte principale */}
        <Card className="border-[#D4C9B8]/60 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="p-8">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#0F0D0A] mb-4">
              {event.title}
            </h1>

            {/* Badges statut */}
            <div className="flex flex-wrap gap-3 mb-8">
              {event.price === 0 ? (
                <Badge className="bg-green-600 text-white px-4 py-1.5 text-base">
                  Gratuit
                </Badge>
              ) : (
                <Badge className="bg-[#C4922A] text-white px-4 py-1.5 text-base">
                  {event.price.toLocaleString('fr-FR')} XOF
                </Badge>
              )}

              <Badge variant="orange" className="text-[#8B7355] border-[#D4C9B8]/60 px-4 py-1.5 text-base">
                <Users className="h-4 w-4 mr-2" />
                {event.remainingPlaces}/{event.maxPlaces} places restantes
              </Badge>
            </div>

            {/* Infos date & lieu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date et heure</p>
                <p className="font-medium text-[#0F0D0A]">
                  {new Date(event.startDate).toLocaleString('fr-FR', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                  {event.endDate && (
                    <> – {new Date(event.endDate).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}</>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Lieu / Lien</p>
                {event.type === 'online' ? (
                  <a
                    href={event.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C4922A] hover:underline font-medium"
                  >
                    Rejoindre la session en ligne
                  </a>
                ) : (
                  <p className="font-medium text-[#0F0D0A]">{event.location}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-lg max-w-none text-[#0F0D0A] mb-10">
              <p>{event.description}</p>
            </div>

            {/* Statut & Action */}
            {isPast ? (
              <Alert className="bg-gray-100 border-gray-300 text-[#0F0D0A]">
                <AlertDescription>Cet événement est terminé.</AlertDescription>
              </Alert>
            ) : isRegistered ? (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  Vous êtes inscrit ! Un rappel vous sera envoyé avant l'événement.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex justify-center pt-8">
                <Button
                  size="lg"
                  onClick={handleRegister}
                  disabled={registering || isFull}
                  className="min-w-[280px] bg-[#C4922A] hover:bg-[#A07520] text-white text-lg py-7 rounded-full shadow-md"
                >
                  {registering
                    ? 'Inscription en cours...'
                    : isFull
                    ? 'Complet'
                    : 'S’inscrire maintenant'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}