'use client';

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionService } from '@/services/subscription.service';
import { PageHeader, Card, Badge, Button, Input, Table, Empty, Textarea } from '@/components/ui';
import { Eye, Ban, PlayCircle, XCircle, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'pending', label: 'En attente' },
  { value: 'cancelled', label: 'Annulés' },
  { value: 'suspended', label: 'Suspendus' },
];

export default function AdminSubscriptionsPage() {
  const { profile } = useAuth();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [actionDialog, setActionDialog] = useState<'suspend' | 'activate' | 'cancel' | 'extend' | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [actionReason, setActionReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const { subscriptions } = await SubscriptionService.listAdmin(params);
      setSubscriptions(subscriptions);

      const statsData = await SubscriptionService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const performAction = async () => {
    if (!selectedSub) return;
    try {
      switch (actionDialog) {
        case 'suspend':
          await SubscriptionService.suspend(selectedSub.$id, actionReason.trim() || undefined);
          break;
        case 'activate':
          await SubscriptionService.activate(selectedSub.$id);
          break;
        case 'cancel':
          await SubscriptionService.cancel(selectedSub.$id, actionReason.trim() || undefined);
          break;
        case 'extend':
          await SubscriptionService.extend(selectedSub.$id, extendDays);
          break;
      }
      load();
      setActionDialog(null);
      setActionReason('');
      setExtendDays(30);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Abonnements actifs</h3>
            <p className="text-2xl font-bold">{stats.totalActive || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">En attente</h3>
            <p className="text-2xl font-bold">{stats.totalPending || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Annulés</h3>
            <p className="text-2xl font-bold">{stats.totalCancelled || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Revenu total</h3>
            <p className="text-2xl font-bold">
              {stats.totalRevenue?.toLocaleString('fr-FR') || 0} XOF
            </p>
          </div>
        </Card>
      </div>

      <PageHeader
        title="Gestion des Abonnements"
        subtitle="Suivi et actions manuelles sur les abonnements utilisateurs"
      />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher par nom ou email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72"
        />
        <Select value={statusFilter} onValueChange={(e: any) => setStatusFilter(e.target.value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selectionner" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card padding={false}>
        <Table
          columns={[
            {
              key: 'user', label: 'Utilisateur', render: (s: any) => (
                <div>
                  <div className="font-medium">{s.userName}</div>
                  <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                </div>
              )
            },
            { key: 'plan', label: 'Plan', render: (s: any) => s.planName },
            {
              key: 'status', label: 'Statut', render: (s: any) => (
                <Badge variant={
                  s.status === 'active' ? 'green' :
                    s.status === 'pending' ? 'orange' :
                      s.status === 'cancelled' ? 'red' :
                        s.status === 'suspended' ? 'orange' : 'gray'
                }>
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </Badge>
              )
            },
            {
              key: 'period', label: 'Période', render: (s: any) => (
                <>
                  {new Date(s.startDate).toLocaleDateString('fr-FR')}
                  {s.endDate && <> → {new Date(s.endDate).toLocaleDateString('fr-FR')}</>}
                </>
              )
            },
            { key: 'amount', label: 'Montant', render: (s: any) => `${s.amount.toLocaleString('fr-FR')} XOF` },
            {
              key: 'actions',
              label: '',
              render: (s: any) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSub(s)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {s.status === 'active' && (
                    <>
                      <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => { setSelectedSub(s); setActionDialog('suspend'); }}>
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setSelectedSub(s); setActionDialog('cancel'); }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {(s.status === 'suspended' || s.status === 'pending') && (
                    <Button size="sm" variant="ghost" className="text-green-600" onClick={() => { setSelectedSub(s); setActionDialog('activate'); }}>
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {s.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedSub(s); setActionDialog('extend'); }}>
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            },
          ]}
          data={subscriptions}
          loading={loading}
          keyFn={s => s.$id}
        />

        {!loading && subscriptions.length === 0 && <Empty title="Aucun abonnement trouvé" />}
      </Card>

      {/* Dialog Actions */}
      <AlertDialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog === 'suspend' && 'Suspendre l’abonnement'}
              {actionDialog === 'activate' && 'Réactiver l’abonnement'}
              {actionDialog === 'cancel' && 'Annuler l’abonnement'}
              {actionDialog === 'extend' && 'Prolonger l’abonnement'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog === 'extend' ? (
                <div className="space-y-4">
                  <p>Nombre de jours à ajouter :</p>
                  <Input
                    type="number"
                    value={extendDays}
                    onChange={e => setExtendDays(Number(e.target.value))}
                    min={1}
                    max={365}
                  />
                </div>
              ) : (
                'Indiquez une raison (optionnelle) puis confirmez.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionDialog !== 'extend' && (
            <Textarea
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              placeholder="Raison (optionnelle)"
              className="min-h-24"
            />
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={performAction}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}