'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { TestService } from '@/services/test.service'; // À créer
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Badge, Empty } from '@/components/ui';
import { Calendar, Activity, ChevronRight } from 'lucide-react';

export default function TestsHistoryPage() {
  const { profile } = useAuth();
  const { setLoading } = useLoading();

  const [testsDone, setTestsDone] = useState<any[]>([]);
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadHistory();
  }, [profile]);

  const loadHistory = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement de votre historique de tests...');

    try {
      const history = await TestService.getUserHistory(profile!.$id); // À implémenter
      setTestsDone(history);
    } catch (err) {
      console.error('Erreur chargement historique tests', err);
      setTestsDone([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      <Header />

      <main className="pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto animate-fade-up space-y-10">
        <PageHeader
          title="Mes Tests Réalisés"
          subtitle="Historique de vos auto-évaluations et résultats"
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : testsDone.length === 0 ? (
          <Empty
            title="Aucun test réalisé pour le moment"
            description="Découvrez les tests disponibles et commencez votre auto-évaluation."
            icon={<Activity className="h-12 w-12 text-[#C4922A]/50" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testsDone.map(test => (
              <Card key={test.$id} className="border-[#D4C9B8]/60 bg-white">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg text-[#0F0D0A]">
                        {test.testTitle}
                      </h3>
                      <p className="text-sm text-[#8B7355] mt-1">
                        Réalisé le {new Date(test.completedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {test.score || '—'} / 100
                    </Badge>
                  </div>

                  <p className="text-sm text-[#8B7355] mb-4 line-clamp-2">
                    {test.summary || 'Aucun résumé disponible'}
                  </p>

                  <Button variant="outline" className="w-full border-[#C4922A] text-[#C4922A] hover:bg-[#C4922A]/10">
                    Voir les résultats détaillés
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}