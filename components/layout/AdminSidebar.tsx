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
  Users,
  BookOpen,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  CreditCard,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  BadgeDollarSign,
  MessageCircle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/resources', label: 'Ressources & Formations', icon: BookOpen },
  { href: '/admin/tests', label: 'Tests & Évaluations', icon: ClipboardList },
  { href: '/admin/events', label: 'Ateliers & Événements', icon: CalendarDays },
  { href: '/admin/conversations', label: 'Conversations & Hotline', icon: MessageCircle },
];

const financeNavItems: NavItem[] = [
  { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
  { href: '/admin/payments', label: 'Paiements & Transactions', icon: BadgeDollarSign},
];

const systemNavItems: NavItem[] = [
  { href: '/admin/audit', label: 'Logs d’audit', icon: FileText },
  { href: '/admin/stats', label: 'Statistiques avancées', icon: BarChart3 },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings, disabled: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <TooltipProvider>
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r lg:border-border lg:bg-background lg:shrink-0 lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        {/* Header / Logo */}
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              AÏ<span className="text-primary">MEVO</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            Espace Administration
          </p>
        </div>

        {/* Navigation principale */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-6">
            {/* Section principale */}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive(item.href) ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3 text-left',
                          isActive(item.href) && 'bg-secondary text-secondary-foreground font-medium',
                          item.disabled && 'opacity-50 pointer-events-none'
                        )}
                        disabled={item.disabled}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {item.disabled && (
                    <TooltipContent side="right">
                      Bientôt disponible
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>

            <Separator />

            {/* Section Finances */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Monétisation
              </p>
              {financeNavItems.map((item) => (
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
            </div>

            <Separator />

            {/* Section Système */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Système
              </p>
              {systemNavItems.map((item) => (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive(item.href) ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3',
                          isActive(item.href) && 'bg-secondary text-secondary-foreground font-medium',
                          item.disabled && 'opacity-50 pointer-events-none'
                        )}
                        disabled={item.disabled}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {item.disabled && (
                    <TooltipContent side="right">
                      En cours de développement
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </nav>
        </div>

        {/* Footer – Profil + Déconnexion */}
        <div className="border-t p-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border">
              {/* <AvatarImage src={profile?.avatar} alt={profile?.firstName} /> */}
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {profile?.firstName} {profile?.lastName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Administrateur</p>
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