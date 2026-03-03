import { ID, Query, Permission, Role } from 'appwrite';
import { databases, storage, DB_ID, Col, Bucket, getFileViewUrl } from '@/lib/appwrite';
import { SubscriptionService } from './subscription.service';
import type { Resource, CreateResourcePayload, Lang, ResourceType } from '@/lib/types';
import { ProgressService } from './progress.service';

export const ResourceService = {

  // Ajouts à ResourceService

  async listAdmin(params: {
    search?: string;
    type?: ResourceType;
    language?: Lang;
    isPremium?: boolean;
    isPublished?: boolean;
    limit?: number;
    cursor?: string;
  }) {
    const queries = [Query.orderDesc('$createdAt'), Query.limit(params.limit ?? 20)];

    if (params.search) queries.push(Query.search('title', params.search));
    if (params.type) queries.push(Query.equal('type', params.type));
    if (params.language) queries.push(Query.equal('language', params.language));
    if (params.isPremium !== undefined) queries.push(Query.equal('isPremium', params.isPremium));
    if (params.isPublished !== undefined) queries.push(Query.equal('isPublished', params.isPublished));
    if (params.cursor) queries.push(Query.cursorAfter(params.cursor));

    const res = await databases.listDocuments<any>(DB_ID, Col.RESOURCES, queries);
    return {
      resources: res.documents,
      total: res.total,
      cursor: res.documents.length > 0 ? res.documents.at(-1)?.$id : null,
    };
  },

  async publish(resourceId: string, isPublished: boolean) {
    return databases.updateDocument(DB_ID, Col.RESOURCES, resourceId, {
      isPublished,
      publishedAt: isPublished ? new Date().toISOString() : null,
    });
  },

  async get(
    resourceId: string,
    userId?: string,
    orgId?: string,
  ): Promise<Resource & { audioUrl?: string; videoUrl?: string; locked?: boolean }> {
    const resource = await databases.getDocument<any>(DB_ID, Col.RESOURCES, resourceId);
    if (!resource.isPublished) throw new Error('Ressource non disponible');

    // Incrémenter le compteur (non bloquant)
    databases.updateDocument(DB_ID, Col.RESOURCES, resourceId, {
      viewCount: (resource.viewCount ?? 0) + 1,
    }).catch(() => { });

    if (!resource.isPremium) return resource;

    const hasSub = userId
      ? await SubscriptionService.hasActiveSub(userId, orgId)
      : false;

    if (!hasSub) {
      const { audioFileId, videoFileId, content, ...meta } = resource;
      return { ...meta, locked: true };
    }

    const enriched: any = { ...resource };
    if (resource.audioFileId) enriched.audioUrl = getFileViewUrl(Bucket.AUDIO, resource.audioFileId);
    if (resource.videoFileId) enriched.videoUrl = getFileViewUrl(Bucket.VIDEO, resource.videoFileId);
    if (resource.thumbnailFileId) enriched.thumbnailUrl = getFileViewUrl(Bucket.THUMBNAILS, resource.thumbnailFileId);
    return enriched;
  },

  async create(
    createdBy: string,
    payload: {
      title: string;
      description: string;
      type: string;
      language: string;
      externalUrl?: string;
      iframeUrl?: string;
      contentBase64?: string;
      previewImageBase64?: string;
      isPremium?: boolean;
      tags?: string[];
    },
    isAdmin: boolean
  ): Promise<Resource> {
    return databases.createDocument<any>(
      DB_ID,
      Col.RESOURCES,
      ID.unique(),
      {
        ...payload,
        tags: payload.tags ?? [],
        createdBy,
        isPublished: isAdmin,
        publishedAt: isAdmin ? new Date().toISOString() : null,
        viewCount: 0,
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.label('admin')),
        Permission.delete(Role.label('admin')),
      ]
    );
  },

  async update(
    resourceId: string,
    data: Partial<{
      title?: string;
      description?: string;
      externalUrl?: string;
      iframeUrl?: string;
      contentBase64?: string;
      previewImageBase64?: string;
      isPremium?: boolean;
      tags?: string[];
      isPublished?: boolean;
    }>
  ): Promise<Resource> {
    const updates: Record<string, unknown> = { ...data };
    if (data.isPublished === true) {
      updates.publishedAt = new Date().toISOString();
    }
    return databases.updateDocument<any>(DB_ID, Col.RESOURCES, resourceId, updates);
  },

  async delete(resourceId: string): Promise<void> {
    const resource = await databases.getDocument<any>(DB_ID, Col.RESOURCES, resourceId);
    await databases.deleteDocument(DB_ID, Col.RESOURCES, resourceId);
    const deletes: Promise<unknown>[] = [];
    if (resource.audioFileId) deletes.push(storage.deleteFile(Bucket.AUDIO, resource.audioFileId));
    if (resource.videoFileId) deletes.push(storage.deleteFile(Bucket.VIDEO, resource.videoFileId));
    if (resource.thumbnailFileId) deletes.push(storage.deleteFile(Bucket.THUMBNAILS, resource.thumbnailFileId));
    await Promise.allSettled(deletes);
  },

  async uploadFile(
    bucketId: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const uploaded = await storage.createFile(
      bucketId, ID.unique(), file,
      undefined,
      p => onProgress?.(p.progress),
    );
    return uploaded.$id;
  },

  async saveProgress(userId: string, resourceId: string, progressSeconds: number, lastPosition: number) {
    return ProgressService.save(userId, resourceId, progressSeconds, lastPosition);
  },

  async getWithProgress(resourceId: string, userId: string) {
    const resource = await this.get(resourceId, userId);
    const progress = await ProgressService.get(userId, resourceId);
    return { ...resource, progress: progress ?? { progressSeconds: 0, lastPosition: 0 } };
  },

  // Liste publique : seulement publiées + filtrées par abonnement si premium
  async listPublic(params: {
    type?: string;
    language?: string;
    isPremium?: boolean;
    search?: string;
    limit?: number;
  } = {}) {
    const q: string[] = [
      Query.equal('isPublished', true),
      Query.orderDesc('$createdAt'),
      Query.limit(params.limit ?? 20),
    ];

    if (params.type) q.push(Query.equal('type', params.type));
    if (params.language) q.push(Query.equal('language', params.language));
    if (params.search) q.push(Query.search('title', params.search));

    const res = await databases.listDocuments(DB_ID, Col.RESOURCES, q);

    // Filtrage premium côté client si l'utilisateur n'est pas abonné
    return res.documents.filter(r => !r.isPremium || params.isPremium === true);
  },

  // Récupération d'une ressource publique
  async getPublic(resourceId: string, userHasPremium: boolean) {
    const resource = await databases.getDocument(DB_ID, Col.RESOURCES, resourceId);

    if (!resource.isPublished) throw new Error('Ressource non disponible');
    if (resource.isPremium && !userHasPremium) throw new Error('Contenu premium réservé');

    return resource;
  },

  // Incrémenter le compteur de vues (optionnel, pour stats)
  async incrementView(resourceId: string) {
    const resource = await databases.getDocument(DB_ID, Col.RESOURCES, resourceId);
    await databases.updateDocument(DB_ID, Col.RESOURCES, resourceId, {
      viewCount: (resource.viewCount || 0) + 1,
    });
  },
};