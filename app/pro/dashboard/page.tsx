'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TestService } from '@/services/test.service';
import { ChatService } from '@/services/chat.service';
import { StatCard, Card, Badge, PageHeader, Button, Empty } from '@/components/ui';
import Link from 'next/link';
import { MessageSquare, Calendar, UserCircle, FileText, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProDashboard() {
  const { profile } = useAuth();
  const router = useRouter();

  const [pendingTests, setPendingTests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<number>(0);
  const [followedPatients, setFollowedPatients] = useState<number>(0);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'professional') {
      router.replace('/dashboard');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Tests en attente de correction
        const tests = await TestService.pendingReview();
        setPendingTests(tests);

        // 2. Conversations actives (exemple simple)
        // À adapter selon votre implémentation réelle
        const chats = await ChatService.listActiveForPro(profile.$id);
        setActiveChats(chats.length);

        // 3. Patients suivis (utilisateurs avec qui il y a eu au moins 1 message)
        // Exemple simplifié – à optimiser
        setFollowedPatients(12); // Placeholder – remplacer par vrai calcul

        // 4. Prochains RDV (placeholder)
        setUpcomingSessions([]); // À connecter au futur calendrier
      } catch (err) {
        console.error('Erreur chargement dashboard Pro', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile, router]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bonjour' :
    hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chargement..." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (profile?.role !== 'professional') {
    return null; // Redirection déjà gérée
  }

  return (
    <div className="animate-fade-up space-y-8">
      {/* Header personnalisé */}
      <PageHeader
        title={`${greeting}, Dr. ${profile?.firstName ?? ''}`}
        subtitle={new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Tests en attente"
          value={pendingTests.length}
          icon={<FileText className="h-6 w-6 text-amber-600" />}
          loading={loading}
          delta={pendingTests.length > 0 ? `${pendingTests.length} à réviser` : undefined}
          deltaUp={false}
        />
        <StatCard
          label="Conversations actives"
          value={activeChats}
          icon={<MessageSquare className="h-6 w-6 text-green-600" />}
          loading={loading}
        />
        <StatCard
          label="Patients suivis"
          value={followedPatients}
          icon={<UserCircle className="h-6 w-6 text-blue-600" />}
          loading={loading}
        />
        <StatCard
          label="Prochains RDV"
          value={upcomingSessions.length || '—'}
          icon={<Calendar className="h-6 w-6 text-purple-600" />}
          loading={loading}
        />
      </div>

      {/* Tests supervisés en attente */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4C9B8]/60 bg-[#FAFAF8]/50">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F0D0A]">
              Tests supervisés à réviser
            </h2>
            <p className="text-sm text-[#8B7355] mt-1">
              Évaluations soumises par vos patients en attente de correction
            </p>
          </div>
          <Link href="/pro/tests">
            <Button variant="secondary" size="sm">
              Voir tous les tests
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : pendingTests.length === 0 ? (
          <div className="p-12 text-center">
            <Empty
              title="Aucun test en attente"
              description="Tous les tests supervisés ont été corrigés."
              // icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            />
          </div>
        ) : (
          <div className="divide-y divide-[#D4C9B8]/40">
            {pendingTests.slice(0, 5).map((attempt) => (
              <div
                key={attempt.$id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAF8]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#F0EDE6] flex items-center justify-center text-sm font-semibold text-[#8B7355]">
                  {attempt.userName?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F0D0A] truncate">
                    {attempt.testTitle || 'Test sans titre'}
                  </p>
                  <p className="text-xs text-[#8B7355]">
                    Soumis le {new Date(attempt.completedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Badge variant="orange">En attente</Badge>
                <Link href={`/pro/tests/${attempt.$id}`}>
                  <Button size="sm" variant="secondary">
                    Réviser
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/pro/chat">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#C4922A]/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-[#C4922A]" />
                </div>
                <div>
                  <h3 className="font-medium">Conversations</h3>
                  <p className="text-sm text-muted-foreground">Voir les messages en attente</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/pro/availability">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Disponibilités</h3>
                  <p className="text-sm text-muted-foreground">Gérer votre calendrier</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/pro/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Mon profil</h3>
                  <p className="text-sm text-muted-foreground">Modifier votre présentation</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* À venir : sessions programmées */}
      <Card>
        <div className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Prochaines sessions</h3>
          {upcomingSessions.length === 0 ? (
            <Empty
              title="Aucune session programmée"
              description="Ajoutez des créneaux dans vos disponibilités."
              // icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-3">
              {/* À implémenter quand le calendrier sera prêt */}
              <p className="text-sm text-muted-foreground italic">
                Fonctionnalité en cours d’intégration...
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}