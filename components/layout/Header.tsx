'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, UserCircle } from 'lucide-react';

interface LinkType {
  href: string;
  label: string;
}

export function Header() {
  const { profile, logout } = useAuth();

  //   if (isLoading) {
  //     return <div className="h-16 bg-background border-b" />; 
  //   }

  const isLoggedIn = !!profile;

  // Liens publics (non-connecté)
  const publicLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/about', label: 'À Propos' },
    { href: '/activities', label: 'Nos Activités' },
    { href: '/tests', label: 'Tests' },
    { href: '/apps', label: 'Apps Mobiles' },
  ];

  // Liens par rôle (connecté)
  let privateLinks: LinkType[] = [];
  
  if (isLoggedIn) {
    if (profile.role === 'admin') {
      privateLinks = [
        { href: '/admin/dashboard', label: 'Dashboard Admin' },
        { href: '/admin/users', label: 'Utilisateurs' },
        { href: '/admin/resources', label: 'Ressources' },
        { href: '/admin/tests', label: 'Tests' },
        { href: '/admin/events', label: 'Events' },
        { href: '/admin/conversations', label: 'Conversations' },
        { href: '/admin/subscriptions', label: 'Subscriptions' },
        { href: '/admin/settings', label: 'Settings' },
      ];
    } else if (profile.role === 'professional') {
      privateLinks = [
        { href: '/pro/dashboard', label: 'Dashboard Pro' },
        { href: '/pro/conversations', label: 'Conversations' },
        { href: '/pro/tests', label: 'Tests Supervisés' },
        { href: '/pro/availability', label: 'Disponibilités' },
        { href: '/pro/profile', label: 'Profil' },
      ];
    } else { // member (utilisateur standard) – accès à tout
      privateLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/resources', label: 'Ressources' },
        { href: '/tests', label: 'Tests' },
        { href: '/chat', label: 'Chat' },
        { href: '/events', label: 'Events' },
        { href: '/abonnements', label: 'Abonnements' },
        { href: '/profile', label: 'Profil' },
      ];
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">AÏMEVO</span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {isLoggedIn
            ? privateLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))
            : publicLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Actions + Profil */}
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          ) : (
            <>
              <Avatar className="h-8 w-8 cursor-pointer">
                {/* <AvatarImage src={profile.avatarUrl} /> */}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </>
          )}

          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col space-y-4 mt-8">
                {(isLoggedIn ? privateLinks : publicLinks).map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}