'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventService } from '@/services/event.service';
import { PageHeader } from '@/components/ui/';
import { Badge, Card, Empty, Table } from '@/components/ui/';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

import { Eye, Edit, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import EventForm from '@/components/admin/EvenForm';
import EventRegistrations from '@/components/admin/EventRegistrations';

const EVENT_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'online', label: 'En ligne' },
  { value: 'presentiel', label: 'Présentiel' },
];

export default function AdminEventsPage() {
  const { user, profile } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [viewRegistrations, setViewRegistrations] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;

      const { events } = await EventService.listAdmin(params);
      setEvents(events);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const togglePublish = async (eventId: string, current: boolean) => {
    try {
      await EventService.publish(eventId, !current);
      setEvents(prev => prev.map(e => e.$id === eventId ? { ...e, isPublished: !current } : e));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await EventService.delete(deleteId);
      setEvents(prev => prev.filter(e => e.$id !== deleteId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ateliers & Événements"
        subtitle="Organisation et gestion des sessions"
        actions={
          <Button onClick={() => setEditEvent(null)}>
            Nouvel atelier
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher par titre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card padding={false}>
        <Table
          columns={[
            { key: 'title', label: 'Titre', render: (e: any) => e.title },
            { key: 'type', label: 'Type', render: (e: any) => <Badge>{e.type === 'online' ? 'En ligne' : 'Présentiel'}</Badge> },
            { key: 'date', label: 'Date', render: (e: any) => new Date(e.startDate).toLocaleDateString('fr-FR') },
            { key: 'places', label: 'Places', render: (e: any) => `${e.remainingPlaces}/${e.maxPlaces}` },
            { key: 'price', label: 'Prix', render: (e: any) => e.price === 0 ? 'Gratuit' : `${e.price} XOF` },
            { key: 'status', label: 'Statut', render: (e: any) => (
              <Badge variant={e.isPublished ? 'green' : 'orange'}>
                {e.isPublished ? 'Publié' : 'Brouillon'}
              </Badge>
            )},
            {
              key: 'actions',
              label: '',
              render: (e: any) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setViewRegistrations(e)}>
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditEvent(e)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(e.$id, e.isPublished)}
                  >
                    {e.isPublished ? <XCircle className="h-4 w-4 text-amber-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => setDeleteId(e.$id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            },
          ]}
          data={events}
          loading={loading}
          keyFn={e => e.$id}
        />

        {!loading && events.length === 0 && <Empty title="Aucun atelier créé" />}
      </Card>

      {/* Modal Inscriptions */}
      <Dialog open={viewRegistrations !== null} onOpenChange={() => setViewRegistrations(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inscriptions – {viewRegistrations?.title}</DialogTitle>
          </DialogHeader>
          {viewRegistrations && <EventRegistrations eventId={viewRegistrations.$id} />}
        </DialogContent>
      </Dialog>

      {/* Modal Création / Édition */}
      <Dialog open={editEvent !== null} onOpenChange={() => setEditEvent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editEvent ? 'Modifier l’atelier' : 'Nouvel atelier'}</DialogTitle>
          </DialogHeader>
          <EventForm
            authorId={user?.$id}
            initialEvent={editEvent}
            onSuccess={() => {
              setEditEvent(null);
              load();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L’atelier et toutes les inscriptions associées seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}