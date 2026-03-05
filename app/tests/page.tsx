'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { TestService } from '@/services/test.service'; // À créer
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Badge, Button, Empty } from '@/components/ui';
import Link from 'next/link';
import { Activity, Brain, ChevronRight } from 'lucide-react';

export default function TestsPage() {
  const { profile } = useAuth();
  const { setLoading } = useLoading();

  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadTests();
  }, [profile]);

  const loadTests = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement des tests disponibles...');

    try {
      const list = await TestService.listPublic(); // À implémenter
      setTests(list);
    } catch (err) {
      console.error('Erreur chargement tests', err);
      setTests([]);
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
          title="Tests & Évaluations"
          subtitle="Auto-évaluations et tests supervisés pour mieux vous connaître"
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <Empty
            title="Aucun test disponible pour le moment"
            description="De nouveaux tests seront ajoutés prochainement."
            icon={<Brain className="h-12 w-12 text-[#C4922A]/50" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tests.map(test => (
              <Link key={test.$id} href={`/tests/${test.$id}`}>
                <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-[#D4C9B8]/60 bg-white">
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-6">
                      <Brain className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-xl mb-3 text-[#0F0D0A]">
                      {test.title}
                    </h3>
                    <p className="text-[#8B7355] mb-6 line-clamp-3">
                      {test.description}
                    </p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Commencer le test
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}