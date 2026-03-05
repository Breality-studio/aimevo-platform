'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { ChatService } from '@/services/chat.service';
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Badge, Input, Empty } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link';
import { MessageSquare, Search, ChevronRight } from 'lucide-react';

export default function ChatList() {
  const { profile } = useAuth();
  const { setLoading } = useLoading();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadConversations();
  }, [profile, router]);

  const loadConversations = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement de vos conversations...');

    try {
      const convs = await ChatService.listConversations(profile!.$id, 'member');
      setConversations(convs);
      setFiltered(convs);
    } catch (err) {
      console.error('Erreur chargement conversations', err);
      setConversations([]);
      setFiltered([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFiltered(conversations);
      return;
    }

    const results = conversations.filter(conv =>
      conv.proName?.toLowerCase().includes(term) ||
      conv.lastMessagePreview?.toLowerCase().includes(term)
    );

    setFiltered(results);
  }, [search, conversations]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing page */}
      <Header />

      {/* Contenu principal */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-5xl mx-auto animate-fade-up space-y-10">
        {/* En-tête */}
        <PageHeader
          title="Mes Conversations"
          subtitle="Échanges avec les professionnels de bien-être"
        />

        {/* Barre de recherche */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un professionnel ou un message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 py-6 text-lg rounded-full border-[#D4C9B8]/60 shadow-sm focus:border-[#C4922A] focus:ring-[#C4922A]/20"
          />
        </div>

        {/* Liste des conversations */}
        <Card className="overflow-hidden border-[#D4C9B8]/60 shadow-sm">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty
              title={search ? "Aucune conversation trouvée" : "Aucune conversation active"}
              description={
                search
                  ? "Essayez avec un autre terme de recherche."
                  : "Commencez une nouvelle conversation avec un professionnel."
              }
              icon={<MessageSquare className="h-12 w-12 text-[#C4922A]/50" />}
            />
          ) : (
            <div className="divide-y divide-[#D4C9B8]/30">
              {filtered.map(conv => (
                <Link
                  key={conv.$id}
                  href={`/chat/${conv.$id}`}
                  className="flex items-center gap-5 px-6 py-5 hover:bg-[#FFF8E1]/30 transition-all duration-200 group"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-[#C4922A]/10 flex items-center justify-center text-[#C4922A] font-medium text-xl">
                      {conv.proName?.slice(0, 2).toUpperCase() || '?'}
                    </div>
                    {(conv.memberUnread || 0) > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 min-w-[1.5rem] h-6 px-2 text-sm font-bold"
                      >
                        {conv.memberUnread}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium text-lg truncate group-hover:text-[#C4922A] transition-colors">
                        {conv.proName || 'Professionnel'}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.lastMessagePreview || 'Aucun message'}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}