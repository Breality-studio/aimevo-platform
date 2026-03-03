'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionService } from '@/services/subscription.service';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import Link from 'next/link';
import { User, Calendar, MessageSquare, BookOpen, Settings, LogOut, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function MonEspacePage() {
    const { user, profile, logout } = useAuth();

    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;

        const load = async () => {
            setLoading(true);
            try {
                const sub = await SubscriptionService.getActive(profile.$id);
                setSubscription(sub);
            } catch (err) {
                console.error('Erreur chargement abonnement', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [profile]);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Mon espace"
                subtitle={`Bienvenue, ${profile?.firstName || 'utilisateur'}`}
            />

            {/* Carte profil rapide */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="h-24 w-24">
                        {/* <AvatarImage src={profile?.avatarUrl} alt={profile?.firstName} /> */}
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {profile?.firstName?.[0]?.toUpperCase()}
                            {profile?.lastName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                        <h2 className="text-2xl font-semibold">
                            {profile?.firstName} {profile?.lastName}
                        </h2>
                        <p className="text-muted-foreground">{user?.email}</p>

                        {subscription ? (
                            <Badge variant="stone" className="mt-2">
                                Abonné – {subscription.planName}
                            </Badge>
                        ) : (
                            <Badge variant="orange" className="mt-2">
                                Compte gratuit
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                        <Button variant="primary">
                            <Link href="/mon-espace/profil">
                                Modifier mon profil
                            </Link>
                        </Button>
                        <Button variant="secondary" className="text-destructive" onClick={logout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Déconnexion
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Sections rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/resources">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="p-6 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-medium text-lg">Ressources</h3>
                            <p className="text-sm text-muted-foreground">
                                Articles, audios, vidéos pour votre bien-être
                            </p>
                        </div>
                    </Card>
                </Link>

                <Link href="/chat">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full relative">
                        <div className="p-6 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <MessageSquare className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-medium text-lg">Conversations</h3>
                            <p className="text-sm text-muted-foreground">
                                Échangez avec un professionnel
                            </p>
                        </div>
                    </Card>
                </Link>

                <Link href="/tests">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <div className="p-6 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <Activity className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-medium text-lg">Tests & Évaluations</h3>
                            <p className="text-sm text-muted-foreground">
                                Auto-évaluation et suivi personnalisé
                            </p>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Statut abonnement détaillé */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Mon abonnement</h3>

                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    ) : subscription ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{subscription.planName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Actif depuis le {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <Badge variant="orange">
                                    Expire le {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                                </Badge>
                            </div>
                            <Button variant="secondary">
                                <Link href="/abonnements">Gérer mon abonnement</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 py-6">
                            <p className="text-muted-foreground">
                                Vous n’avez pas encore d’abonnement actif.
                            </p>
                            <Button>
                                <Link href="/abonnements">Découvrir les offres</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}