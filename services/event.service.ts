import { ID, Query, Permission, Role } from 'appwrite';
import { databases, storage, DB_ID, Col, Bucket } from '@/lib/appwrite';
import type { Event, EventRegistration, CreateEventPayload } from '@/lib/types';

export const EventService = {

  async listAdmin(params: {
    search?: string;
    type?: 'online' | 'presentiel';
    isPublished?: boolean;
    limit?: number;
    cursor?: string;
  } = {}): Promise<{ events: Event[]; cursor: string | null }> {
    const q: string[] = [Query.orderAsc('startDate'), Query.limit(params.limit ?? 20)];

    if (params.search) q.push(Query.search('title', params.search));
    if (params.type) q.push(Query.equal('type', params.type));
    if (params.isPublished !== undefined) q.push(Query.equal('isPublished', params.isPublished));
    if (params.cursor) q.push(Query.cursorAfter(params.cursor));

    const res = await databases.listDocuments<any>(DB_ID, Col.EVENTS, q);
    return {
      events: res.documents,
      cursor: res.documents.length > 0 ? res.documents.at(-1)?.$id : null,
    };
  },

  // Liste publique : seulement publiés + futurs
  async listPublic(params: {
    type?: 'online' | 'presentiel';
    search?: string;
    upcomingOnly?: boolean;
    limit?: number;
  } = {}) {
    const now = new Date().toISOString();
    const q: string[] = [
      Query.equal('isPublished', true),
      Query.orderAsc('startDate'),
      Query.limit(params.limit ?? 20),
    ];

    if (params.type) q.push(Query.equal('type', params.type));
    if (params.search) q.push(Query.search('title', params.search));
    if (params.upcomingOnly !== false) q.push(Query.greaterThan('startDate', now));

    const res = await databases.listDocuments(DB_ID, Col.EVENTS, q);
    return res.documents;
  },

  // Détail d’un événement public
  async getPublic(eventId: string) {
    const event = await databases.getDocument(DB_ID, Col.EVENTS, eventId);

    if (!event.isPublished) throw new Error('Événement non disponible');
    if (new Date(event.startDate) < new Date()) throw new Error('Événement passé');

    return event;
  },

  // Inscription à un événement
  async register(userId: string, eventId: string) {
    const event = await databases.getDocument(DB_ID, Col.EVENTS, eventId);

    if (!event.isPublished) throw new Error('Événement non disponible');
    if (event.remainingPlaces <= 0) throw new Error('Complet');

    const existing = await databases.listDocuments(DB_ID, Col.EVENT_REGISTRATIONS, [
      Query.equal('userId', userId),
      Query.equal('eventId', eventId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) throw new Error('Déjà inscrit');

    const registration = await databases.createDocument(
      DB_ID,
      Col.EVENT_REGISTRATIONS,
      ID.unique(),
      {
        eventId,
        userId,
        status: 'confirmed',
        registeredAt: new Date().toISOString(),
      }
    );

    // Décrémenter les places
    await databases.updateDocument(DB_ID, Col.EVENTS, eventId, {
      remainingPlaces: event.remainingPlaces - 1,
    });

    return registration;
  },

  // Vérifier si déjà inscrit
  async isRegistered(userId: string, eventId: string): Promise<boolean> {
    const res = await databases.listDocuments(DB_ID, Col.EVENT_REGISTRATIONS, [
      Query.equal('userId', userId),
      Query.equal('eventId', eventId),
      Query.limit(1),
    ]);
    return res.documents.length > 0;
  },

  async listPublished() {
    return databases.listDocuments<any>(DB_ID, Col.EVENTS, [
      Query.equal('isPublished', true),
      Query.orderAsc('startDate'),
    ]);
  },

  async get(eventId: string) {
    return databases.getDocument<any>(DB_ID, Col.EVENTS, eventId);
  },

  async create(adminId: string, payload: CreateEventPayload) {
    return databases.createDocument(DB_ID, Col.EVENTS, ID.unique(), {
      ...payload,
      createdBy: adminId,
      remainingPlaces: payload.maxPlaces,
      isPublished: false,
    });
  },

  async update(eventId: string, data: Partial<{
    title?: string;
    description?: string;
    type?: 'online' | 'presentiel';
    location?: string;
    startDate?: string;
    endDate?: string;
    price?: number;
    maxPlaces?: number;
    isPublished?: boolean;
    tags?: string[];
  }>) {
    const updates: Record<string, unknown> = { ...data };
    if (data.isPublished === true) {
      updates.publishedAt = new Date().toISOString();
    }
    return databases.updateDocument(DB_ID, Col.EVENTS, eventId, updates);
  },

  async publish(eventId: string, isPublished: boolean) {
    return databases.updateDocument(DB_ID, Col.EVENTS, eventId, {
      isPublished,
      publishedAt: isPublished ? new Date().toISOString() : null,
    });
  },

  async delete(eventId: string): Promise<void> {
    const registrations = await databases.listDocuments(DB_ID, Col.EVENT_REGISTRATIONS, [
      Query.equal('eventId', eventId),
    ]);

    await Promise.all(
      registrations.documents.map(r =>
        databases.deleteDocument(DB_ID, Col.EVENT_REGISTRATIONS, r.$id)
      )
    );

    await databases.deleteDocument(DB_ID, Col.EVENTS, eventId);
  },

  // Gestion inscriptions
  async listRegistrations(eventId: string): Promise<EventRegistration[]> {
    return databases.listDocuments<any>(DB_ID, Col.EVENT_REGISTRATIONS, [
      Query.equal('eventId', eventId),
      Query.orderDesc('$createdAt'),
    ]).then(r => r.documents);
  },

  // async register(userId: string, eventId: string) {
  //   const event = await databases.getDocument(DB_ID, Col.EVENTS, eventId);
  //   if (event.remainingPlaces <= 0) throw new Error('Complet');

  //   const registration = await databases.createDocument(
  //     DB_ID, Col.EVENT_REGISTRATIONS, ID.unique(),
  //     { eventId, userId, status: 'confirmed', registeredAt: new Date().toISOString() },
  //     [Permission.read(Role.user(userId)), Permission.read(Role.label('admin'))]
  //   );

  //   await databases.updateDocument(DB_ID, Col.EVENTS, eventId, {
  //     remainingPlaces: event.remainingPlaces - 1,
  //   });

  //   return registration;
  // },

  async generateQR(registrationId: string) {
    // À implémenter avec une Function + qrcode lib
    // Pour l'instant on retourne juste l'ID
    return { qrFileId: null };
  },
};