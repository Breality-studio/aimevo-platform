'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { EventService } from '@/services/event.service';
import { Card, Badge, Button, Alert } from '@/components/ui';
import { Calendar, Video, MapPin, Users, ArrowLeft, CheckCircle } from 'lucide-react';
import { AlertDescription } from '@/components/ui/alert';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    setError(null);

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
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!profile?.$id) {
      router.push('/login?redirect=/events/' + id);
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
    return <div className="p-8 text-center">Chargement de l’événement...</div>;
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-6">
        <Alert variant="error">
          <AlertDescription>{error || 'Événement non disponible'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux événements
        </Button>
      </div>
    );
  }

  const isPast = new Date(event.startDate) < new Date();
  const isFull = event.remainingPlaces <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => router.push('/events')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au catalogue
      </Button>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <Badge variant={event.type === 'online' ? 'blue' : 'green'}>
            {event.type === 'online' ? 'En ligne' : 'Présentiel'}
          </Badge>
          {event.price === 0 ? (
            <Badge variant="green">Gratuit</Badge>
          ) : (
            <Badge variant="purple">{event.price.toLocaleString('fr-FR')} XOF</Badge>
          )}
          <Badge variant="gray">
            <Users className="h-3 w-3 mr-1" />
            {event.remainingPlaces}/{event.maxPlaces} places restantes
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Date et heure</p>
            <p className="font-medium">
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
            <p className="text-sm text-muted-foreground">Lieu / Lien</p>
            {event.type === 'online' ? (
              <a
                href={event.location}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Rejoindre la session en ligne
              </a>
            ) : (
              <p>{event.location}</p>
            )}
          </div>
        </div>

        <div className="prose max-w-none mb-8">
          <p>{event.description}</p>
        </div>

        {isPast ? (
          <Alert>
            <AlertDescription>Cet événement est terminé.</AlertDescription>
          </Alert>
        ) : isRegistered ? (
          <Alert variant="success">
            <CheckCircle className="h-5 w-5" />
            <AlertDescription>
              Vous êtes inscrit ! Un rappel vous sera envoyé avant l'événement.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex justify-center pt-6">
            <Button
              size="lg"
              onClick={handleRegister}
              disabled={registering || isFull}
              className="min-w-[200px]"
            >
              {registering
                ? 'Inscription en cours...'
                : isFull
                ? 'Complet'
                : 'S’inscrire maintenant'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}