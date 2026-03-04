'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '@/lib/types';
import { ChatService } from '@/services/chat.service';
import { CryptoService } from '@/services/crypto.service';

interface UseMessagesOptions {
  conversationId: string;
  myUserId: string;
  partnerPublicKey?: string;
  myPublicKey?: string;
}

interface UseMessagesReturn {
  messages: (Message & { decrypted?: string })[];
  loading: boolean;
  sending: boolean;
  sendMessage: (plaintext: string) => Promise<void>;
}

export function useMessages({
  conversationId,
  myUserId,
  partnerPublicKey,
  myPublicKey,
}: UseMessagesOptions): UseMessagesReturn {

  const [messages, setMessages] = useState<(Message & { decrypted?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // ─────────────────────────────────────────────
  // Déchiffrement sécurisé
  // ─────────────────────────────────────────────

  const decrypt = useCallback(
    async (msg: any) => {
      if (!msg.iv) return '[Message invalide]';

      try {
        const senderKey =
          msg.senderId === myUserId
            ? myPublicKey
            : partnerPublicKey;

        if (!senderKey) return '[Clé manquante]';

        return await CryptoService.decryptMessage({
          encryptedContent: msg.encryptedContent,
          iv: msg.iv,
          myUserId,
          senderPublicKey: senderKey,
        });
      } catch {
        return '[Impossible de déchiffrer]';
      }
    },
    [myUserId, partnerPublicKey, myPublicKey]
  );

  // ─────────────────────────────────────────────
  // Chargement initial
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const msgs = await ChatService.getMessages(conversationId);
        if (cancelled) return;
        
        let decrypted: Message[] = []
        // const decryptedMessage = await Promise.all(
        //   msgs.map(
        //     async m => ({
        //       ...m,
        //       decrypted: await decrypt(m),
        //     }))
        // );
        
        await Promise.all(
          msgs.map(async (m) => {
            try {
              const dec = await decrypt(m);
              return { ...m, decrypted: dec };
            } catch (decryptErr) {
              console.warn('Échec déchiffrement message', m.$id, decryptErr);
              return { ...m, decrypted: '[Déchiffrement échoué]' };
            }
          })
        );
        setMessages(decrypted);
        await ChatService.markAsRead(conversationId, myUserId);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, myUserId, decrypt]);

  // ─────────────────────────────────────────────
  // Realtime
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
    }

    unsubRef.current = ChatService.subscribeToMessages(
      conversationId,
      async (msg) => {
        const decrypted = await decrypt(msg);

        setMessages(prev => {
          if (prev.some(m => m.$id === msg.$id)) return prev;
          return [...prev, { ...msg, decrypted }];
        });

        if (msg.senderId !== myUserId) {
          ChatService.markAsRead(conversationId, myUserId).catch(() => { });
        }
      }
    );

    return () => {
      unsubRef.current?.();
    };
  }, [conversationId, myUserId, decrypt]);

  // ─────────────────────────────────────────────
  // Envoi message
  // ─────────────────────────────────────────────

  const sendMessage = useCallback(
    async (plaintext: string) => {
      if (!partnerPublicKey) {
        throw new Error('Clé publique du destinataire manquante');
      }

      setSending(true);
      try {
        const { encryptedContent, iv } =
          await CryptoService.encryptMessage({
            plaintext,
            myUserId,
            theirPublicKey: partnerPublicKey,
          });

        await ChatService.sendMessage(myUserId, {
          conversationId,
          encryptedContent,
          iv,
        });
      } finally {
        setSending(false);
      }
    },
    [conversationId, myUserId, partnerPublicKey]
  );

  return { messages, loading, sending, sendMessage };
}