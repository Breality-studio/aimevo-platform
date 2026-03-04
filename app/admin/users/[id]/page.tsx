'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminService } from '@/services/admin.service';
import { SubscriptionService } from '@/services/subscription.service'; // Ajout pour abonnements
import { PageHeader, Card, Button, Input, Select, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type Role = 'admin' | 'professional' | 'member';

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  password?: string; // Uniquement en création
  subscriptionId?: string; // Optionnel pour assigner abonnement
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Membre' },
  { value: 'professional', label: 'Professionnel' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminUserDetailsPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const isNew = userId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [userAuth, setUserAuth] = useState<any>(null); // Pour email depuis auth
  const [subscriptions, setSubscriptions] = useState<any[]>([]); // Liste abonnements existants

  const [form, setForm] = useState<UserForm>({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: user?.email || '',
    role: 'member',
    isActive: true,
    password: '',
  });

  useEffect(() => {
    if (!isNew && userId) {
      loadUser();
      loadSubscriptions();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);

      setUserAuth(user);
      setForm({
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        email: user.email ?? '', // Email depuis auth
        role: profile?.role ?? 'member',
        isActive: profile?.isActive ?? true,
      });
    } catch (err) {
      console.error('Erreur chargement utilisateur', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res = await SubscriptionService.list(userId);
      setSubscriptions(res);
    } catch (err) {
      console.error('Erreur chargement abonnements', err);
    }
  };

  const handleChange = (field: keyof UserForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.$id) return;
    try {
      setSaving(true);
      if (isNew) {
        const { subscriptionId, ...createData } = form;
        await AdminService.createUser(profile.$id, createData);

        // Assigner abonnement si sélectionné
        if (subscriptionId) {
          await SubscriptionService.create(profile.$id, { planId: subscriptionId, billingCycle: 'monthly' });
        }
      } else {
        const { password, subscriptionId, ...updateData } = form;
        await AdminService.updateUser(profile.$id, userId, updateData);
      }
      router.push('/admin/users');
    } catch (err) {
      console.error('Erreur sauvegarde', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!profile?.$id) return;
    try {
      await AdminService.deleteUser(profile.$id, userId);
      router.push('/admin/users');
    } catch (err) {
      console.error('Erreur suppression', err);
    }
  };

  const toogleActive = async (selectedUserId: string) => {
    const { password, subscriptionId, ...updateData } = form;
    await AdminService.updateUser(selectedUserId, userId, { ...updateData, isActive: !form.isActive });
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title={isNew ? 'Nouvel utilisateur' : 'Modifier utilisateur'}
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            Retour
          </Button>
        }
      />
      <Card className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">
            Chargement...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={form.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
              />
              <Input
                label="Nom"
                value={form.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                disabled={!isNew} // Non modifiable en édition
                onChange={e => handleChange('email', e.target.value)}
              />
              <Select
                label="Rôle"
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={e => handleChange('role', e.target.value)}
              />
              {isNew && (
                <Input
                  label="Mot de passe initial"
                  type="password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                />
              )}
              {isNew && (
                <Select
                  label="Assigner un abonnement (optionnel)"
                  options={[
                    { value: '', label: 'Aucun' },
                    // Charger dynamiquement via SubscriptionService.listPlans() si besoin
                    { value: 'plan_individual', label: 'Pack Individuel' },
                    { value: 'plan_enterprise', label: 'Pack Entreprise' },
                    { value: 'plan_ngo', label: 'Pack ONG' },
                  ]}
                  value={form.subscriptionId || ''}
                  onChange={e => handleChange('subscriptionId', e.target.value)}
                />
              )}
            </div>

            {!isNew && (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Statut du compte</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant={form.isActive ? 'primary' : 'ghost'} size="sm">
                        {form.isActive ? 'Suspendre' : 'Activer'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Voulez-vous {form.isActive ? 'suspendre' : 'activer'} cet utilisateur ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => toogleActive(profile!.$id)}>
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-4">Abonnements actuels</p>
                  {subscriptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun abonnement</p>
                  ) : (
                    <ul className="space-y-2">
                      {subscriptions.map(sub => (
                        <li key={sub.$id} className="text-sm">
                          {sub.planName} - {sub.status}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="danger" size="sm" className="mt-4">
                      Supprimer l'utilisateur
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Confirmez-vous ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteUser}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}