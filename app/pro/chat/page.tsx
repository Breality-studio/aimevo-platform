'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChatService } from '@/services/chat.service';
import { PageHeader, Card, Badge, Button, Input, Empty } from '@/components/ui';
import Link from 'next/link';
import { MessageSquare, Clock, User } from 'lucide-react';

export default function ProChatList() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile || profile.role !== 'professional') {
      router.replace('/dashboard');
      return;
    }

    loadConversations();
  }, [profile]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convs = await ChatService.listActiveForPro(profile!.$id);
      setConversations(convs);
    } catch (err) {
      console.error('Erreur chargement conversations', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter(conv =>
    conv.memberName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Conversations"
        subtitle="Suivi et échanges avec les membres"
        actions={
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
        }
      />

      <Card padding={false}>
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            title="Aucune conversation active"
            description="Les nouveaux messages apparaîtront ici automatiquement."
            // icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(conv => (
              <Link
                key={conv.$id}
                href={`/pro/chat/${conv.$id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {conv.memberName?.slice(0, 2).toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium truncate">{conv.memberName}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessagePreview || 'Aucun message'}
                  </p>
                </div>

                {(conv.proUnread || 0) > 0 && (
                  <Badge variant="stone" className="ml-2">
                    {conv.proUnread}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}