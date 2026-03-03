import { ID, Query, Permission, Role } from 'appwrite';
import { databases, functions, DB_ID, Col, Fn } from '@/lib/appwrite';
import type {
    Plan, Subscription, Payment,
    CreateSubscriptionPayload, InitiatePaymentPayload,
    BillingCycle, SubStatus,
} from '@/lib/types';

interface PlanPayloadType {
    name: string;
    type: string;
    priceMonthly: number;
    priceQuarterly: number;
    priceYearly: number;
    currency?: string;
    description?: string;
    features?: string[];
    maxMembers?: number;
    sortOrder?: number;
    isActive?: boolean;
    isPopular?: boolean;
    color?: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export const PlanService = {

    async list(): Promise<Plan[]> {
        const res = await databases.listDocuments<any>(DB_ID, Col.PLANS, [
            Query.equal('isActive', true),
            Query.orderAsc('sortOrder'),
        ]);
        return res.documents;
    },

    // Liste complète pour admin (tous les plans, même inactifs)
    async listAdmin(): Promise<Plan[]> {
        const res = await databases.listDocuments<any>(DB_ID, Col.PLANS, [
            Query.orderAsc('sortOrder'),
        ]);
        return res.documents;
    },

    async get(planId: string) {
        return databases.getDocument<any>(DB_ID, Col.PLANS, planId);
    },

    async update(planId: string, data: Partial<PlanPayloadType>) {
        return databases.updateDocument(DB_ID, Col.PLANS, planId, data);
    },

    async toggleActive(planId: string, isActive: boolean) {
        return databases.updateDocument(DB_ID, Col.PLANS, planId, { isActive });
    },

    async delete(planId: string) {
        // Vérification sécurité : pas d’abonnements actifs
        const activeSubs = await databases.listDocuments(DB_ID, Col.SUBSCRIPTIONS, [
            Query.equal('planId', planId),
            Query.equal('status', 'active'),
            Query.limit(1),
        ]);

        if (activeSubs.documents.length > 0) {
            throw new Error('Impossible de supprimer : des abonnements actifs utilisent ce plan.');
        }

        await databases.deleteDocument(DB_ID, Col.PLANS, planId);
    },

    /** Prix selon le cycle de facturation */
    getPrice(plan: Plan, cycle: BillingCycle): number {
        switch (cycle) {
            case 'monthly': return plan.priceMonthly;
            case 'quarterly': return plan.priceQuarterly;
            case 'yearly': return plan.priceYearly;
            default: throw new Error(`Cycle inconnu: ${cycle}`);
        }
    }
};

// ─── Abonnements ──────────────────────────────────────────────────────────────
export const SubscriptionService = {
    async listAdmin(params: {
        ownerId?: string;
        status?: string;
        search?: string; // nom ou email via jointure manuelle
        limit?: number;
        cursor?: string;
    } = {}): Promise<{ subscriptions: Subscription[]; cursor: string | null }> {
        const q: string[] = [Query.orderDesc('startDate'), Query.limit(params.limit ?? 20)];

        if (params.ownerId) q.push(Query.equal('ownerId', params.ownerId));
        if (params.status) q.push(Query.equal('status', params.status));
        if (params.cursor) q.push(Query.cursorAfter(params.cursor));

        const res = await databases.listDocuments<any>(DB_ID, Col.SUBSCRIPTIONS, q);

        // Enrichissement avec profil utilisateur et dernier paiement
        const enriched = await Promise.all(
            res.documents.map(async (sub: any) => {
                try {
                    const [user, lastPayment] = await Promise.all([
                        databases.getDocument(DB_ID, Col.PROFILES, sub.ownerId),
                        sub.lastPaymentId
                            ? databases.getDocument(DB_ID, Col.PAYMENTS, sub.lastPaymentId)
                            : Promise.resolve(null),
                    ]);

                    return {
                        ...sub,
                        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonyme',
                        userEmail: user.email || '',
                        lastPaymentStatus: lastPayment?.status || null,
                    };
                } catch {
                    return sub;
                }
            })
        );

        return {
            subscriptions: enriched,
            cursor: res.documents.length > 0 ? res.documents.at(-1)?.$id : null,
        };
    },

    // ── Détail d’un abonnement + historique paiements ──────────────────────────
    async getAdmin(subscriptionId: string): Promise<{
        subscription: Subscription;
        payments: Payment[];
    }> {
        const sub = await databases.getDocument<any>(DB_ID, Col.SUBSCRIPTIONS, subscriptionId);

        const [user, payments] = await Promise.all([
            databases.getDocument(DB_ID, Col.PROFILES, sub.ownerId),
            databases.listDocuments<any>(DB_ID, Col.PAYMENTS, [
                Query.equal('subscriptionId', subscriptionId),
                Query.orderDesc('paidAt'),
            ]),
        ]);

        return {
            subscription: {
                ...sub,
                userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonyme',
                userEmail: user.email || '',
            },
            payments: payments.documents,
        };
    },

    // ── Actions administrateur ─────────────────────────────────────────────────
    async suspend(subscriptionId: string, reason?: string): Promise<void> {
        await databases.updateDocument(DB_ID, Col.SUBSCRIPTIONS, subscriptionId, {
            status: 'suspended',
            suspendedAt: new Date().toISOString(),
            suspendReason: reason || null,
        });
    },

    async activate(subscriptionId: string): Promise<void> {
        await databases.updateDocument(DB_ID, Col.SUBSCRIPTIONS, subscriptionId, {
            status: 'active',
            suspendedAt: null,
            suspendReason: null,
        });
    },

    async cancel(subscriptionId: string, reason?: string): Promise<void> {
        await databases.updateDocument(DB_ID, Col.SUBSCRIPTIONS, subscriptionId, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelReason: reason || null,
            autoRenew: false,
        });
    },

    async extend(subscriptionId: string, days: number): Promise<void> {
        const sub = await databases.getDocument(DB_ID, Col.SUBSCRIPTIONS, subscriptionId);
        const newEnd = new Date(sub.endDate || sub.startDate);
        newEnd.setDate(newEnd.getDate() + days);

        await databases.updateDocument(DB_ID, Col.SUBSCRIPTIONS, subscriptionId, {
            endDate: newEnd.toISOString(),
            nextBillingDate: sub.autoRenew ? newEnd.toISOString() : sub.nextBillingDate,
        });
    },

    // ── Statistiques rapides pour dashboard ────────────────────────────────────
    async getStats(): Promise<{
        totalActive: number;
        totalPending: number;
        totalCancelled: number;
        totalRevenue: number;
    }> {
        const [active, pending, cancelled, payments] = await Promise.all([
            databases.listDocuments(DB_ID, Col.SUBSCRIPTIONS, [Query.equal('status', 'active')]),
            databases.listDocuments(DB_ID, Col.SUBSCRIPTIONS, [Query.equal('status', 'pending')]),
            databases.listDocuments(DB_ID, Col.SUBSCRIPTIONS, [Query.equal('status', 'cancelled')]),
            databases.listDocuments(DB_ID, Col.PAYMENTS, [Query.equal('status', 'completed')]),
        ]);

        const totalRevenue = payments.documents.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        return {
            totalActive: active.total,
            totalPending: pending.total,
            totalCancelled: cancelled.total,
            totalRevenue,
        };
    },

    /** Abonnement actif non expiré pour un user ou une org */
    async getActive(ownerId: string): Promise<Subscription | null> {
        const now = new Date().toISOString();
        const res = await databases.listDocuments<any>(DB_ID, Col.SUBSCRIPTIONS, [
            Query.equal('ownerId', ownerId),
            Query.equal('status', 'active'),
            Query.greaterThan('endDate', now),
            Query.limit(1),
        ]);
        return res.documents[0] ?? null;
    },

    async list(ownerId: string): Promise<Subscription[]> {
        const res = await databases.listDocuments<any>(DB_ID, Col.SUBSCRIPTIONS, [
            Query.equal('ownerId', ownerId),
            Query.orderDesc('$createdAt'),
            Query.limit(10),
        ]);
        return res.documents;
    },

    /** Crée un abonnement en statut pending (en attente de paiement) */
    async create(userId: string, payload: CreateSubscriptionPayload): Promise<Subscription> {
        const { planId, billingCycle, organizationId } = payload;
        const ownerId = organizationId ?? userId;

        const plan = await PlanService.get(planId);
        if (!plan.isActive) throw new Error('Plan non disponible');

        const existing = await SubscriptionService.getActive(ownerId);
        if (existing) throw new Error('Un abonnement actif existe déjà');

        const now = new Date();
        const endDate = _computeEndDate(billingCycle, now);

        return databases.createDocument<any>(
            DB_ID, Col.SUBSCRIPTIONS, ID.unique(),
            {
                ownerId, planId, billingCycle,
                startDate: now.toISOString(),
                endDate: endDate.toISOString(),
                status: 'pending' as SubStatus,
                autoRenew: true,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.read(Role.label('admin')),
                Permission.update(Role.label('admin')),
            ],
        );
    },

    /** Vérifie si un user a un accès premium (via sub personnelle ou org) */
    async hasActiveSub(userId: string, organizationId?: string): Promise<boolean> {
        const personal = await SubscriptionService.getActive(userId);
        if (personal) return true;
        if (organizationId) {
            const orgSub = await SubscriptionService.getActive(organizationId);
            if (orgSub) return true;
        }
        return false;
    },
};

// ─── Paiements ────────────────────────────────────────────────────────────────

export const PaymentService = {

    /** Initie un paiement via la Function Appwrite (CinetPay / Wave) */
    async initiate(userId: string, payload: InitiatePaymentPayload): Promise<{
        paymentId: string;
        amount: number;
        currency: string;
        redirectUrl?: string;
        ussdCode?: string;
    }> {
        const execution = await functions.createExecution(
            Fn.AUTH_HOOKS,
            JSON.stringify({ action: 'initiate_payment', userId, ...payload }),
        );
        const result = JSON.parse(execution.responseBody);
        if (!result.success) throw new Error(result.error ?? 'Erreur paiement');
        return result.data;
    },

    async list(userId: string): Promise<Payment[]> {
        const res = await databases.listDocuments<any>(DB_ID, Col.PAYMENTS, [
            Query.equal('userId', userId),
            Query.orderDesc('$createdAt'),
            Query.limit(20),
        ]);
        return res.documents;
    },

    async createManual(adminId: string, data: {
        subscriptionId: string;
        amount: number;
        reference?: string;
        notes?: string;
    }): Promise<Payment> {
        const execution = await functions.createExecution(
            Fn.AUTH_HOOKS,
            JSON.stringify({ action: 'manual_payment', adminId, ...data }),
        );
        const result = JSON.parse(execution.responseBody);
        if (!result.success) throw new Error(result.error ?? 'Erreur paiement manuel');
        return result.data;
    },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function _computeEndDate(cycle: BillingCycle, from = new Date()): Date {
    const d = new Date(from);
    switch (cycle) {
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        case 'quarterly': d.setMonth(d.getMonth() + 3); break;
        case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
        default: throw new Error(`Cycle inconnu: ${cycle}`);
    }
    return d;
}
