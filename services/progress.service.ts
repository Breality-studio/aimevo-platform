import { ID, Query } from 'appwrite';
import { databases, DB_ID, Col } from '@/lib/appwrite';

export const ProgressService = {

  async save(userId: string, resourceId: string, progressSeconds: number, lastPosition: number) {
    const existing = await databases.listDocuments(DB_ID, Col.USER_PROGRESS, [
      Query.equal('userId', userId),
      Query.equal('resourceId', resourceId),
      Query.limit(1),
    ]);

    if (existing.documents.length) {
      return databases.updateDocument(DB_ID, Col.USER_PROGRESS, existing.documents[0].$id, {
        progressSeconds,
        lastPosition,
        lastUpdated: new Date().toISOString(),
      });
    }

    return databases.createDocument(DB_ID, Col.USER_PROGRESS, ID.unique(), {
      userId,
      resourceId,
      progressSeconds,
      lastPosition,
      lastUpdated: new Date().toISOString(),
    });
  },

  async get(userId: string, resourceId: string) {
    const res = await databases.listDocuments(DB_ID, Col.USER_PROGRESS, [
      Query.equal('userId', userId),
      Query.equal('resourceId', resourceId),
      Query.limit(1),
    ]);
    return res.documents[0] ?? null;
  },

  async getAllForUser(userId: string) {
    const res = await databases.listDocuments(DB_ID, Col.USER_PROGRESS, [
      Query.equal('userId', userId),
    ]);
    return res.documents;
  },
};