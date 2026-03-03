'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TestService } from '@/services/test.service';
import { PageHeader, Card, Badge, Button, Table, Empty } from '@/components/ui';
import Link from 'next/link';
import { FileText, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProTestsPage() {
  const { profile } = useAuth();

  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'professional') return;

    const load = async () => {
      setLoading(true);
      try {
        const tests = await TestService.pendingReview(); // À adapter si besoin de filtre par pro
        setPending(tests);
      } catch (err) {
        console.error('Erreur chargement tests en attente', err);
        setPending([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests supervisés à corriger"
        subtitle="Évaluations soumises par vos patients en attente de votre analyse"
      />

      <Card padding={false}>
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Empty
            title="Aucun test en attente"
            description="Tous les tests supervisés ont été corrigés ou aucun n’a encore été soumis."
            // icon={<FileText className="h-12 w-12 text-muted-foreground" />}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'user',
                label: 'Patient',
                render: (a: any) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {a.userName?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="font-medium">{a.userName || 'Anonyme'}</p>
                      <p className="text-xs text-muted-foreground">{a.userEmail || '—'}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'test',
                label: 'Test',
                render: (a: any) => a.testTitle || 'Test sans titre',
              },
              {
                key: 'date',
                label: 'Soumis le',
                render: (a: any) => new Date(a.completedAt).toLocaleString('fr-FR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              },
              {
                key: 'status',
                label: 'Statut',
                render: () => <Badge variant="orange">En attente</Badge>,
              },
              {
                key: 'actions',
                label: '',
                render: (a: any) => (
                  <Link href={`/pro/tests/${a.$id}`}>
                    <Button size="sm" variant="secondary">
                      Corriger
                    </Button>
                  </Link>
                ),
              },
            ]}
            data={pending}
            keyFn={(a) => a.$id}
          />
        )}
      </Card>
    </div>
  );
}