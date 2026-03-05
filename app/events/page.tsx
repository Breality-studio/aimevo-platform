'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { EventService } from '@/services/event.service';
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Badge, Button, Input, Empty } from '@/components/ui';
import {
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';

import Link from 'next/link';
import { Calendar, Video, MapPin, Users, ChevronRight } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'online', label: 'En ligne' },
  { value: 'presentiel', label: 'Présentiel' },
];

export default function EventsPage() {
  const { profile } = useAuth();
  const { setLoading } = useLoading();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // if (!profile) return;
    loadEvents();
  }, [profile, typeFilter, search]);

  const loadEvents = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement des ateliers et événements...');

    try {
      const params: any = { upcomingOnly: true, limit: 20 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;

      const list = await EventService.listPublic(params);
      setEvents(list);
    } catch (err) {
      console.error('Erreur chargement événements', err);
      setEvents([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing page */}
      <Header />

      {/* Contenu principal */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto animate-fade-up space-y-10">
        {/* En-tête */}
        <PageHeader
          title="Ateliers & Événements"
          subtitle="Sessions en ligne et en présentiel pour votre bien-être"
        />

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Rechercher par titre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste des événements */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 animate-pulse bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Empty
            title="Aucun événement prévu"
            description="De nouveaux ateliers seront ajoutés prochainement."
            icon={<Calendar className="h-12 w-12 text-[#C4922A]/50" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Link key={event.$id} href={`/events/${event.$id}`}>
                <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-[#D4C9B8]/60 bg-white">
                  <div className="relative">
                    {event.previewImageBase64 ? (
                      <img
                        src={event.previewImageBase64}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center">
                        {event.type === 'online' ? (
                          <Video className="h-12 w-12 text-[#8B7355]" />
                        ) : (
                          <MapPin className="h-12 w-12 text-[#8B7355]" />
                        )}
                      </div>
                    )}

                    {event.price === 0 ? (
                      <Badge className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1">
                        Gratuit
                      </Badge>
                    ) : (
                      <Badge className="absolute top-4 left-4 bg-amber-700 text-white px-3 py-1">
                        {event.price.toLocaleString('fr-FR')} XOF
                      </Badge>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-medium text-lg line-clamp-2 mb-2 text-[#0F0D0A]">
                      {event.title}
                    </h3>
                    <p className="text-sm text-[#8B7355] line-clamp-3 mb-4">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[#8B7355] mt-auto">
                      <div className="flex items-center gap-2">
                        {event.type === 'online' ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        <span>{event.type === 'online' ? 'En ligne' : 'Présentiel'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.remainingPlaces}/{event.maxPlaces} places</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#8B7355] mt-3">
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

        {/* Bouton d'accès rapide */}
        <div className="flex justify-center mt-8">
          <Button variant="gold" className="border-[#C4922A] text-[#C4922A] hover:bg-[#C4922A]/10">
            Voir tous les événements à venir
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}