'use client';

import { useState, useEffect } from 'react';
import { EventService } from '@/services/event.service';
import { Table, Empty, Badge } from '@/components/ui';

interface EventRegistrationsProps {
  eventId: string;
}

export default function EventRegistrations({ eventId }: EventRegistrationsProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    EventService.listRegistrations(eventId)
      .then(regs => setRegistrations(regs))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {registrations.length} inscription(s) enregistrée(s)
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Chargement...</p>
      ) : registrations.length === 0 ? (
        <Empty title="Aucune inscription pour le moment" />
      ) : (
        <Table
          columns={[
            {
              key: 'user',
              label: 'Participant',
              render: (r: any) => r.userName || 'Anonyme',
            },
            {
              key: 'status',
              label: 'Statut',
              render: (r: any) => (
                <Badge variant={r.status === 'confirmed' ? 'green' : 'orange'}>
                  {r.status === 'confirmed' ? 'Confirmé' : r.status}
                </Badge>
              ),
            },
            {
              key: 'date',
              label: 'Inscrit le',
              render: (r: any) => new Date(r.registeredAt).toLocaleString('fr-FR'),
            },
            {
              key: 'qr',
              label: 'QR Code',
              render: (r: any) => r.qrFileId ? 'Généré' : '—',
            },
          ]}
          data={registrations}
          keyFn={r => r.$id}
          loading={loading}
        />
      )}
    </div>
  );
}