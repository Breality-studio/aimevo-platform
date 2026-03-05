'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { ChatService } from '@/services/chat.service';
import { Header } from '@/components/layout/Header';
import { Button, Input, Alert, Badge } from '@/components/ui';
import { AlertDescription } from '@/components/ui/alert'
import { Send, Paperclip, AlertTriangle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ChatConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { profile } = useAuth();
  const { setLoading } = useLoading();
  const router = useRouter();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLocalLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !profile) return;

    setLoading(true, 'Chargement de la conversation...');
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
    setLocalLoading(true);
    try {
      const { conversation, messages } = await ChatService.getWithMessages(conversationId);
      setConversation(conversation);
      setMessages(messages);

      // Marquer comme lu automatiquement
      await ChatService.markAsRead(conversationId, profile!.$id);
    } catch (err) {
      console.error('Erreur chargement conversation', err);
    } finally {
      setLocalLoading(false);
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
    return null; // Le GlobalLoader s'affiche via le provider
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <Alert variant="destructive">
            <AlertDescription>Conversation introuvable ou accès non autorisé.</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/chat')}>
            Retour à mes conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6] flex flex-col">
      {/* Navbar du landing */}
      <Header />

      {/* Header de conversation */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C4922A]/10 flex items-center justify-center text-[#C4922A] font-medium">
              {conversation.proName?.slice(0, 2).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-medium text-[#0F0D0A]">{conversation.proName || 'Professionnel'}</h2>
              <p className="text-xs text-[#8B7355]">
                {conversation.status === 'open' ? 'Disponible maintenant' : 'Conversation terminée'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              // TODO: implémenter fermeture conversation
              alert('Fonctionnalité de fermeture en cours de développement');
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FAFAF8]/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
            <MessageSquare className="h-12 w-12 text-[#C4922A]/50" />
            <p>Commencez la conversation en envoyant un message</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.$id}
              className={`flex ${msg.senderId === profile?.$id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                  msg.senderId === profile?.$id
                    ? 'bg-[#C4922A] text-white rounded-br-none'
                    : 'bg-white border border-[#D4C9B8]/60 rounded-bl-none'
                }`}
              >
                <p className="break-words leading-relaxed">{msg.encryptedContent}</p>
                <span className="text-xs opacity-70 block mt-2 text-right">
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
        <div className="border-t bg-white/90 backdrop-blur-sm sticky bottom-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-[#8B7355] hover:bg-[#C4922A]/10">
                <Paperclip className="h-5 w-5" />
              </Button>

              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 rounded-full border-[#D4C9B8]/60 focus:border-[#C4922A] focus:ring-[#C4922A]/20"
              />

              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-[#C4922A] hover:bg-[#A07520] rounded-full h-10 w-10 p-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t bg-[#FAFAF8]/70 text-center text-sm text-muted-foreground py-4">
          Cette conversation est terminée.
        </div>
      )}
    </div>
  );
}