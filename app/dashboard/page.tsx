'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading'; // Pour le loader global
import { SubscriptionService } from '@/services/subscription.service';
import { ChatService } from '@/services/chat.service';
// import { ResourceService } from '@/services/resource.service'; 

import { Header } from '@/components/layout/Header'; // Navbar du landing
import { PageHeader, Card, Badge, Button, StatCard, Empty } from '@/components/ui';
import Link from 'next/link';
import {
  BookOpen,
  MessageSquare,
  Activity,
  Award,
  ChevronRight,
  Calendar,
  Users,
  Video,
  UserCircle,
} from 'lucide-react';

export default function UserDashboard() {
  const { profile, isLoggedIn } = useAuth();
  const { setLoading } = useLoading(); // Loader global
  const router = useRouter();

  const [subscription, setSubscription] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  // const [recentResources, setRecentResources] = useState<any[]>([]); // À activer plus tard

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    if (!profile) return;

    loadDashboardData();
  }, [profile, isLoggedIn, router]);

  const loadDashboardData = async () => {
    setPageLoading(true);
    setLoading(true, 'Chargement de votre espace personnel...'); // Loader global

    try {
      // 1. Statut abonnement
      const activeSub = await SubscriptionService.getActive(profile!.$id);
      setSubscription(activeSub);

      // 2. Messages non lus
      const unread = await ChatService.getUnreadCount(profile!.$id);
      setUnreadMessages(unread || 0);

      // 3. Dernières ressources (commenté pour l'instant - à activer)
      // const resources = await ResourceService.listRecentForUser(profile!.$id, 3);
      // setRecentResources(resources || []);

      setPageLoading(false);
    } catch (err) {
      console.error('Erreur chargement dashboard utilisateur', err);
      setPageLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bonjour' :
    hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (pageLoading) {
    return null; // Le GlobalLoader s'affiche via le provider
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing page */}
      <Header />

      {/* Contenu principal avec padding pour ne pas être sous la navbar fixe */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto animate-fade-up space-y-10">
        {/* En-tête personnalisé */}
        <PageHeader
          title={`${greeting}, ${profile?.firstName || 'utilisateur'}`}
          subtitle={new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        />

        {/* Statut abonnement */}
        <Card className="overflow-hidden border-[#C4922A]/20 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 bg-linear-to-r from-[#C4922A]/5 to-[#FAFAF8]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0F0D0A]">
                  {subscription
                    ? `Vous êtes abonné : ${subscription.planName}`
                    : 'Découvrez les contenus premium'}
                </h2>
                <p className="text-sm text-[#8B7355] mt-1">
                  {subscription
                    ? `Valable jusqu’au ${new Date(subscription.endDate).toLocaleDateString('fr-FR')}`
                    : 'Accédez à des ressources exclusives et un accompagnement personnalisé'}
                </p>
              </div>
              {!subscription && (
                <Link href="/abonnements">
                  <Button className="bg-[#C4922A] hover:bg-[#A07520]">
                    S’abonner maintenant
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Cartes d’activité - plus attractives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/chat">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-[#D4C9B8]/60">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-lg mb-1">Conversations</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Échangez avec un professionnel
                </p>
                {unreadMessages > 0 && (
                  <Badge variant="blue">{unreadMessages} non lus</Badge>
                )}
              </div>
            </Card>
          </Link>

          <Link href="/resources">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-[#D4C9B8]/60">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-medium text-lg mb-1">Ressources</h3>
                <p className="text-sm text-muted-foreground">
                  Articles, audios, vidéos
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/tests">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-[#D4C9B8]/60">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-medium text-lg mb-1">Tests & Évaluations</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-évaluation et supervisés
                </p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Continuer votre parcours (ressources récentes) */}
        <Card className="border-[#D4C9B8]/60">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#0F0D0A]">
                Continuer votre parcours
              </h3>
              <Link href="/resources">
                <Button variant="ghost" size="sm" className="text-[#C4922A]">
                  Voir toutes les ressources
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* À activer quand ResourceService sera prêt */}
            {/* {recentResources.length === 0 ? ( */}
            <Empty
              title="Aucune ressource récente"
              description="Commencez votre exploration dès maintenant."
            //   icon={<BookOpen className="h-12 w-12 text-[#C4922A]/50" />}
            />
            {/* ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentResources.map(resource => ( ... ))}
              </div>
            )} */}
          </div>
        </Card>

        {/* Accès rapides supplémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/events">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-[#D4C9B8]/60">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-medium text-lg mb-1">Ateliers & Événements</h3>
                <p className="text-sm text-muted-foreground">
                  Sessions en ligne et en présentiel
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/abonnements">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-[#D4C9B8]/60">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#C4922A]/10 flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-[#C4922A]" />
                </div>
                <h3 className="font-medium text-lg mb-1">Mon abonnement</h3>
                <p className="text-sm text-muted-foreground">
                  {subscription ? 'Gérer mon plan' : 'Découvrir les offres'}
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-[#D4C9B8]/60">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <UserCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-lg mb-1">Mon profil</h3>
                <p className="text-sm text-muted-foreground">
                  Modifier vos informations
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}