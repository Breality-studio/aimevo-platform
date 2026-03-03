import { ID, Query } from 'appwrite';
import { databases, functions, DB_ID, Col, Fn } from '@/lib/appwrite';
import type { Profile, Subscription, Payment, AuditLog, UserRole } from '@/lib/types';

export const AdminService = {

    // ── Utilisateurs ─────────────────────────────────────────────────────────────

    async listUsers(params: {
        search?: string;
        role?: UserRole;
        isActive?: boolean;
        limit?: number;
        cursor?: string;
    } = {}) {

        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(params.limit ?? 50),
        ];

        if (params.search) {
            queries.push(Query.search('firstName', params.search)); // Exemple, étendre si besoin
            queries.push(Query.search('lastName', params.search));
            queries.push(Query.search('email', params.search));
        }

        if (params.role) queries.push(Query.equal('role', params.role));
        if (params.isActive !== undefined) queries.push(Query.equal('isActive', params.isActive));
        if (params.cursor) queries.push(Query.cursorAfter(params.cursor));

        const res = await databases.listDocuments(DB_ID, Col.PROFILES, queries);

        return {
            users: res.documents,
            total: res.total,
            cursor: res.documents.length ? res.documents.at(-1)?.$id : null
        };
    },

    async createUser(
        adminId: string,
        data: {
            firstName: string;
            lastName: string;
            email: string;
            role: UserRole;
        }
    ) {
        const execution = await functions.createExecution(
            Fn.AUTH_HOOKS,
            JSON.stringify({
                action: 'create_user',
                adminId,
                ...data,
            })
        );

        const result = JSON.parse(execution.responseBody);

        if (!result.success) {
            throw new Error(result.error ?? 'Erreur création utilisateur');
        }

        return result.userId;
    },

    async getUser(userId: string) {
        return databases.getDocument(DB_ID, Col.PROFILES, userId);
    },

    async updateUser(
        adminId: string,
        userId: string,
        data: {
            firstName: string;
            lastName: string;
            role: UserRole;
            isActive: boolean;
        }
    ) {
        await databases.updateDocument(DB_ID, Col.PROFILES, userId, {
            firstName: data.firstName,
            lastName: data.lastName,
            isActive: data.isActive,
        });

        await this.assignRole(adminId, userId, data.role);
    },

    /** Assigne un rôle via la Function auth-hooks (met à jour label Appwrite Auth + profil) */
    async assignRole(adminId: string, targetUserId: string, role: UserRole): Promise<void> {
        const execution = await functions.createExecution(
            Fn.AUTH_HOOKS,
            JSON.stringify({ action: 'assign_role', adminId, targetUserId, role }),
        );
        const result = JSON.parse(execution.responseBody);
        if (!result.success) throw new Error(result.error ?? 'Erreur assignation rôle');
    },

    async setUserActive(adminId: string, targetUserId: string, isActive: boolean): Promise<void> {
        await databases.updateDocument(DB_ID, Col.PROFILES, targetUserId, { isActive });
        await databases.createDocument(DB_ID, Col.AUDIT_LOGS, ID.unique(), {
            adminId,
            action: isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER',
            targetId: targetUserId,
            targetType: 'user',
            metaJson: JSON.stringify({ isActive }),
        });
    },

    async deleteUser(adminId: string, targetUserId: string) {
        const execution = await functions.createExecution(
            Fn.AUTH_HOOKS,
            JSON.stringify({ action: 'delete_user', adminId, targetUserId }),
        );
        const result = JSON.parse(execution.responseBody);
        if (!result.success) throw new Error(result.error ?? 'Erreur suppression utilisateur');
    },

    // ── Abonnements ───────────────────────────────────────────────────────────────
    async listSubscriptions(params: {
        status?: string;
        limit?: number;
        cursor?: string;
    } = {}) {
        const q: string[] = [Query.orderDesc('$createdAt'), Query.limit(params.limit ?? 50)];
        if (params.status) q.push(Query.equal('status', params.status));
        if (params.cursor) q.push(Query.cursorAfter(params.cursor));
        const res = await databases.listDocuments(DB_ID, Col.SUBSCRIPTIONS, q);
        return res.documents;
    },

    // ── Paiements ────────────────────────────────────────────────────────────────
    async listPayments(params: {
        status?: string;
        userId?: string;
        limit?: number;
        cursor?: string;
    } = {}) {
        const q: string[] = [Query.orderDesc('$createdAt'), Query.limit(params.limit ?? 50)];
        if (params.status) q.push(Query.equal('status', params.status));
        if (params.userId) q.push(Query.equal('userId', params.userId));
        if (params.cursor) q.push(Query.cursorAfter(params.cursor));
        const res = await databases.listDocuments(DB_ID, Col.PAYMENTS, q);
        return res.documents;
    },

    // ── Logs d'audit ──────────────────────────────────────────────────────────────
    async listAuditLogs(params: {
        adminId?: string;
        action?: string;
        limit?: number;
        cursor?: string;
    } = {}) {
        const q: string[] = [Query.orderDesc('$createdAt'), Query.limit(params.limit ?? 100)];
        if (params.adminId) q.push(Query.equal('adminId', params.adminId));
        if (params.action) q.push(Query.equal('action', params.action));
        if (params.cursor) q.push(Query.cursorAfter(params.cursor));
        const res = await databases.listDocuments(DB_ID, Col.AUDIT_LOGS, q);
        return res.documents;
    },

    // ── Statistiques dashboard ────────────────────────────────────────────────────
    async getDashboardStats(): Promise<{
        totalUsers: number;
        activeSubscriptions: number;
        totalRevenue: number;
        pendingTests: number;
        monthlyRevenue: number;
    }> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [profiles, activeSubs, allPayments, monthPayments, pendingAttempts] = await Promise.all([
            databases.listDocuments(DB_ID, Col.PROFILES, [Query.limit(1)]),
            databases.listDocuments(DB_ID, Col.SUBSCRIPTIONS, [Query.equal('status', 'active'), Query.limit(1)]),
            databases.listDocuments<any>(DB_ID, Col.PAYMENTS, [Query.equal('status', 'success'), Query.limit(200)]),
            databases.listDocuments<any>(DB_ID, Col.PAYMENTS, [Query.equal('status', 'success'), Query.greaterThan('$createdAt', monthStart), Query.limit(200)]),
            databases.listDocuments(DB_ID, Col.TEST_ATTEMPTS, [Query.equal('status', 'pending_review'), Query.limit(1)]),
        ]);

        const totalRevenue = allPayments.documents.reduce((s: number, p: any) => s + p.amount, 0);
        const monthlyRevenue = monthPayments.documents.reduce((s: number, p: any) => s + p.amount, 0);

        return {
            totalUsers: profiles.total,
            activeSubscriptions: activeSubs.total,
            totalRevenue,
            pendingTests: pendingAttempts.total,
            monthlyRevenue,
        };
    },
};