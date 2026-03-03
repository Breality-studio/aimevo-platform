'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Globe, LogOut, UserCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function LandingPage() {
  const { loading, isLoggedIn, profile, role, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Skeleton className="h-12 w-64 rounded-lg" />
      </div>
    );
  }

  const currentRole = role;
  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 18 ? 'Bonjour' : 'Bonsoir';
  };

  const handleLogout = async () => await logout();

  const plans = [
    {
      name: 'Pack Individuel',
      price: '2 000',
      features: ['Accès aux ressources audio/vidéo', 'Tests d\'auto-évaluation', 'Bibliothèque articles'],
      cta: 'Télécharger l\'app',
    },
    {
      name: 'Pack Entreprise',
      price: '15 000',
      features: ['Jusqu\'à 50 membres', 'Dashboard RH', 'Tests supervisés', 'Support prioritaire'],
      cta: 'Contacter les ventes',
      highlight: true,
    },
    {
      name: 'Pack ONG',
      price: '8 000',
      features: ['Jusqu\'à 200 membres', 'Tarif solidaire', 'Ressources en langues locales', 'Formation équipe'],
      cta: 'Contacter les ventes',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAFAF8]/90 backdrop-blur-sm border-b border-[#D4C9B8]/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-[#0F0D0A]">
            AÏ<span className="text-[#C4922A]">MEVO</span>
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#plans"
              className="text-sm text-[#8B7355] hover:text-[#0F0D0A] transition-colors"
            >
              Tarifs
            </a>
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 p-0 h-auto"
                  >
                    <Avatar className="h-8 w-8">
                      {/* <AvatarImage src={profile?.avatarUrl} /> */}
                      <AvatarFallback>
                        {profile?.firstName?.[0] ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-[#0F0D0A]">
                      {getGreeting()}, {profile?.firstName ?? 'Utilisateur'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        role === 'admin'
                          ? '/admin/dashboard'
                          : role === 'professional'
                          ? '/pro/dashboard'
                          : '/dashboard'
                      }
                      className="flex items-center gap-2"
                    >
                      <UserCircle className="h-4 w-4" />
                      Mon espace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#0F0D0A] hover:text-[#C4922A] transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-[#C4922A] text-white text-sm font-medium rounded-lg hover:bg-[#A07520] transition-colors"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C4922A]/10 border border-[#C4922A]/20 text-xs font-medium text-[#C4922A] mb-8">
            ✦ Psychologie mindful africaine
          </div>
          <h1 className="font-display text-6xl md:text-7xl font-light text-[#0F0D0A] leading-[1.1] mb-6">
            Le bien-être mental<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #A07520, #C4922A, #E8C46A, #C4922A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ancré dans votre culture
            </span>
          </h1>
          <p className="text-lg text-[#8B7355] max-w-2xl mx-auto mb-10 leading-relaxed">
            AÏMEVO réconcilie la sagesse africaine et la psychologie moderne pour offrir un accompagnement authentique, dans vos langues, à votre rythme.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 bg-[#C4922A] text-white font-medium rounded-xl hover:bg-[#A07520] transition-all text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Commencer gratuitement
            </Link>
            <a
              href="#plans"
              className="px-6 py-3 border border-[#D4C9B8] text-[#0F0D0A] font-medium rounded-xl hover:border-[#8B7355] transition-all text-sm"
            >
              Voir les tarifs
            </a>
          </div>
          <p className="text-xs text-[#B5A48A] mt-5">Disponible sur iOS & Android · Français, Fon, Goun, Mina</p>
        </div>
      </section>

      {/* À Propos */}
      <section id="about" className="py-20 px-6 bg-[#F0EDE6]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-light text-[#0F0D0A] text-center mb-12">À Propos d’AÏMEVO</h2>
          <div className="prose prose-lg max-w-none text-[#0F0D0A] leading-relaxed space-y-6">
            <p>
              AÏMEVO est née d’une conviction profonde : la santé mentale ne peut être universelle sans être profondément ancrée dans la culture de chacun. En Afrique de l’Ouest, et particulièrement au Bénin, les savoirs traditionnels, les proverbes, les rituels communautaires et la philosophie Ubuntu offrent des clés puissantes pour comprendre et apaiser l’esprit.
            </p>
            <p>
              Nous avons créé une plateforme qui réunit psychologie clinique moderne et sagesses africaines, avec des ressources disponibles en français, fon, goun et mina. Notre ambition est simple : rendre l’accompagnement psychologique accessible, respectueux des réalités culturelles et financièrement inclusif.
            </p>
            <p>
              Que vous cherchiez à mieux vous connaître, à surmonter un moment difficile ou à accompagner vos proches, AÏMEVO est là pour vous, avec bienveillance et authenticité.
            </p>
          </div>
        </div>
      </section>

      {/* Ce que nous apportons */}
      <section id="what-we-bring" className="py-20 px-6 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-light text-[#0F0D0A] text-center mb-12">Ce que nous apportons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-[#D4C9B8]/60 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-full bg-[#C4922A]/10 flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 text-[#C4922A]" />
                </div>
                <CardTitle className="text-xl">Approche culturelle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#020101]">
                  Nos contenus et accompagnements intègrent proverbes, rituels et philosophies africaines pour un bien-être qui vous ressemble.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-[#D4C9B8]/60 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-full bg-[#C4922A]/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-[#C4922A]" />
                </div>
                <CardTitle className="text-xl">Accompagnement humain</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B7355]">
                  Chat E2EE sécurisé avec des professionnels formés et vérifiés, dans le respect de votre intimité.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-[#D4C9B8]/60 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-full bg-[#C4922A]/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-[#C4922A]" />
                </div>
                <CardTitle className="text-xl">Ressources accessibles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B7355]">
                  Bibliothèque riche en audios, vidéos et articles dans vos langues maternelles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Notre équipe */}
      <section id="team" className="py-20 px-6 bg-[#F0EDE6]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-light text-[#0F0D0A] text-center mb-12">Notre équipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Dr. Adjoa Lokossou', role: 'Psychologue clinicienne', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Koffi Mensah', role: 'Animateur culturel', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Yawa Agbodjinou', role: 'Spécialiste mindfulness', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Sègla Houndé', role: 'Développeur & Designer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
            ].map((member) => (
              <Card key={member.name} className="text-center border-[#D4C9B8]/60 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-lg">{member.name}</h3>
                  <p className="text-sm text-[#8B7355]">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nos activités */}
      <section id="activities" className="py-20 px-6 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-light text-[#0F0D0A] text-center mb-12">Nos activités</h2>
          <div className="prose prose-lg max-w-none text-[#0F0D0A] leading-relaxed space-y-6">
            <p>
              Nous organisons régulièrement des ateliers en présentiel et en ligne, des cercles de parole communautaires, des formations pour entreprises et ONG, ainsi que des événements saisonniers (Journée mondiale de la santé mentale, rituels de pleine conscience inspirés des traditions locales).
            </p>
            <p>
              Chaque activité est conçue pour être inclusive, accessible financièrement et profondément respectueuse des valeurs culturelles africaines.
            </p>
          </div>
        </div>
      </section>

      {/* Nos tests avec approches africaines */}
      <section id="tests" className="py-20 px-6 bg-[#F0EDE6]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-light text-[#0F0D0A] text-center mb-12">Nos tests avec approches africaines</h2>
          <div className="prose prose-lg max-w-none text-[#0F0D0A] leading-relaxed space-y-6">
            <p>
              Nos évaluations psychologiques ne sont pas de simples questionnaires importés. Elles intègrent des éléments de la sagesse africaine :
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>Questions inspirées de proverbes béninois et ouest-africains</li>
              <li>Échelles de bien-être communautaire (Ubuntu, solidarité)</li>
              <li>Approche holistique : corps, esprit, ancêtres, environnement</li>
              <li>Tests disponibles en français, fon, goun et mina</li>
              <li>Interprétation contextualisée par des professionnels formés localement</li>
            </ul>
            <p>
              Que ce soit pour évaluer le stress, l’anxiété, la résilience ou le bien-être global, nos outils respectent votre histoire et votre culture.
            </p>
          </div>
        </div>
      </section>

      {/* Applications mobiles */}
      <section id="apps" className="py-20 px-6 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-4xl font-light text-[#0F0D0A] mb-12">Applications mobiles</h2>
          <p className="text-lg text-[#8B7355] mb-10">
            Emportez AÏMEVO partout avec vous. Accédez à vos ressources, vos tests et vos conversations même hors connexion.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <Image
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Mockup iPhone AÏMEVO"
                width={400}
                height={800}
                className="mx-auto shadow-2xl rounded-3xl"
              />
              <p className="mt-6 text-sm text-muted-foreground">iOS App</p>
            </div>
            <div>
              <Image
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Mockup Android AÏMEVO"
                width={400}
                height={800}
                className="mx-auto shadow-2xl rounded-3xl"
              />
              <p className="mt-6 text-sm text-muted-foreground">Android App</p>
            </div>
          </div>
          <div className="mt-12 space-x-4">
            <Button size="lg">App Store</Button>
            <Button size="lg" variant="outline">Google Play</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F0D0A] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-medium mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:underline">Accueil</Link></li>
              <li><Link href="#about" className="hover:underline">À Propos</Link></li>
              <li><Link href="#activities" className="hover:underline">Activités</Link></li>
              <li><Link href="#tests" className="hover:underline">Tests</Link></li>
              <li><Link href="#apps" className="hover:underline">Applications</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Réseaux sociaux</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://facebook.com" className="hover:underline">Facebook</a></li>
              <li><a href="https://twitter.com" className="hover:underline">Twitter</a></li>
              <li><a href="https://instagram.com" className="hover:underline">Instagram</a></li>
              <li><a href="https://linkedin.com" className="hover:underline">LinkedIn</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:underline">Conditions d'utilisation</Link></li>
              <li><Link href="/privacy" className="hover:underline">Politique de confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <p className="text-center text-sm mt-12 opacity-70">
          © {new Date().getFullYear()} AÏMEVO. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}