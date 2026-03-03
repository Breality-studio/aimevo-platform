/**
 * services/chat.service.ts — Chat Web (E2EE Ready)
 */

import { ID, Query, Permission, Role } from "appwrite";
import {
    client,
    databases,
    storage,
    functions,
    DB_ID,
    Col,
    Bucket,
    Fn,
} from "@/lib/appwrite";

import { AuthService } from "./auth.service";
import type {
    Conversation,
    Message,
    SendMessagePayload,
    ConvStatus,
    Profile,
} from "@/lib/types";

export const ChatService = {
    // ─────────────────────────────────────────────
    // Conversation
    // ─────────────────────────────────────────────

    // Recherche avancée pour admin
    async searchAdmin(query: string): Promise<any[]> {
        const res = await databases.listDocuments<any>(DB_ID, Col.CONVERSATIONS, [
            Query.search('participants', query),
            Query.limit(50),
        ]);
        return res.documents;
    },

    async listAdmin(params: {
        status?: 'open' | 'closed' | 'archived';
        search?: string;
        professionalId?: string;
        limit?: number;
        cursor?: string;
    } = {}): Promise<{ conversations: any[]; cursor: string | null }> {
        const q: string[] = [Query.orderDesc('lastMessageAt'), Query.limit(params.limit ?? 20)];

        if (params.status) q.push(Query.equal('status', params.status));
        if (params.professionalId) q.push(Query.search('participants', params.professionalId));
        if (params.search) q.push(Query.search('participants', params.search)); // approx

        const res = await databases.listDocuments<any>(DB_ID, Col.CONVERSATIONS, q);

        // Enrichir avec noms des participants (facultatif)
        const enriched = await Promise.all(
            res.documents.map(async conv => {
                const memberId = conv.participants.find((id: string) => id !== conv.professionalId);
                try {
                    const [memberProf, proProf] = await Promise.all([
                        databases.getDocument(DB_ID, Col.PROFILES, memberId),
                        databases.getDocument(DB_ID, Col.PROFILES, conv.participants.find((id: string) => id !== memberId)),
                    ]);
                    return {
                        ...conv,
                        memberName: `${memberProf.firstName || ''} ${memberProf.lastName || ''}`.trim() || 'Anonyme',
                        proName: `${proProf.firstName || ''} ${proProf.lastName || ''}`.trim() || 'Anonyme',
                    };
                } catch {
                    return conv;
                }
            })
        );

        return {
            conversations: enriched,
            cursor: res.documents.length > 0 ? res.documents.at(-1)?.$id : null,
        };
    },

    /**
   * Liste des conversations actives pour un professionnel
   */
    async listActiveForPro(proId: string) {
        try {
            const res = await databases.listDocuments(
                DB_ID,
                Col.CONVERSATIONS,
                [
                    Query.search('participants', proId),
                    Query.equal('status', 'open'),
                    Query.orderDesc('lastMessageAt'),
                    Query.limit(30),
                ]
            );
            return res.documents;
        } catch (err) {
            console.error('Erreur liste conversations pro', err);
            return [];
        }
    },

    // Détail d'une conversation + messages
    async getAdmin(conversationId: string): Promise<{ conversation: any; messages: any[] }> {
        const [conv, msgs] = await Promise.all([
            databases.getDocument<any>(DB_ID, Col.CONVERSATIONS, conversationId),
            databases.listDocuments<any>(DB_ID, Col.MESSAGES, [
                Query.equal('conversationId', conversationId),
                Query.orderAsc('sentAt'),
                Query.limit(100), // ou pagination
            ]),
        ]);

        // Enrichir noms (optionnel)
        const memberId = conv.participants.find((id: string) => id !== conv.professionalId);
        const [memberProf, proProf] = await Promise.all([
            databases.getDocument(DB_ID, Col.PROFILES, memberId).catch(() => ({})) as Promise<Profile>,
            databases.getDocument(DB_ID, Col.PROFILES, conv.participants.find((id: string) => id !== memberId)).catch(() => ({})) as Promise<Profile>,
        ]);

        return {
            conversation: {
                ...conv,
                memberName: `${memberProf.firstName || ''} ${memberProf.lastName || ''}`.trim() || 'Anonyme',
                proName: `${proProf.firstName || ''} ${proProf.lastName || ''}`.trim() || 'Anonyme',
            },
            messages: msgs.documents,
        };
    },

    // Fermer une conversation
    async close(conversationId: string, closedBy: string, reason?: string): Promise<void> {
        await databases.updateDocument(DB_ID, Col.CONVERSATIONS, conversationId, {
            status: 'closed',
            closedBy,
            closedReason: reason || null,
            closedAt: new Date().toISOString(),
        });
    },

    // Ajouter une note admin
    async addAdminNote(conversationId: string, note: string): Promise<void> {
        const conv = await databases.getDocument<any>(DB_ID, Col.CONVERSATIONS, conversationId);
        const notes = conv.adminNotes ? `${conv.adminNotes}\n---\n${note}` : note;

        await databases.updateDocument(DB_ID, Col.CONVERSATIONS, conversationId, {
            adminNotes: notes,
        });
    },

    // Liste des professionnels disponibles
    async listAvailableProfessionals(): Promise<any[]> {
        const res = await databases.listDocuments<any>(DB_ID, Col.PROFILES, [
            Query.equal('role', 'professional'),
            Query.equal('availabilityStatus', 'online'),
            Query.limit(50),
        ]);
        return res.documents;
    },

    // Transfert à un nouveau professionnel
    async transfer(conversationId: string, newProfessionalId: string, transferredBy: string): Promise<void> {
        const conv = await databases.getDocument<any>(DB_ID, Col.CONVERSATIONS, conversationId);
        if (!conv.participants.includes(conv.professionalId)) {
            throw new Error('Professionnel actuel non trouvé');
        }

        const newParticipants = conv.participants.map((id: string) =>
            id === conv.professionalId ? newProfessionalId : id
        );

        await databases.updateDocument(DB_ID, Col.CONVERSATIONS, conversationId, {
            participants: newParticipants,
            transferredBy,
            transferredAt: new Date().toISOString(),
        });

        // Notification aux parties
        await functions.createExecution(Fn.NOTIFY, JSON.stringify({
            action: 'conversation_transferred',
            conversationId,
            oldProId: conv.professionalId,
            newProId: newProfessionalId,
            memberId: newParticipants.find((id: string) => id !== newProfessionalId),
        })).catch(console.error);
    },

    async getOrCreateConversation(
        memberId: string,
        professionalId: string
    ) {
        const existing = await databases.listDocuments(
            DB_ID,
            Col.CONVERSATIONS,
            [
                Query.equal("memberId", memberId),
                Query.equal("professionalId", professionalId),
                Query.limit(1),
            ]
        );

        if (existing.documents.length) {
            return existing.documents[0];
        }

        const [memberKey, proKey] = await Promise.all([
            AuthService.getPublicKey(memberId),
            AuthService.getPublicKey(professionalId),
        ]);

        return databases.createDocument(
            DB_ID,
            Col.CONVERSATIONS,
            ID.unique(),
            {
                memberId,
                professionalId,
                memberPublicKey: memberKey,
                proPublicKey: proKey,
                status: "open" as ConvStatus,
                memberUnread: 0,
                proUnread: 0,
            },
            [
                Permission.read(Role.user(memberId)),
                Permission.read(Role.user(professionalId)),
                Permission.read(Role.label("admin")),
                Permission.update(Role.label("admin")),
            ]
        );
    },

    async listConversations(
        userId: string,
        role: "member" | "professional"
    ) {
        const field = role === "member" ? "memberId" : "professionalId";

        const res = await databases.listDocuments(
            DB_ID,
            Col.CONVERSATIONS,
            [
                Query.equal(field, userId),
                Query.equal("status", "open"),
                Query.orderDesc("lastMessageAt"),
            ]
        );

        return res.documents;
    },

    // ─────────────────────────────────────────────
    // Messages
    // ─────────────────────────────────────────────

    /**
   * Récupère une conversation + ses messages (pour admin ou pro)
   */
    async getWithMessages(
        conversationId: string,
        limit: number = 50
    ) {
        try {
            const [conv, msgs] = await Promise.all([
                databases.getDocument(DB_ID, Col.CONVERSATIONS, conversationId),
                databases.listDocuments(
                    DB_ID,
                    Col.MESSAGES,
                    [
                        Query.equal('conversationId', conversationId),
                        Query.orderAsc('sentAt'),
                        Query.limit(limit),
                    ]
                ),
            ]);

            return {
                conversation: conv,
                messages: msgs.documents,
            };
        } catch (err) {
            console.error('Erreur récupération conversation + messages', err);
            throw err;
        }
    },

    async getMessages(
        conversationId: string,
        opts: { limit?: number; cursor?: string } = {}
    ) {
        const queries = [
            Query.equal("conversationId", conversationId),
            Query.orderDesc("$createdAt"),
            Query.limit(opts.limit ?? 50),
        ];

        if (opts.cursor) {
            queries.push(Query.cursorAfter(opts.cursor));
        }

        const res = await databases.listDocuments(
            DB_ID,
            Col.MESSAGES,
            queries
        );

        return res.documents.reverse();
    },

    async getUnreadCount(userId: string): Promise<number> {
        const res = await databases.listDocuments(DB_ID, Col.CONVERSATIONS, [
            Query.search('participants', userId),
            Query.greaterThan('memberUnread', 0), // ou proUnread selon rôle
        ]);
        return res.documents.reduce((sum, conv) => sum + (conv.memberUnread || 0), 0);
    },

    async sendMessage(
        senderId: string,
        payload: SendMessagePayload
    ) {
        const {
            conversationId,
            encryptedContent,
            iv,
            type = "text",
            audioFileId,
        } = payload;

        const conv = await databases.getDocument(
            DB_ID,
            Col.CONVERSATIONS,
            conversationId
        );

        if (
            conv.memberId !== senderId &&
            conv.professionalId !== senderId
        ) {
            throw new Error("Accès interdit");
        }

        const isMember = senderId === conv.memberId;
        const unreadKey = isMember ? "proUnread" : "memberUnread";

        const msg = await databases.createDocument(
            DB_ID,
            Col.MESSAGES,
            ID.unique(),
            {
                conversationId,
                senderId,
                encryptedContent,
                iv: iv ?? null,
                type,
                audioFileId: audioFileId ?? null,
                isRead: false,
            },
            [
                Permission.read(Role.user(conv.memberId)),
                Permission.read(Role.user(conv.professionalId)),
                Permission.read(Role.label("admin")),
            ]
        );

        await databases.updateDocument(
            DB_ID,
            Col.CONVERSATIONS,
            conversationId,
            {
                lastMessageAt: msg.$createdAt,
                lastMessagePreview: "[Message chiffré]",
                [unreadKey]:
                    (isMember
                        ? conv.proUnread
                        : conv.memberUnread) + 1,
            }
        );

        return msg;
    },

    async markAsRead(
        conversationId: string,
        userId: string
    ) {
        const conv = await databases.getDocument(
            DB_ID,
            Col.CONVERSATIONS,
            conversationId
        );

        const counterKey =
            conv.memberId === userId
                ? "memberUnread"
                : "proUnread";

        await databases.updateDocument(
            DB_ID,
            Col.CONVERSATIONS,
            conversationId,
            { [counterKey]: 0 }
        );

        const unread = await databases.listDocuments(
            DB_ID,
            Col.MESSAGES,
            [
                Query.equal("conversationId", conversationId),
                Query.notEqual("senderId", userId),
                Query.equal("isRead", false),
                Query.limit(100),
            ]
        );

        await Promise.all(
            unread.documents.map((m) =>
                databases.updateDocument(
                    DB_ID,
                    Col.MESSAGES,
                    m.$id,
                    { isRead: true }
                )
            )
        );
    },

    // ─────────────────────────────────────────────
    // Upload Audio
    // ─────────────────────────────────────────────

    async uploadAudio(
        file: File,
        onProgress?: (pct: number) => void
    ): Promise<string> {
        const uploaded = await storage.createFile(
            Bucket.CHAT_AUDIO,
            ID.unique(),
            file,
            [Permission.read(Role.users())],
            (p) => onProgress?.(p.progress)
        );

        return uploaded.$id;
    },

    // ─────────────────────────────────────────────
    // Realtime (SDK v11+)
    // ─────────────────────────────────────────────

    subscribeToMessages(
        conversationId: string,
        onMessage: (msg: Message) => void
    ): () => void {
        return client.subscribe(
            `databases.${DB_ID}.collections.${Col.MESSAGES}.documents`,
            (event) => {
                const doc = event.payload as Message;
                if (doc.conversationId === conversationId) {
                    onMessage(doc);
                }
            }
        );
    },

    subscribeToConversations(
        userId: string,
        onChange: (conv: Conversation) => void
    ): () => void {
        return client.subscribe(
            `databases.${DB_ID}.collections.${Col.CONVERSATIONS}.documents`,
            (event) => {
                const doc = event.payload as Conversation;

                if (
                    doc.memberId === userId ||
                    doc.professionalId === userId
                ) {
                    onChange(doc);
                }
            }
        );
    },

    async requestFastHelp(memberId: string) {
        // Broadcast via Realtime ou créer une entrée dans une future collection "help_requests"
        // Pour l'instant on log simplement (à remplacer par vraie logique file d'attente)
        console.log(`[FastHelp] Demande d'aide rapide de ${memberId}`);
        // TODO: implémenter broadcast aux pros disponibles
        return { success: true };
    },
};