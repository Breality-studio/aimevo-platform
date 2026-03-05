'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { PlanService, SubscriptionService } from '@/services/subscription.service';
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Badge, Button, Alert } from '@/components/ui';
import { AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function AbonnementsPage() {
  const { profile } = useAuth();
  const { setLoading } = useLoading();

  const [plans, setPlans] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [loading, setLocalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement des offres d’abonnement...');

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
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing page */}
      <Header />

      {/* Contenu principal */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-6xl mx-auto animate-fade-up space-y-12">
        {/* En-tête */}
        <PageHeader
          title="Abonnements"
          subtitle="Choisissez le plan qui correspond à votre parcours de bien-être"
        />

        {/* Abonnement actif (si existant) */}
        {activeSub && (
          <Card className="border-[#C4922A]/30 bg-[#FFF8E1]/50 backdrop-blur-sm shadow-sm">
            <div className="p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold flex items-center gap-3 text-[#0F0D0A]">
                    <CheckCircle className="h-6 w-6 text-[#C4922A]" />
                    Abonnement actif : {activeSub.planName}
                  </h2>
                  <p className="text-[#8B7355]">
                    Valable jusqu’au{' '}
                    <span className="font-medium text-[#0F0D0A]">
                      {new Date(activeSub.endDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
                <Badge className="bg-[#C4922A] text-white px-4 py-1.5">
                  Actif
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[500px] animate-pulse bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="error" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card
                key={plan.$id}
                className={`overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:text-[#C4922A] ${
                  plan.isPopular
                    ? 'border-[#C4922A] scale-[1.02] bg-white'
                    : 'border-[#D4C9B8]/60 bg-white'
                }`}
              >
                {plan.isPopular && (
                  <div className="bg-[#C4922A] text-white text-center py-2 text-sm font-medium">
                    Le plus choisi
                  </div>
                )}

                <div className="p-8 space-y-8">
                  <div>
                    <h3 className="text-3xl font-bold text-[#0F0D0A]">{plan.name}</h3>
                    <p className="text-[#8B7355] mt-2">{plan.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-bold text-[#0F0D0A]">
                        {plan.priceMonthly.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-xl text-[#8B7355]">XOF / mois</span>
                    </div>
                    <div className="text-sm text-[#8B7355] space-y-1">
                      <p>Trimestriel : {plan.priceQuarterly.toLocaleString('fr-FR')} XOF</p>
                      <p>Annuel : {plan.priceYearly.toLocaleString('fr-FR')} XOF</p>
                    </div>
                  </div>

                  <ul className="space-y-3 text-[#0F0D0A]">
                    {plan.features?.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#C4922A] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6">
                    <Button
                      className={`w-full py-7 text-lg rounded-full ${
                        plan.isPopular
                          ? 'bg-[#C4922A] hover:bg-[#A07520] text-white shadow-md'
                          : 'border-2 border-[#C4922A] text-[#C4922A] hover:bg-[#C4922A]/10 hover:text-[#C4922A]'
                      }`}
                      disabled={activeSub?.planId === plan.$id}
                    >
                      {activeSub?.planId === plan.$id ? 'Plan actuel' : 'Choisir ce plan'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}