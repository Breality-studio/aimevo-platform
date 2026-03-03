/**
 * AÏMEVO — setup-db.ts
 * =====================
 * Crée toute l'infrastructure Appwrite :
 *   • 1 base de données (aimevo_db)
 *   • 14 collections avec attributs + index
 *   • 5 buckets Storage
 *
 * Usage :
 *   npx tsx setup-db.ts
 *
 * Variables d'environnement (.env ou export) :
 *   NEXT_APPWRITE_ENDPOINT    = https://cloud.appwrite.io/v1
 *   NEXT_APPWRITE_PROJECT_ID  = votre_project_id
 *   NEXT_APPWRITE_API_KEY     = votre_api_key (scopes: databases.write, storage.write)
 */

import { Client, Databases, Storage, Permission, Role, IndexType, Compression } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── Client ──────────────────────────────────────────────────────────────────

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? 'https://sgp.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '69a05607000107d09a69')
  .setKey(process.env.NEXT_APPWRITE_API_KEY ?? 'standard_4be90eb2e9c84af77a5df53d5e9f7a2f32b0c71ca30839c75cb0b535f89467bd16159c5be05d423250038ae71ddaf4bdd6e3528e5377079821a9e62c6b10e1fb994ac70ba99c6148390f0e6b7aa38f533ed05bc9e32906cceb8b6d3432a7762767d713372243c663e6b6616fe12662e304dc41624f4051df0245d8c7271397d3');

const db = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? '69a158cd003562fd9a95';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function tryCreate<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    console.log(`  ✅ ${label}`);
    return result;
  } catch (err: any) {
    if (err?.code === 409) {
      console.log(`  ♻️  ${label} (déjà existant)`);
      return null;
    }
    console.error(`  ❌ ${label}: ${err?.message ?? err}`);
    return null;
  }
}

// ─── Base de données ─────────────────────────────────────────────────────────

async function createDatabase() {
  console.log('\n📦 Base de données...');
  await tryCreate(`Database: ${DB_ID}`, () =>
    db.create(DB_ID, 'AÏMEVO Database')
  );
}

// ─── Collections ─────────────────────────────────────────────────────────────

async function createCollection(
  collectionId: string,
  name: string,
  permissions: string[],
  documentSecurity = true,
) {
  return tryCreate(`Collection: ${collectionId}`, () =>
    db.createCollection(DB_ID, collectionId, name, permissions, documentSecurity)
  );
}

// Attributs — wrappers pour chaque type
const str = (col: string, key: string, size: number, required: boolean, def?: string) =>
  tryCreate(`${col}.${key}`, () => db.createStringAttribute(DB_ID, col, key, size, required, def ?? undefined));

const int = (col: string, key: string, required: boolean, def?: number, min?: number, max?: number) =>
  tryCreate(`${col}.${key}`, () => db.createIntegerAttribute(DB_ID, col, key, required, min, max, def ?? undefined));

const bool = (col: string, key: string, required: boolean, def?: boolean) =>
  tryCreate(`${col}.${key}`, () => db.createBooleanAttribute(DB_ID, col, key, required, def ?? undefined));

const dt = (col: string, key: string, required: boolean) =>
  tryCreate(`${col}.${key}`, () => db.createDatetimeAttribute(DB_ID, col, key, required));

const flt = (col: string, key: string, required: boolean, def?: number, min?: number, max?: number) =>
  tryCreate(`${col}.${key}`, () => db.createFloatAttribute(DB_ID, col, key, required, min, max, def ?? undefined));

const strArr = (col: string, key: string, size: number, required: boolean) =>
  tryCreate(`${col}.${key}[]`, () => db.createStringAttribute(DB_ID, col, key, size, required, undefined, true));

const idx = (col: string, key: string, type: IndexType, attrs: string[], orders?: string[]) =>
  tryCreate(`idx ${col}.${key}`, () => db.createIndex(DB_ID, col, key, type, attrs, orders));

// ─── 1. profiles ─────────────────────────────────────────────────────────────

async function setupProfiles() {
  console.log('\n👤 Collection: profiles');
  await createCollection('profiles', 'Profiles', [
    Permission.read(Role.label('admin')),
    Permission.read(Role.label('professional')),
    Permission.create(Role.users()),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('profiles', 'userId', 36, true);
  await str('profiles', 'firstName', 100, true);
  await str('profiles', 'lastName', 100, true);
  await int('profiles', 'age', false, undefined, 0, 150);
  await str('profiles', 'gender', 50, false);
  await str('profiles', 'profession', 200, false);
  await str('profiles', 'country', 100, false);
  await str('profiles', 'city', 100, false);
  await str('profiles', 'preferredLanguage', 10, false, 'fr');
  await str('profiles', 'avatarFileId', 36, false);
  await str('profiles', 'bio', 1000, false);
  await str('profiles', 'publicKey', 2048, false);
  await str('profiles', 'fcmToken', 500, false);
  await bool('profiles', 'profileCompleted', false, false);
  await bool('profiles', 'isActive', false, true);
  await str('profiles', 'organizationId', 36, false);
  await str('profiles', 'role', 20, false, 'member');
  await wait(1000);

  await idx('profiles', 'idx_userId', IndexType.Unique, ['userId']);
  await idx('profiles', 'idx_role', IndexType.Key, ['role']);
  await idx('profiles', 'idx_orgId', IndexType.Key, ['organizationId']);
  await idx('profiles', 'idx_isActive', IndexType.Key, ['isActive']);
}

// ─── 2. organizations ────────────────────────────────────────────────────────

async function setupOrganizations() {
  console.log('\n🏢 Collection: organizations');
  await createCollection('organizations', 'Organizations', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('organizations', 'name', 200, true);
  await str('organizations', 'type', 20, true);
  await str('organizations', 'ownerId', 36, true);
  await bool('organizations', 'isActive', false, true);
  await bool('organizations', 'isVerified', false, false);
  await str('organizations', 'contactEmail', 200, false);
  await str('organizations', 'country', 100, false);
  await str('organizations', 'logoFileId', 36, false);
  await wait(1000);

  await idx('organizations', 'idx_ownerId', IndexType.Key, ['ownerId']);
  await idx('organizations', 'idx_type', IndexType.Key, ['type']);
  await idx('organizations', 'idx_isActive', IndexType.Key, ['isActive']);
  await idx('organizations', 'idx_isVerified', IndexType.Key, ['isVerified']);
}

// ─── 3. org_members ──────────────────────────────────────────────────────────

async function setupOrgMembers() {
  console.log('\n👥 Collection: org_members');
  await createCollection('org_members', 'Organization Members', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('org_members', 'organizationId', 36, true);
  await str('org_members', 'userId', 36, true);
  await str('org_members', 'role', 20, false, 'member');
  await str('org_members', 'invitedBy', 36, true);
  await wait(1000);

  await idx('org_members', 'idx_orgId', IndexType.Key, ['organizationId']);
  await idx('org_members', 'idx_userId', IndexType.Key, ['userId']);
  await idx('org_members', 'idx_org_user', IndexType.Unique, ['organizationId', 'userId']);
}

// ─── 4. plans ────────────────────────────────────────────────────────────────

async function setupPlans() {
  console.log('\n📋 Collection: plans');
  await createCollection('plans', 'Plans', [
    Permission.read(Role.any()),
    Permission.create(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ], false);
  await wait(500);

  await str('plans', 'name', 200, true);
  await str('plans', 'type', 20, true);
  await int('plans', 'priceMonthly', true, undefined, 0);
  await int('plans', 'priceQuarterly', true, undefined, 0);
  await int('plans', 'priceYearly', true, undefined, 0);
  await str('plans', 'currency', 5, false, 'XOF');

  // Statut et visibilité
  await bool('plans', 'isActive', false, true);             // Affiché ou non dans le catalogue
  await bool('plans', 'isPopular', false, false);           // Badge "Populaire" sur le frontend
  await int('plans', 'sortOrder', false, 0);                // Ordre d’affichage dans la liste

  await strArr('plans', 'features', 500, false);
  await int('plans', 'maxMembers', false, 1, 1);

  // Optionnel : description détaillée et couleur visuelle
  await str('plans', 'description', 1000, false);           // Texte long pour la page d’abonnement
  await str('plans', 'color', 20, false);                   // Couleur badge (ex: "blue", "purple", "amber")
  await wait(1000);

  // Index utiles pour les requêtes courantes
  await idx('plans', 'idx_type', IndexType.Key, ['type']);
  await idx('plans', 'idx_isActive', IndexType.Key, ['isActive']);
  await idx('plans', 'idx_order', IndexType.Key, ['sortOrder']);
  await idx('plans', 'idx_isActive_order', IndexType.Key, ['isActive', 'sortOrder']);
}

// ─── 5. subscriptions ────────────────────────────────────────────────────────
async function setupSubscriptions() {
  console.log('\n💳 Collection: subscriptions');
  await createCollection('subscriptions', 'Subscriptions', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);

  await wait(500);

  await str('subscriptions', 'ownerId', 36, true);
  await str('subscriptions', 'planId', 36, true);
  await str('subscriptions', 'billingCycle', 20, true);
  await dt('subscriptions', 'startDate', true);
  await dt('subscriptions', 'endDate', true);
  await str('subscriptions', 'status', 20, false, 'pending');
  await bool('subscriptions', 'autoRenew', false, true);
  await dt('subscriptions', 'cancelledAt', false);
  await str('subscriptions', 'cancelReason', 500, false);
  await str('subscriptions', 'paymentMethod', 30, false);

  // Champs ajoutés selon vos instructions
  await int('subscriptions', 'amount', true, 0, 0);                    // Montant total de l'abonnement
  await str('subscriptions', 'lastPaymentId', 36, false);              // Dernier paiement réussi
  await dt('subscriptions', 'nextBillingDate', false);                 // Date prévue du prochain prélèvement
  await str('subscriptions', 'providerSubscriptionId', 100, false);    // ID externe chez le fournisseur (KKIAPay, etc.)

  await wait(1000);

  await idx('subscriptions', 'idx_ownerId', IndexType.Key, ['ownerId']);
  await idx('subscriptions', 'idx_planId', IndexType.Key, ['planId']);
  await idx('subscriptions', 'idx_status', IndexType.Key, ['status']);
  await idx('subscriptions', 'idx_endDate', IndexType.Key, ['endDate']);
  await idx('subscriptions', 'idx_owner_status', IndexType.Key, ['ownerId', 'status']);

  // Index supplémentaires utiles pour les nouveaux champs
  await idx('subscriptions', 'idx_nextBillingDate', IndexType.Key, ['nextBillingDate']);
  await idx('subscriptions', 'idx_lastPaymentId', IndexType.Key, ['lastPaymentId']);
}

// ─── 6. payments ─────────────────────────────────────────────────────────────
async function setupPayments() {
  console.log('\n💰 Collection: payments');
  await createCollection('payments', 'Payments', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('payments', 'userId', 36, true);
  await str('payments', 'subscriptionId', 36, true);
  await int('payments', 'amount', true, undefined, 0);
  await str('payments', 'currency', 5, false, 'XOF');
  await str('payments', 'method', 30, true);
  await str('payments', 'providerName', 30, false);                    // Conservé
  await str('payments', 'providerReference', 200, false);
  await str('payments', 'providerTransactionId', 200, false);
  await str('payments', 'status', 20, false, 'pending');
  await str('payments', 'idempotencyKey', 300, true);
  await str('payments', 'failureReason', 500, false);
  await str('payments', 'notes', 1000, false);
  await dt('payments', 'refundedAt', false);

  // Champs ajoutés / renforcés selon vos instructions
  await dt('payments', 'paidAt', false);                               // Date de paiement effectif (null par défaut)
  await str('payments', 'refundId', 100, false);                       // ID du remboursement (null par défaut)
  await int('payments', 'refundedAmount', false, 0);                   // Montant remboursé (0 par défaut)

  await wait(1000);

  await idx('payments', 'idx_userId', IndexType.Key, ['userId']);
  await idx('payments', 'idx_subscriptionId', IndexType.Key, ['subscriptionId']);
  await idx('payments', 'idx_status', IndexType.Key, ['status']);
  await idx('payments', 'idx_idempotencyKey', IndexType.Unique, ['idempotencyKey']);

  // Index supplémentaires utiles
  await idx('payments', 'idx_paidAt', IndexType.Key, ['paidAt']);
  await idx('payments', 'idx_refundId', IndexType.Key, ['refundId']);
}

// ─── 7. resources ────────────────────────────────────────────────────────────

async function setupResources() {
  console.log('\n📚 Collection: resources');
  await createCollection('resources', 'Resources', [
    Permission.read(Role.any()),
    Permission.create(Role.label('admin')),
    Permission.create(Role.label('professional')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('resources', 'parentId', 36, false);
  await str('resources', 'type', 20, true);
  await str('resources', 'language', 10, true);
  await str('resources', 'title', 300, true);
  await str('resources', 'description', 2000, true);
  await str('resources', 'content', 50000, false);
  await str('resources', 'audioFileId', 36, false);
  await str('resources', 'videoFileId', 36, false);
  await str('resources', 'thumbnailFileId', 36, false);
  await int('resources', 'durationSeconds', false);
  await bool('resources', 'isPremium', false, false);
  await strArr('resources', 'tags', 100, false);
  await str('resources', 'createdBy', 36, true);
  await bool('resources', 'isPublished', false, false);
  await dt('resources', 'publishedAt', false);
  await str('resources', 'externalUrl', 2000, false);          // Lien YouTube, PDF, SoundCloud, etc.
  await str('resources', 'iframeUrl', 2000, false);            // Lien iframe spécifique (ex. embed YouTube)
  await str('resources', 'contentBase64', 2000000, false);     // Base64 pour article, audio ou vidéo embarquée
  await str('resources', 'previewImageBase64', 1000000, false); // Image de couverture en base64
  await int('resources', 'viewCount', false, 0, 0);
  await wait(1000);

  await idx('resources', 'idx_type', IndexType.Key, ['type']);
  await idx('resources', 'idx_language', IndexType.Key, ['language']);
  await idx('resources', 'idx_isPremium', IndexType.Key, ['isPremium']);
  await idx('resources', 'idx_isPublished', IndexType.Key, ['isPublished']);
  await idx('resources', 'idx_createdBy', IndexType.Key, ['createdBy']);
  await idx('resources', 'idx_parentId', IndexType.Key, ['parentId']);
  // Indexes supplémentaires (optionnels mais recommandés)
  await idx('resources', 'idx_externalUrl', IndexType.Key, ['externalUrl']);
  await idx('resources', 'idx_isPremium_published', IndexType.Key, ['isPremium', 'isPublished']);

}

// ─── 8. conversations ────────────────────────────────────────────────────────

async function setupConversations() {
  console.log('\n💬 Collection: conversations');
  await createCollection('conversations', 'Conversations', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('conversations', 'memberId', 36, true);
  await str('conversations', 'professionalId', 36, true);
  await str('conversations', 'memberPublicKey', 2048, false);
  await str('conversations', 'proPublicKey', 2048, false);
  await str('conversations', 'status', 20, false, 'open');
  await dt('conversations', 'lastMessageAt', false);
  await str('conversations', 'lastMessagePreview', 100, false);
  await int('conversations', 'memberUnread', false, 0, 0);
  await int('conversations', 'proUnread', false, 0, 0);
  await wait(1000);

  await idx('conversations', 'idx_memberId', IndexType.Key, ['memberId']);
  await idx('conversations', 'idx_professionalId', IndexType.Key, ['professionalId']);
  await idx('conversations', 'idx_status', IndexType.Key, ['status']);
  await idx('conversations', 'idx_pair', IndexType.Unique, ['memberId', 'professionalId']);
  await idx('conversations', 'idx_lastMsg', IndexType.Key, ['lastMessageAt']);
}

// ─── 9. messages ─────────────────────────────────────────────────────────────

async function setupMessages() {
  console.log('\n✉️  Collection: messages');
  await createCollection('messages', 'Messages', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('messages', 'conversationId', 36, true);
  await str('messages', 'senderId', 36, true);
  await str('messages', 'encryptedContent', 1000, true);
  await str('messages', 'iv', 100, false);
  await str('messages', 'type', 10, false, 'text');
  await str('messages', 'audioFileId', 36, false);
  await bool('messages', 'isRead', false, false);
  await wait(1000);

  await idx('messages', 'idx_conversationId', IndexType.Key, ['conversationId']);
  await idx('messages', 'idx_senderId', IndexType.Key, ['senderId']);
  await idx('messages', 'idx_conv_created', IndexType.Key, ['conversationId', '$createdAt']);
}

// ─── 10. tests ───────────────────────────────────────────────────────────────

async function setupTests() {
  console.log('\n🧠 Collection: tests');
  await createCollection('tests', 'Tests', [
    Permission.read(Role.users()),
    Permission.create(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ], false);
  await wait(500);

  await str('tests', 'type', 20, true);
  await str('tests', 'title', 300, true);
  await str('tests', 'description', 2000, true);
  await str('tests', 'language', 10, false, 'fr');
  await str('tests', 'questionsJson', 50000, true);
  await int('tests', 'passingScore', false, 60, 0, 100);
  await int('tests', 'estimatedMinutes', false, 10);
  await bool('tests', 'isPremium', false, false);
  await bool('tests', 'isPublished', false, false);
  await str('tests', 'createdBy', 36, true);
  await wait(1000);

  await idx('tests', 'idx_type', IndexType.Key, ['type']);
  await idx('tests', 'idx_isPublished', IndexType.Key, ['isPublished']);
  await idx('tests', 'idx_language', IndexType.Key, ['language']);
}

// ─── 11. test_attempts ───────────────────────────────────────────────────────

async function setupTestAttempts() {
  console.log('\n📝 Collection: test_attempts');
  await createCollection('test_attempts', 'Test Attempts', [
    Permission.read(Role.label('admin')),
    Permission.read(Role.label('professional')),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
    Permission.update(Role.label('professional')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('test_attempts', 'userId', 36, true);
  await str('test_attempts', 'testId', 36, true);
  await str('test_attempts', 'answersJson', 50000, false, '[]');
  await flt('test_attempts', 'score', false, undefined, 0, 100);
  await str('test_attempts', 'status', 30, false, 'in_progress');
  await dt('test_attempts', 'startedAt', true);
  await dt('test_attempts', 'completedAt', false);
  await dt('test_attempts', 'reviewedAt', false);
  await str('test_attempts', 'professionalId', 36, false);
  await str('test_attempts', 'feedback', 5000, false);
  await wait(1000);

  await idx('test_attempts', 'idx_userId', IndexType.Key, ['userId']);
  await idx('test_attempts', 'idx_testId', IndexType.Key, ['testId']);
  await idx('test_attempts', 'idx_status', IndexType.Key, ['status']);
  await idx('test_attempts', 'idx_professionalId', IndexType.Key, ['professionalId']);
  await idx('test_attempts', 'idx_user_status', IndexType.Key, ['userId', 'status']);
}

// ─── 12. notifications ───────────────────────────────────────────────────────

async function setupNotifications() {
  console.log('\n🔔 Collection: notifications');
  await createCollection('notifications', 'Notifications', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.label('admin')),
    Permission.update(Role.users()),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('notifications', 'userId', 36, true);
  await str('notifications', 'type', 50, true);
  await str('notifications', 'title', 200, true);
  await str('notifications', 'body', 500, true);
  await str('notifications', 'dataJson', 1000, false, '{}');
  await bool('notifications', 'isRead', false, false);
  await wait(1000);

  await idx('notifications', 'idx_userId', IndexType.Key, ['userId']);
  await idx('notifications', 'idx_isRead', IndexType.Key, ['isRead']);
  await idx('notifications', 'idx_user_isRead', IndexType.Key, ['userId', 'isRead']);
}

// ─── 13. otp_codes ───────────────────────────────────────────────────────────

async function setupOtpCodes() {
  console.log('\n🔑 Collection: otp_codes');
  await createCollection('otp_codes', 'OTP Codes', [
    Permission.delete(Role.label('admin')),
  ], false);
  await wait(500);

  await str('otp_codes', 'userId', 36, true);
  await str('otp_codes', 'code', 10, true);
  await dt('otp_codes', 'expiresAt', true);
  await bool('otp_codes', 'used', false, false);
  await wait(1000);

  await idx('otp_codes', 'idx_userId', IndexType.Key, ['userId']);
  await idx('otp_codes', 'idx_expiresAt', IndexType.Key, ['expiresAt']);
}

// ─── 14. audit_logs ──────────────────────────────────────────────────────────

async function setupAuditLogs() {
  console.log('\n📋 Collection: audit_logs');
  await createCollection('audit_logs', 'Audit Logs', [
    Permission.read(Role.label('admin')),
  ], false);
  await wait(500);

  await str('audit_logs', 'adminId', 36, true);
  await str('audit_logs', 'action', 100, true);
  await str('audit_logs', 'targetId', 36, true);
  await str('audit_logs', 'targetType', 50, true);
  await str('audit_logs', 'metaJson', 2000, false, '{}');
  await str('audit_logs', 'ip', 50, false);
  await wait(1000);

  await idx('audit_logs', 'idx_adminId', IndexType.Key, ['adminId']);
  await idx('audit_logs', 'idx_action', IndexType.Key, ['action']);
  await idx('audit_logs', 'idx_targetId', IndexType.Key, ['targetId']);
}

// ─── 15. events (ateliers) ───────────────────────────────────────────────────
async function setupEvents() {
  console.log('\n📅 Collection: events');
  await createCollection('events', 'Ateliers & Événements', [
    Permission.read(Role.any()),
    Permission.create(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]);
  await wait(500);

  await str('events', 'title', 300, true);
  await str('events', 'description', 5000, true);
  await str('events', 'type', 20, true);           // online | presentiel
  await str('events', 'location', 500, false);     // lieu ou lien Zoom
  await dt('events', 'startDate', true);
  await dt('events', 'endDate', false);
  await int('events', 'price', false, 0, 0);
  await int('events', 'maxPlaces', false, 50);
  await int('events', 'remainingPlaces', false, 50);
  await bool('events', 'isPublished', false, false);
  await str('events', 'createdBy', 36, true);
  await strArr('events', 'tags', 100, false);

  await wait(1000);
  await idx('events', 'idx_type', IndexType.Key, ['type']);
  await idx('events', 'idx_startDate', IndexType.Key, ['startDate']);
  await idx('events', 'idx_isPublished', IndexType.Key, ['isPublished']);
}

// ─── 16. event_registrations ─────────────────────────────────────────────────
async function setupEventRegistrations() {
  console.log('\n🎟️  Collection: event_registrations');
  await createCollection('event_registrations', 'Inscriptions Ateliers', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.update(Role.label('admin')),
  ]);
  await wait(500);

  await str('event_registrations', 'eventId', 36, true);
  await str('event_registrations', 'userId', 36, true);
  await str('event_registrations', 'status', 20, false, 'confirmed'); // pending | confirmed | cancelled
  await str('event_registrations', 'qrFileId', 36, false);
  await dt('event_registrations', 'registeredAt', true);
  await str('event_registrations', 'paymentId', 36, false);

  await wait(1000);
  await idx('event_registrations', 'idx_event', IndexType.Key, ['eventId']);
  await idx('event_registrations', 'idx_user', IndexType.Key, ['userId']);
  await idx('event_registrations', 'idx_event_user', IndexType.Unique, ['eventId', 'userId']);
}

// ─── 17. user_progress ───────────────────────────────────────────────────────
async function setupUserProgress() {
  console.log('\n📊 Collection: user_progress');
  await createCollection('user_progress', 'Progression Contenus', [
    Permission.read(Role.label('admin')),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
  ]);
  await wait(500);

  await str('user_progress', 'userId', 36, true);
  await str('user_progress', 'resourceId', 36, true);
  await int('user_progress', 'progressSeconds', false, 0);
  await int('user_progress', 'lastPosition', false, 0);
  await dt('user_progress', 'lastUpdated', true);

  await wait(1000);
  await idx('user_progress', 'idx_user', IndexType.Key, ['userId']);
  await idx('user_progress', 'idx_resource', IndexType.Key, ['resourceId']);
  await idx('user_progress', 'idx_user_resource', IndexType.Unique, ['userId', 'resourceId']);
}

// ─── Buckets Storage ─────────────────────────────────────────────────────────

// async function setupBuckets() {
//   console.log('\n🗂️  Buckets Storage...');

//   await tryCreate('Bucket: avatars', () =>
//     storage.createBucket(
//       'avatars', 'User Avatars',
//       [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
//       true, true, 5 * 1024 * 1024,
//       ['jpg','jpeg','png','webp'],
//       'none', false, false,
//     )
//   );

//   await tryCreate('Bucket: audio', () =>
//     storage.createBucket(
//       'audio', 'Resource Audio',
//       [Permission.read(Role.users()), Permission.create(Role.label('admin')), Permission.create(Role.label('professional')), Permission.update(Role.label('admin')), Permission.delete(Role.label('admin'))],
//       true, true, 100 * 1024 * 1024,
//       ['mp3','mp4','ogg','wav','m4a'],
//       'none', true, false,
//     )
//   );

//   await tryCreate('Bucket: video', () =>
//     storage.createBucket(
//       'video', 'Resource Video',
//       [Permission.read(Role.users()), Permission.create(Role.label('admin')), Permission.update(Role.label('admin')), Permission.delete(Role.label('admin'))],
//       true, true, 500 * 1024 * 1024,
//       ['mp4','webm','mov'],
//       'none', true, false,
//     )
//   );

//   await tryCreate('Bucket: thumbnails', () =>
//     storage.createBucket(
//       'thumbnails', 'Thumbnails',
//       [Permission.read(Role.any()), Permission.create(Role.label('admin')), Permission.create(Role.label('professional')), Permission.update(Role.label('admin')), Permission.delete(Role.label('admin'))],
//       false, true, 2 * 1024 * 1024,
//       ['jpg','jpeg','png','webp'],
//       'none', false, false,
//     )
//   );

//   await tryCreate('Bucket: chat_audio', () =>
//     storage.createBucket(
//       'chat_audio', 'Chat Audio Messages',
//       [Permission.read(Role.users()), Permission.create(Role.users()), Permission.delete(Role.users())],
//       true, true, 10 * 1024 * 1024,
//       ['mp3','ogg','m4a','webm'],
//       'none', true, false,
//     )
//   );
// }

async function setupBuckets() {
  console.log('\n🗂️  Buckets Storage...');

  await tryCreate('Bucket: media', () =>
    storage.createBucket(
      'media',
      'Application Media Storage',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      true,  // fileSecurity
      true,  // enabled
      500 * 1024 * 1024, // 500MB max per file
      [
        // Images
        'jpg', 'jpeg', 'png', 'webp',
        // Audio
        'mp3', 'ogg', 'm4a', 'wav', 'webm',
        // Video
        'mp4', 'mov', 'webm'
      ],
      Compression.None,
      true,
      false
    )
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 AÏMEVO — Setup Appwrite\n');
  console.log(`   Endpoint   : ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
  console.log(`   Project ID : ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
  console.log(`   Database   : ${DB_ID}\n`);

  // if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.NEXT_APPWRITE_API_KEY) {
  //   console.error('❌ Variables manquantes : APPWRITE_PROJECT_ID et APPWRITE_API_KEY requis');
  //   process.exit(1);
  // }

  const start = Date.now();

  //   await createDatabase();

  await setupProfiles();
  await setupOrganizations();
  await setupOrgMembers();
  await setupPlans();
  await setupSubscriptions();
  await setupPayments();
  await setupResources();
  await setupConversations();
  await setupMessages();
  await setupTests();
  await setupTestAttempts();
  await setupNotifications();
  await setupOtpCodes();
  await setupAuditLogs();
  await setupEvents();
  await setupEventRegistrations();
  await setupUserProgress();
  await setupBuckets();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n✅ Setup terminé en ${elapsed}s`);
  console.log('\n📋 Prochaine étape :');
  console.log('   npx tsx seed.ts   → Insérer plans + admin + données initiales\n');
}

main().catch(err => {
  console.error('\n❌ Setup échoué:', err?.message ?? err);
  process.exit(1);
});