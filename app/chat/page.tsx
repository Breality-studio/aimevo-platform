'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChatService } from '@/services/chat.service';
import { PageHeader, Card, Badge, Input, Empty } from '@/components/ui';
import Link from 'next/link';
import { MessageSquare, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatList() {
  const { profile } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      router.replace('/login');
      return;
    }

    loadConversations();
  }, [profile, router]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convs = await ChatService.listConversations(profile!.$id, 'member');
      setConversations(convs);
      setFiltered(convs);
    } catch (err) {
      console.error('Erreur chargement conversations', err);
      setConversations([]);
      setFiltered([]);
    } finally {
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
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mes Conversations"
        subtitle="Échanges avec les professionnels de bien-être"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un professionnel ou un message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
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
            //   icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(conv => (
                <Link
                  key={conv.$id}
                  href={`/chat/${conv.$id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium relative">
                    {conv.proName?.slice(0, 2).toUpperCase() || '?'}
                    {(conv.memberUnread || 0) > 0 && (
                      <Badge
                        variant="red"
                        className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 text-xs"
                      >
                        {conv.memberUnread}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
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

                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessagePreview || 'Aucun message'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}