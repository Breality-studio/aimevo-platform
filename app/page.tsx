'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import Mockup from "@/public/app_mokup_2.png";
import Picture1 from "@/public/img1.png";
import Picture2 from "@/public/img2.png";

export default function LandingPage() {
  const { loading, isLoggedIn, profile, role, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Skeleton className="h-12 w-64 rounded-lg" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 18 ? 'Bonjour' : 'Bonsoir';
  };

  const handleLogout = async () => await logout();

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15 }
    }
  };

  const plans = [{
    name: 'Pack Individuel',
    price: '2 000',
    features: [
      'Accès aux ressources audio/vidéo',
      'Tests d\'auto-évaluation', 'Bibliothèque articles'
    ], cta: 'Télécharger l\'app',
  }, {
    name: 'Pack Entreprise',
    price: '15 000',
    features: [
      'Jusqu\'à 50 membres',
      'Dashboard RH',
      'Tests supervisés',
      'Support prioritaire'
    ], cta: 'Contacter les ventes', highlight: true,
  }, { name: 'Pack ONG', price: '8 000', features: ['Jusqu\'à 200 membres', 'Tarif solidaire', 'Ressources en langues locales', 'Formation équipe'], cta: 'Contacter les ventes', },];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0F0D0A]">

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAFAF8]/90 backdrop-blur-sm border-b border-[#E5DED1]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-semibold">
            AÏ<span className="text-[#C4922A]">MEVO</span>
          </span>

          <div className="flex items-center gap-6">
            <a href="#plans" className="text-sm text-[#6F6253] hover:text-[#0F0D0A]">
              Tarifs
            </a>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {profile?.firstName?.[0] ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {getGreeting()}, {profile?.firstName ?? 'Utilisateur'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Mon espace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-[#C4922A]">
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#C4922A] text-white text-sm font-medium rounded-xl hover:bg-[#A07520] transition"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-32 px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C4922A]/10 border border-[#C4922A]/20 text-xs font-medium text-[#C4922A] mb-8">
            ✦ Psychologie mindful africaine
          </div>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8 }}
            className="font-display text-6xl md:text-7xl font-light leading-[1.1] mb-6"
          >
            Le bien-être mental<br />
            <span className="text-[#C4922A]">
              ancré dans votre culture
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.8 }}
            className="text-lg text-[#6F6253] mb-10"
          >
            AÏMEVO réconcilie la sagesse africaine et la psychologie moderne
            pour un accompagnement authentique et accessible.
          </motion.p>

          <motion.div variants={fadeUp} className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#C4922A] text-white rounded-xl hover:bg-[#A07520] transition"
            >
              Commencer gratuitement
            </Link>
            <a
              href="#plans"
              className="px-6 py-3 border border-[#E5DED1] rounded-xl hover:border-[#C4922A] transition"
            >
              Voir les tarifs
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* A PROPOS */}
      <section className="py-10 px-6 bg-[#F3EFE7]">
        <h1 className="font-display mb-10 text-4xl font-light uppercase text-[#0F0D0A] text-center">A Propos d’AÏMEVO</h1>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-[#C4922A] text-4xl font-semibold mb-6">
              Une approche enracinée
            </h2>
            <p className="text-[#6F6253] leading-relaxed mb-4">
              AÏMEVO est née d’une conviction profonde :
              la santé mentale ne peut être universelle sans être profondément ancrée
              dans la culture de chacun. En Afrique de l’Ouest, et particulièrement au
              Bénin, les savoirs traditionnels, les proverbes, les rituels communautaires
              et la philosophie Ubuntu offrent des clés puissantes pour comprendre
              et apaiser l’esprit.
            </p>
            <p className="text-[#6F6253] leading-relaxed">
              Nous avons créé une plateforme qui réunit psychologie clinique moderne et
              sagesses africaines. Notre ambition est simple : <strong className='text-[#C4922A]'>Rendre l’Accompagnement
                Psychologique Accessible</strong>,  <strong className='text-[#C4922A]'>respectueux des réalités culturelles</strong> et
              financièrement inclusif.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={Picture2}
              alt="Masque africain"
              width={450}
              height={400}
            />
          </motion.div>
        </div>
      </section>

      {/* CE QUE NOUS APPORTONS */}
      <section id="what-we-bring" className="py-20 px-6 bg-[#0F0D0A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-light text-white mb-3">Tout ce dont vous avez besoin</h2>
            <p className="text-[#8B7355]">Une plateforme complète pour votre bien-être mental</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '◉',
                title: "Tests d'évaluation",
                desc: "Évaluations auto et supervisées par des professionnels qualifiés pour mieux comprendre votre état psychologique."
              },
              {
                icon: '◎',
                title: "Chat E2EE",
                desc: "Conversations privées chiffrées de bout en bout avec des professionnels de santé mentale vérifiés."
              }, {
                icon: '◈',
                title: "Ressources culturelles",
                desc: "Bibliothèque audio, vidéo et articles ancrés dans la culture africaine."
              }].map(f => (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  key={f.title}
                  className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all group">
                  <div className="text-2xl text-[#C4922A] mb-4 group-hover:scale-110 transition-transform inline-block">
                    {f.icon}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#8B7355] leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>))}
          </div>
        </div>
      </section>

      {/* ACTIVITES */}
      <section className="py-24 px-6 bg-[#F3EFE7]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display mb-10 text-4xl font-light uppercase text-[#0F0D0A] text-center">
              Nos activités
            </h2>
            <p className="text-[#6F6253] leading-relaxed mb-4">
              Nous organisons régulièrement des ateliers en présentiel et en ligne,
              des cercles de parole communautaires, des formations pour entreprises
              et ONG, ainsi que des événements saisonniers (Journée mondiale de la santé mentale,
              rituels de pleine conscience inspirés des traditions locales).
            </p>
            <p className="text-[#6F6253] leading-relaxed">
              Chaque activité est inclusive, accessible et respectueuse des valeurs africaines.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={Picture1}
              alt="Illustration méditation"
              width={450}
              height={400}
            />
          </motion.div>
        </div>
      </section>

      {/* Notre équipe */}
      <section id="team" className="py-20 px-6 bg-[#1c1c1b]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl font-light text-[#F3EFE7] text-center mb-12">
            Notre équipe
          </h2>
          <div className="grid grid-cols-1 justify-center items-center sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Jeremine DEGBO', role: 'Animatrice Culturel', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Ange-Marie DATINON', role: 'Psychologue clinicien', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Amelée AGBOKOU', role: 'Spécialiste mindfulness', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Rosius HOUNTON', role: 'Community Manager', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
              { name: 'Espérance Bill', role: 'Développeur & Designer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
            ].map((member) => (
              <div key={member.name} className="text-center border-[#D4C9B8]/60 hover:shadow-lg transition-shadow">
                <div className="relative w-32 h-32 mx-auto mb-4 border-[#D4C9B8]/60 hover:shadow-lg transition-shadow overflow-hidden rounded-full">
                  <Image src={member.image}
                    alt={`${member.name} ${member.role}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-medium text-lg text-[#C4922A]">{member.name}</h3>
                <p className="text-sm text-[#8B7355]">{member.role}</p>
              </div>))}
          </div>
        </div>
      </section>

      {/* PLANS & TARIFS */}
      <section id="plans" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-light text-[#0F0D0A] mb-3">Nos plans</h2>
            <p className="text-[#8B7355]">
              Des offres adaptées à chaque besoin, à partir de 2 000 XOF/mois
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg ${p.highlight ? 'bg-[#0F0D0A] border-[#C4922A]/40' : 'bg-white border-[#D4C9B8]/60'}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${p.highlight ? 'text-[#C4922A]' : 'text-[#8B7355]'}`}>
                  {p.name}
                </p>

                <p className={`font-display text-4xl font-light mb-1 ${p.highlight ? 'text-white' : 'text-[#0F0D0A]'}`}>
                  {p.price}
                  <span className={`text-base ${p.highlight ? 'text-[#8B7355]' : 'text-[#8B7355]'}`}>
                    {' '} XOF
                  </span>
                </p>

                <p
                  className={`text-xs mb-6 ${p.highlight ? 'text-[#8B7355]' : 'text-[#B5A48A]'}`}
                >
                  par mois
                </p>

                <ul className="space-y-2.5 mb-8">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-[#D4C9B8]' : 'text-[#8B7355]'
                        }`}
                    >
                      <span className="text-[#C4922A] mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-all ${p.highlight
                    ? 'bg-[#C4922A] text-white hover:bg-[#A07520]'
                    : 'border border-[#D4C9B8] text-[#0F0D0A] hover:border-[#C4922A]'
                    }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* APPLICATION MOBILE */}
      <section className="py-24 px-6 bg-[#F3EFE7]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-4xl text-[#C4922A] font-semibold mb-6">
              Emportez AÏMEVO partout
            </h2>
            <p className="text-[#6F6253] leading-relaxed mb-8">
              AÏMEVO mobile est une application dédiée au bien-être mental et émotionnel,
              conçue pour accompagner chacun au quotidien. À travers une pensée inspirante chaque jour,
              des contenus audio apaisants, des espaces d’échange, des auto-évaluations et des ateliers pratiques,
              elle offre des outils concrets pour mieux gérer le stress,
              comprendre ses émotions et cultiver un équilibre intérieur durable.
              Accessible, intuitive et bienveillante.
            </p>
            <Button className="bg-[#C4922A] text-white hover:bg-[#A07520]">
              Télécharger maintenant
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={Mockup}
              alt="Mockup application Aïmevo"
              className="rounded-3xl shadow-xl"
            />
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
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