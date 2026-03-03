'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { SubscriptionService } from '@/services/subscription.service';
import { ResourceService } from '@/services/resource.service';
import { ChatService } from '@/services/chat.service';
import { PageHeader, Card, Badge, Button, StatCard, Empty } from '@/components/ui';
import Link from 'next/link';
import { BookOpen, MessageSquare, Activity, Award, ChevronRight } from 'lucide-react';

export default function UserDashboard() {
    const { profile } = useAuth();
    const router = useRouter();

    const [subscription, setSubscription] = useState<any>(null);
    const [recentResources, setRecentResources] = useState<any[]>([]);
    const [unreadMessages, setUnreadMessages] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loading) return;
        if (!profile) {
            router.replace('/login');
            return;
        }

        loadDashboardData();
    }, [profile, loading, router]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Statut abonnement
            const activeSub = await SubscriptionService.getActive(profile!.$id);
            setSubscription(activeSub);

            // 2. Dernières ressources consultées (exemple)
            //   const resources = await ResourceService.listRecentForUser(profile!.$id, 3);
            //   setRecentResources(resources || []);

            // 3. Messages non lus
            const unread = await ChatService.getUnreadCount(profile!.$id);
            setUnreadMessages(unread || 0);
        } catch (err) {
            console.error('Erreur chargement dashboard utilisateur', err);
        } finally {
            setLoading(false);
        }
    };

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Bonjour' :
            hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Chargement de votre espace...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-up space-y-8">
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
            <Card className="overflow-hidden">
                <div className="p-6 bg-linear-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {subscription
                                    ? `Vous êtes abonné : ${subscription.planName}`
                                    : 'Découvrez les contenus premium'}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {subscription
                                    ? `Valable jusqu’au ${new Date(subscription.endDate).toLocaleDateString('fr-FR')}`
                                    : 'Accédez à des ressources exclusives et un accompagnement personnalisé'}
                            </p>
                        </div>
                        {!subscription && (
                            <Link href="/abonnements">
                                <Button>S’abonner maintenant</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </Card>

            {/* Cartes d’activité */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Messages non lus"
                    value={unreadMessages}
                    icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
                    delta={unreadMessages > 0 ? 'Nouveaux messages' : undefined}
                />
                <StatCard
                    label="Ressources consultées"
                    value={recentResources.length}
                    icon={<BookOpen className="h-6 w-6 text-green-600" />}
                />
                <StatCard
                    label="Tests réalisés"
                    value="—" // À connecter plus tard
                    icon={<Activity className="h-6 w-6 text-purple-600" />}
                />
            </div>

            {/* Dernières ressources vues */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Continuer votre parcours</h3>
                        <Link href="/resources">
                            <Button variant="ghost" size="sm">
                                Voir toutes les ressources
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    {recentResources.length === 0 ? (
                        <Empty
                            title="Aucune ressource récente"
                            description="Commencez votre exploration dès maintenant."
                        //   icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {recentResources.map(resource => (
                                <Card key={resource.$id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-4">
                                        <Badge variant="orange" className="mb-2">
                                            {resource.type}
                                        </Badge>
                                        <h4 className="font-medium line-clamp-2">{resource.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {resource.description}
                                        </p>
                                        <Button variant="primary" className="mt-2 p-0">
                                            <Link href={`/resources/${resource.$id}`}>
                                                Continuer
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Accès rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/resources">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="p-6 text-center">
                            <BookOpen className="h-8 w-8 mx-auto text-primary mb-3" />
                            <h3 className="font-medium">Ressources</h3>
                            <p className="text-sm text-muted-foreground">Articles, audios, vidéos</p>
                        </div>
                    </Card>
                </Link>

                <Link href="/tests">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="p-6 text-center">
                            <Activity className="h-8 w-8 mx-auto text-green-600 mb-3" />
                            <h3 className="font-medium">Tests & Évaluations</h3>
                            <p className="text-sm text-muted-foreground">Auto-évaluation et supervisés</p>
                        </div>
                    </Card>
                </Link>

                <Link href="/chat">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                        <div className="p-6 text-center">
                            <MessageSquare className="h-8 w-8 mx-auto text-blue-600 mb-3" />
                            <h3 className="font-medium">Conversations</h3>
                            <p className="text-sm text-muted-foreground">Échangez avec un professionnel</p>
                            {unreadMessages > 0 && (
                                <Badge variant="gray" className="absolute top-4 right-4">
                                    {unreadMessages}
                                </Badge>
                            )}
                        </div>
                    </Card>
                </Link>

                <Link href="/abonnements">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="p-6 text-center">
                            <Award className="h-8 w-8 mx-auto text-amber-600 mb-3" />
                            <h3 className="font-medium">Mon abonnement</h3>
                            <p className="text-sm text-muted-foreground">
                                {subscription ? 'Gérer mon plan' : 'Découvrir les offres'}
                            </p>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}