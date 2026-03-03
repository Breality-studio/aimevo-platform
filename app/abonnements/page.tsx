'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PlanService, SubscriptionService } from '@/services/subscription.service';
import { PageHeader, Card, Badge, Button, Alert } from '@/components/ui';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { AlertDescription } from '@/components/ui/alert';

export default function AbonnementsPage() {
  const { profile } = useAuth();

  const [plans, setPlans] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allPlans, sub] = await Promise.all([
        PlanService.list(),
        profile?.$id ? SubscriptionService.getActive(profile.$id) : null,
      ]);

      setPlans(allPlans);
      setActiveSub(sub);
    } catch (err) {
      console.error('Erreur chargement abonnements', err);
      setError('Impossible de charger les offres pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Abonnements"
        subtitle="Choisissez le plan qui correspond à votre parcours de bien-être"
      />

      {activeSub && (
        <Card className="border-primary/30 bg-primary/5">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Abonnement actif : {activeSub.planName}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Valable jusqu’au{' '}
                  <span className="font-medium">
                    {new Date(activeSub.endDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
              <Badge variant="gray" className="text-primary border-primary">
                Actif
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="error">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card
              key={plan.$id}
              className={`overflow-hidden border-2 transition-all hover:shadow-xl ${
                plan.isPopular ? 'border-primary scale-[1.02]' : 'border-border'
              }`}
            >
              {plan.isPopular && (
                <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-medium">
                  Le plus choisi
                </div>
              )}

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {plan.priceMonthly.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-muted-foreground">XOF / mois</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Trimestriel : {plan.priceQuarterly.toLocaleString('fr-FR')} XOF</p>
                    <p>Annuel : {plan.priceYearly.toLocaleString('fr-FR')} XOF</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm">
                  {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Button
                    className="w-full"
                    variant={plan.isPopular ? 'primary' : 'ghost'}
                    disabled={activeSub?.planId === plan.$id}
                  >
                    {activeSub?.planId === plan.$id
                      ? 'Plan actuel'
                      : 'Choisir ce plan'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}