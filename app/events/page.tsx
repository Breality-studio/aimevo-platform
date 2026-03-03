'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { EventService } from '@/services/event.service';
import { PageHeader, Card, Badge, Button, Input, Select, Empty } from '@/components/ui';
import Link from 'next/link';
import { Calendar, Video, MapPin, Users } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'online', label: 'En ligne' },
  { value: 'presentiel', label: 'Présentiel' },
];

export default function EventsPage() {
  const { profile } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [typeFilter, search]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params: any = { upcomingOnly: true, limit: 20 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;

      const list = await EventService.listPublic();
      setEvents(list);
    } catch (err) {
      console.error('Erreur chargement événements', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ateliers & Événements"
        subtitle="Sessions en ligne et en présentiel pour votre bien-être"
      />

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Rechercher par titre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-100 w-48">
          {EVENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Empty
          title="Aucun événement prévu"
          description="De nouveaux ateliers seront ajoutés prochainement."
        //   icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Link key={event.$id} href={`/events/${event.$id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="relative">
                  {event.previewImageBase64 ? (
                    <img
                      src={event.previewImageBase64}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      {event.type === 'online' ? <Video className="h-12 w-12 text-muted-foreground" /> : <MapPin className="h-12 w-12 text-muted-foreground" />}
                    </div>
                  )}

                  {event.price === 0 ? (
                    <Badge className="absolute top-3 left-3" variant="green">Gratuit</Badge>
                  ) : (
                    <Badge className="absolute top-3 left-3" variant="purple">
                      {event.price.toLocaleString('fr-FR')} XOF
                    </Badge>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-medium line-clamp-2 mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center gap-1">
                      {event.type === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      <span>{event.type === 'online' ? 'En ligne' : 'Présentiel'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{event.remainingPlaces}/{event.maxPlaces} places</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(event.startDate).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}