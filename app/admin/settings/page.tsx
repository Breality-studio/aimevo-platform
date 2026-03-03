'use client';

import { useState, useEffect } from 'react';
import { PlanService } from '@/services/subscription.service';
import { PageHeader, Input, Button, Card, Badge, Table } from '@/components/ui';
import { Save, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function AdminSettingsPage() {
  const { profile } = useAuth();

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<any | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [plansData] = await Promise.all([
        // SettingsService.getAll(),
        PlanService.listAdmin(),
      ]);
    //   setSettings(settingsData);
      setPlans(plansData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
    //   for (const [key, value] of Object.entries(settings)) {
    //     await SettingsService.update(key, value);
    //   }
      alert('Paramètres enregistrés.');
    } catch (err) {
      alert('Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Paramètres de la plateforme"
        subtitle="Configuration générale et offres d’abonnement"
        actions={
          <Button onClick={loadAll} variant="secondary" disabled={saving || loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        }
      />

      <Card className="p-6 space-y-8">
        {/* 1. Identité plateforme */}
        <section className="space-y-6">
          <h3 className="text-lg font-medium">Identité de la plateforme</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nom de la plateforme</Label>
              <Input
                value={settings.platform_name || 'AÏMEVO'}
                onChange={e => handleSettingChange('platform_name', e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input
                value={settings.platform_slogan || ''}
                onChange={e => handleSettingChange('platform_slogan', e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur principale</Label>
              <div className="flex gap-3 items-center">
                <Input
                  type="color"
                  value={settings.primary_color || '#C4922A'}
                  onChange={e => handleSettingChange('primary_color', e.target.value)}
                  className="w-12 h-10 p-1"
                  disabled
                />
                <Input
                  value={settings.primary_color || '#C4922A'}
                  onChange={e => handleSettingChange('primary_color', e.target.value)}
                  disabled
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Abonnements – activation globale */}
        <section className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-medium">Abonnements</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label>Abonnements activés</Label>
              <p className="text-sm text-muted-foreground">
                Active ou désactive l’accès aux contenus et fonctionnalités premium.
              </p>
            </div>
            <Switch
              checked={settings.subscriptions_enabled ?? true}
              onCheckedChange={checked => handleSettingChange('subscriptions_enabled', checked)}
            />
          </div>
        </section>

        {/* 3. Gestion des plans */}
        <section className="space-y-6 border-t pt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Plans d’abonnement</h3>
            <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
              <DialogTrigger asChild>
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau plan</DialogTitle>
                </DialogHeader>
                {/* Ici, un formulaire simple – à compléter selon vos besoins */}
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Nom du plan</Label>
                    <Input placeholder="Ex: Pack Individuel" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Selectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="individual">Individuel</SelectItem>
                            <SelectItem value="enterprise">Entreprise</SelectItem>
                            <SelectItem value="ngo">ONG</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  {/* Ajoutez les autres champs : prix, features, etc. */}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="primary" onClick={() => setNewPlanOpen(false)}>
                    Annuler
                  </Button>
                  <Button>Créer le plan</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table
              columns={[
                { key: 'name', label: 'Nom', render: (p: any) => p.name },
                { key: 'prices', label: 'Prix mensuel', render: (p: any) => `${p.priceMonthly.toLocaleString('fr-FR')} XOF` },
                { key: 'status', label: 'Statut', render: (p: any) => (
                  <Badge variant={p.isActive ? 'green' : 'gray'}>
                    {p.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                )},
                {
                  key: 'actions',
                  label: '',
                  render: (p: any) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                },
              ]}
              data={plans}
              keyFn={p => p.$id}
            />
          </div>
        </section>

        {/* Bouton de sauvegarde global */}
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer tous les paramètres'}
          </Button>
        </div>
      </Card>
    </div>
  );
}