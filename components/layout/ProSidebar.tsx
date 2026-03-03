'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Users,
  ClipboardList,
  BookOpen,
  LogOut,
  Clock,
} from 'lucide-react';

const proNavItems = [
  { href: '/pro/dashboard',        label: 'Tableau de bord',      icon: LayoutDashboard },
  { href: '/pro/agenda',           label: 'Mon agenda',           icon: CalendarDays },
  { href: '/pro/availability',     label: 'Disponibilités',       icon: Clock },
  { href: '/pro/conversations',    label: 'Conversations',        icon: MessageSquare },
  { href: '/pro/requests',         label: 'Demandes en attente',  icon: Users },
  { href: '/pro/tests-pending',    label: 'Tests à corriger',     icon: ClipboardList },
  { href: '/pro/resources',        label: 'Mes contenus',         icon: BookOpen },
];

export function ProSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <TooltipProvider>
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r lg:border-border lg:bg-background lg:shrink-0 lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              AÏ<span className="text-primary">MEVO</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            Espace Professionnel
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <nav className="space-y-1">
            {proNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive(item.href) && 'bg-secondary text-secondary-foreground font-medium'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer profil + déconnexion */}
        <div className="border-t p-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border">
              {/* <AvatarImage src={profile?.avatarUrl} alt={profile?.firstName} /> */}
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                Dr. {profile?.lastName || 'Professionnel'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Psychologue / Animateur</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}