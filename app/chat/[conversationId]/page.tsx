'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChatService } from '@/services/chat.service';
import { Input, Button} from '@/components/ui';
import { Send, Paperclip, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ChatConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !profile) return;

    loadConversation();

    // Souscription realtime aux nouveaux messages
    const unsubscribe = ChatService.subscribeToMessages(conversationId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => unsubscribe();
  }, [conversationId, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const { conversation, messages } = await ChatService.getWithMessages(conversationId);
      setConversation(conversation);
      setMessages(messages);

      // Marquer comme lu
      await ChatService.markAsRead(conversationId, profile!.$id);
    } catch (err) {
      console.error('Erreur chargement conversation', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setSending(true);

    const payload: any = {
      conversationId,
      encryptedContent: newMessage, 
      iv: null,
      type: 'text',
    };

    try {
      const msg = await ChatService.sendMessage(profile!.$id, payload);
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      console.error('Erreur envoi message', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement de la conversation...</div>;
  }

  if (!conversation) {
    return (
      <div className="p-8 text-center space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Conversation introuvable ou accès non autorisé.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/chat')}>Retour à mes conversations</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b p-4 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {conversation.proName?.slice(0, 2).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-medium">{conversation.proName || 'Professionnel'}</h2>
              <p className="text-xs text-muted-foreground">
                {conversation.status === 'open' ? 'Disponible' : 'Conversation terminée'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Commencez la conversation en envoyant un message
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.$id}
              className={`flex ${msg.senderId === profile?.$id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  msg.senderId === profile?.$id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-white border rounded-bl-none shadow-sm'
                }`}
              >
                <p className="break-words">{msg.encryptedContent}</p>
                <span className="text-xs opacity-70 block mt-1 text-right">
                  {new Date(msg.sentAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      {conversation.status === 'open' ? (
        <div className="border-t p-4 bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
            //   size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t p-4 bg-muted/50 text-center text-sm text-muted-foreground">
          Cette conversation est terminée.
        </div>
      )}
    </div>
  );
}