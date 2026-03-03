'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChatService } from '@/services/chat.service';
import { Card, Button, Input, Badge, Empty } from '@/components/ui';
import { Send, Paperclip, XCircle } from 'lucide-react';

export default function ProChatConversation() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    loadConversation();

    // Souscription realtime aux nouveaux messages
    const unsubscribe = ChatService.subscribeToMessages(id, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const data = await ChatService.getWithMessages(id);
      setConversation(data.conversation);
      setMessages(data.messages);
    } catch (err) {
      console.error('Erreur chargement conversation', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    const payload: any = {
      id,
      encryptedContent: newMessage, 
      iv: null,
      type: 'text',
    };

    try {
      const msg = await ChatService.sendMessage(profile!.$id, payload);
      setMessages(prev => [...prev, msg]);
      setNewMessage('');

      await ChatService.markAsRead(id, profile!.$id);
    } catch (err) {
      console.error('Erreur envoi message', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement de la conversation...</div>;
  }

  if (!conversation) {
    return <Empty title="Conversation introuvable" />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b p-4 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">{conversation.memberName}</h2>
            <p className="text-sm text-muted-foreground">
              {conversation.status === 'open' ? 'En ligne' : 'Conversation fermée'}
            </p>
          </div>
          <div className="flex gap-2">
            {conversation.status === 'open' && (
              <Button variant="danger" size="sm" className="text-red-600">
                <XCircle className="h-4 w-4 mr-2" />
                Fermer la conversation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Aucune message pour le moment
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.$id}
              className={`flex ${msg.senderId === profile?.$id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  msg.senderId === profile?.$id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border'
                }`}
              >
                <p>{msg.encryptedContent}</p> {/* À déchiffrer côté client */}
                <span className="text-xs opacity-70 block mt-1">
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
      {conversation.status === 'open' && (
        <div className="border-t p-4 bg-background">
          <div className="flex gap-2">
            <Button variant="ghost">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}