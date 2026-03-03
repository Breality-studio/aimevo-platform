/**
 * AÏMEVO – Appwrite Database Schema
 * ===================================
 * Database ID : aimevodb
 *
 * Collections et leurs attributs, index et permissions.
 * À importer via Appwrite Console ou CLI :
 *   appwrite databases create --databaseId aimevo_db --name "AÏMEVO"
 *
 * Permissions Appwrite :
 *   Role.any()         → tout le monde (non auth)
 *   Role.users()       → tout utilisateur connecté
 *   Role.user(id)      → utilisateur spécifique
 *   Role.team(id)      → membres d'une équipe (= rôles)
 *   Role.label(name)   → utilisateurs avec ce label
 *
 * Labels utilisés comme RBAC :
 *   "admin"            → administrateurs
 *   "professional"     → professionnels validés
 *   "member"           → membres standard
 */

export const DATABASE_ID = 'aimevodb';

// ─── COLLECTION IDs ───────────────────────────────────────────────────────────
export const Collections = {
  PROFILES:             'profiles',
  ORGANIZATIONS:        'organizations',
  ORG_MEMBERS:          'org_members',
  PLANS:                'plans',
  SUBSCRIPTIONS:        'subscriptions',
  PAYMENTS:             'payments',
  RESOURCES:            'resources',
  CONVERSATIONS:        'conversations',
  MESSAGES:             'messages',
  TESTS:                'tests',
  TEST_ATTEMPTS:        'test_attempts',
  NOTIFICATIONS:        'notifications',
  AUDIT_LOGS:           'audit_logs',
  OTP_CODES:            'otp_codes',
} as const;

// ─── SCHEMA DEFINITIONS ───────────────────────────────────────────────────────

/**
 * profiles
 * NB: L'auth Appwrite gère déjà email/name/prefs → ici les données métier.
 * $id = userId Appwrite (pour jointure directe)
 */
export const ProfilesSchema = {
  collectionId: Collections.PROFILES,
  name:         'Profiles',
  permissions: {
    read:   ['label:admin', 'label:professional'],  // + self via document-level
    create: ['users'],
    update: [],  // document-level only
    delete: ['label:admin'],
  },
  documentSecurity: true,  // permet permissions document-level
  attributes: [
    { key: 'userId',            type: 'string',  size: 36,   required: true,  default: null },
    { key: 'firstName',         type: 'string',  size: 100,  required: true,  default: null },
    { key: 'lastName',          type: 'string',  size: 100,  required: true,  default: null },
    { key: 'age',               type: 'integer', required: false, min: 0, max: 150, default: null },
    { key: 'gender',            type: 'string',  size: 50,   required: false, default: null },
    { key: 'profession',        type: 'string',  size: 200,  required: false, default: null },
    { key: 'country',           type: 'string',  size: 100,  required: false, default: null },
    { key: 'city',              type: 'string',  size: 100,  required: false, default: null },
    { key: 'preferredLanguage', type: 'string',  size: 10,   required: true,  default: 'fr' },
    { key: 'avatarFileId',      type: 'string',  size: 36,   required: false, default: null },
    { key: 'bio',               type: 'string',  size: 1000, required: false, default: null },
    { key: 'publicKey',         type: 'string',  size: 2048, required: false, default: null },  // E2EE
    { key: 'fcmToken',          type: 'string',  size: 500,  required: false, default: null },
    { key: 'profileCompleted',  type: 'boolean', required: true,  default: false },
    { key: 'isActive',          type: 'boolean', required: true,  default: true  },
    { key: 'organizationId',    type: 'string',  size: 36,   required: false, default: null },
    { key: 'role',              type: 'string',  size: 20,   required: true,  default: 'member' },
    // role: 'member' | 'professional' | 'admin' (redondant avec label, pour queries)
  ],
  indexes: [
    { key: 'idx_userId',   type: 'unique', attributes: ['userId'] },
    { key: 'idx_role',     type: 'key',    attributes: ['role'] },
    { key: 'idx_orgId',    type: 'key',    attributes: ['organizationId'] },
    { key: 'idx_isActive', type: 'key',    attributes: ['isActive'] },
  ],
};

/**
 * organizations
 */
export const OrganizationsSchema = {
  collectionId: Collections.ORGANIZATIONS,
  name:         'Organizations',
  documentSecurity: true,
  permissions: {
    read:   ['users'],
    create: ['users'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'name',         type: 'string',  size: 200,  required: true  },
    { key: 'type',         type: 'string',  size: 20,   required: true  },  // enterprise | ngo
    { key: 'ownerId',      type: 'string',  size: 36,   required: true  },
    { key: 'isActive',     type: 'boolean', required: true,  default: true  },
    { key: 'isVerified',   type: 'boolean', required: true,  default: false },
    { key: 'contactEmail', type: 'string',  size: 200,  required: false, default: null },
    { key: 'country',      type: 'string',  size: 100,  required: false, default: null },
    { key: 'logoFileId',   type: 'string',  size: 36,   required: false, default: null },
  ],
  indexes: [
    { key: 'idx_ownerId',    type: 'key',    attributes: ['ownerId'] },
    { key: 'idx_type',       type: 'key',    attributes: ['type'] },
    { key: 'idx_isActive',   type: 'key',    attributes: ['isActive'] },
    { key: 'idx_isVerified', type: 'key',    attributes: ['isVerified'] },
  ],
};

/**
 * org_members
 */
export const OrgMembersSchema = {
  collectionId: Collections.ORG_MEMBERS,
  name:         'Organization Members',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin'],
    create: ['label:admin'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'organizationId', type: 'string', size: 36, required: true },
    { key: 'userId',         type: 'string', size: 36, required: true },
    { key: 'role',           type: 'string', size: 20, required: true, default: 'member' }, // manager | member
    { key: 'invitedBy',      type: 'string', size: 36, required: true },
  ],
  indexes: [
    { key: 'idx_orgId',      type: 'key',    attributes: ['organizationId'] },
    { key: 'idx_userId',     type: 'key',    attributes: ['userId'] },
    { key: 'idx_org_user',   type: 'unique', attributes: ['organizationId', 'userId'] },
  ],
};

/**
 * plans
 * Créés via seeder, lecture publique
 */
export const PlansSchema = {
  collectionId: Collections.PLANS,
  name:         'Plans',
  permissions: {
    read:   ['any'],          // public
    create: ['label:admin'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'name',             type: 'string',  size: 200, required: true  },
    { key: 'type',             type: 'string',  size: 20,  required: true  },  // individual|enterprise|ngo
    { key: 'priceMonthly',     type: 'integer', required: true,  min: 0     },
    { key: 'priceQuarterly',   type: 'integer', required: true,  min: 0     },
    { key: 'priceYearly',      type: 'integer', required: true,  min: 0     },
    { key: 'currency',         type: 'string',  size: 5,   required: true,  default: 'XOF' },
    { key: 'features',         type: 'string[]', required: true             },
    { key: 'maxMembers',       type: 'integer', required: false, default: 1 },
    { key: 'isActive',         type: 'boolean', required: true,  default: true },
    { key: 'sortOrder',        type: 'integer', required: false, default: 0    },
  ],
  indexes: [
    { key: 'idx_type',     type: 'key',    attributes: ['type'] },
    { key: 'idx_isActive', type: 'key',    attributes: ['isActive'] },
    { key: 'idx_order',    type: 'key',    attributes: ['sortOrder'] },
  ],
};

/**
 * subscriptions
 */
export const SubscriptionsSchema = {
  collectionId: Collections.SUBSCRIPTIONS,
  name:         'Subscriptions',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin'],  // + owner via document
    create: ['users'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'ownerId',       type: 'string',  size: 36,  required: true  },  // userId or orgId
    { key: 'planId',        type: 'string',  size: 36,  required: true  },
    { key: 'billingCycle',  type: 'string',  size: 20,  required: true  },  // monthly|quarterly|yearly
    { key: 'startDate',     type: 'datetime',required: true  },
    { key: 'endDate',       type: 'datetime',required: true  },
    { key: 'status',        type: 'string',  size: 20,  required: true,  default: 'pending' },
    // status: pending|active|expired|cancelled
    { key: 'autoRenew',     type: 'boolean', required: true,  default: true  },
    { key: 'cancelledAt',   type: 'datetime',required: false, default: null  },
    { key: 'cancelReason',  type: 'string',  size: 500, required: false, default: null },
    { key: 'paymentMethod', type: 'string',  size: 30,  required: false, default: null },
  ],
  indexes: [
    { key: 'idx_ownerId',     type: 'key', attributes: ['ownerId'] },
    { key: 'idx_planId',      type: 'key', attributes: ['planId'] },
    { key: 'idx_status',      type: 'key', attributes: ['status'] },
    { key: 'idx_endDate',     type: 'key', attributes: ['endDate'] },
    { key: 'idx_owner_status',type: 'key', attributes: ['ownerId', 'status'] },
  ],
};

/**
 * payments
 */
export const PaymentsSchema = {
  collectionId: Collections.PAYMENTS,
  name:         'Payments',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin'],  // + owner via document
    create: ['users'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'userId',               type: 'string',  size: 36,  required: true  },
    { key: 'subscriptionId',       type: 'string',  size: 36,  required: true  },
    { key: 'amount',               type: 'integer', required: true,  min: 0     },
    { key: 'currency',             type: 'string',  size: 5,   required: true,  default: 'XOF' },
    { key: 'method',               type: 'string',  size: 30,  required: true  },  // mobile_money|card|manual
    { key: 'providerName',         type: 'string',  size: 30,  required: false, default: null },
    { key: 'providerReference',    type: 'string',  size: 200, required: false, default: null },
    { key: 'providerTransactionId',type: 'string',  size: 200, required: false, default: null },
    { key: 'status',               type: 'string',  size: 20,  required: true,  default: 'pending' },
    // status: pending|success|failed|refunded
    { key: 'idempotencyKey',       type: 'string',  size: 300, required: true  },
    { key: 'failureReason',        type: 'string',  size: 500, required: false, default: null },
    { key: 'notes',                type: 'string',  size: 1000,required: false, default: null },
    { key: 'refundedAt',           type: 'datetime',required: false, default: null },
  ],
  indexes: [
    { key: 'idx_userId',          type: 'key',    attributes: ['userId'] },
    { key: 'idx_subscriptionId',  type: 'key',    attributes: ['subscriptionId'] },
    { key: 'idx_status',          type: 'key',    attributes: ['status'] },
    { key: 'idx_idempotencyKey',  type: 'unique', attributes: ['idempotencyKey'] },
  ],
};

/**
 * resources
 */
export const ResourcesSchema = {
  collectionId: Collections.RESOURCES,
  name:         'Resources',
  documentSecurity: true,
  permissions: {
    read:   ['any'],           // filtrée par isPublished+isPremium dans les requêtes
    create: ['label:admin', 'label:professional'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'parentId',         type: 'string',  size: 36,   required: false, default: null },
    { key: 'type',             type: 'string',  size: 20,   required: true  },  // audio|video|module|article
    { key: 'language',         type: 'string',  size: 10,   required: true  },  // fr|en|fon|goun|mina
    { key: 'title',            type: 'string',  size: 300,  required: true  },
    { key: 'description',      type: 'string',  size: 2000, required: true  },
    { key: 'content',          type: 'string',  size: 50000,required: false, default: null },  // Article markdown
    { key: 'audioFileId',      type: 'string',  size: 36,   required: false, default: null },  // Appwrite Storage
    { key: 'videoFileId',      type: 'string',  size: 36,   required: false, default: null },
    { key: 'thumbnailFileId',  type: 'string',  size: 36,   required: false, default: null },
    { key: 'durationSeconds',  type: 'integer', required: false, default: null },
    { key: 'isPremium',        type: 'boolean', required: true,  default: false },
    { key: 'tags',             type: 'string[]',required: false, default: []   },
    { key: 'createdBy',        type: 'string',  size: 36,   required: true  },
    { key: 'isPublished',      type: 'boolean', required: true,  default: false },
    { key: 'publishedAt',      type: 'datetime',required: false, default: null  },
    { key: 'viewCount',        type: 'integer', required: true,  default: 0     },
  ],
  indexes: [
    { key: 'idx_type',        type: 'key', attributes: ['type'] },
    { key: 'idx_language',    type: 'key', attributes: ['language'] },
    { key: 'idx_isPremium',   type: 'key', attributes: ['isPremium'] },
    { key: 'idx_isPublished', type: 'key', attributes: ['isPublished'] },
    { key: 'idx_createdBy',   type: 'key', attributes: ['createdBy'] },
    { key: 'idx_parentId',    type: 'key', attributes: ['parentId'] },
    { key: 'idx_filter',      type: 'key', attributes: ['isPublished', 'isPremium', 'language'] },
  ],
};

/**
 * conversations (E2EE chat)
 */
export const ConversationsSchema = {
  collectionId: Collections.CONVERSATIONS,
  name:         'Conversations',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin'],  // + participants via document
    create: ['users'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'memberId',          type: 'string',  size: 36,   required: true  },
    { key: 'professionalId',    type: 'string',  size: 36,   required: true  },
    { key: 'memberPublicKey',   type: 'string',  size: 2048, required: false, default: null },
    { key: 'proPublicKey',      type: 'string',  size: 2048, required: false, default: null },
    { key: 'status',            type: 'string',  size: 20,   required: true,  default: 'open' }, // open|closed
    { key: 'lastMessageAt',     type: 'datetime',required: false, default: null },
    { key: 'lastMessagePreview',type: 'string',  size: 100,  required: false, default: null },
    { key: 'memberUnread',      type: 'integer', required: true,  default: 0   },
    { key: 'proUnread',         type: 'integer', required: true,  default: 0   },
  ],
  indexes: [
    { key: 'idx_memberId',       type: 'key',    attributes: ['memberId'] },
    { key: 'idx_professionalId', type: 'key',    attributes: ['professionalId'] },
    { key: 'idx_status',         type: 'key',    attributes: ['status'] },
    { key: 'idx_pair',           type: 'unique', attributes: ['memberId', 'professionalId'] },
    { key: 'idx_lastMsg',        type: 'key',    attributes: ['lastMessageAt'] },
  ],
};

/**
 * messages (E2EE - server never sees plaintext)
 */
export const MessagesSchema = {
  collectionId: Collections.MESSAGES,
  name:         'Messages',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin'],  // + participants via document
    create: ['users'],
    update: [],               // immutable
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'conversationId',   type: 'string',  size: 36,   required: true  },
    { key: 'senderId',         type: 'string',  size: 36,   required: true  },
    { key: 'encryptedContent', type: 'string',  size: 10000,required: true  },  // AES-GCM ciphertext base64
    { key: 'iv',               type: 'string',  size: 100,  required: false, default: null },  // AES-GCM IV
    { key: 'type',             type: 'string',  size: 10,   required: true,  default: 'text' }, // text|audio
    { key: 'audioFileId',      type: 'string',  size: 36,   required: false, default: null },
    { key: 'isRead',           type: 'boolean', required: true,  default: false },
  ],
  indexes: [
    { key: 'idx_conversationId', type: 'key', attributes: ['conversationId'] },
    { key: 'idx_senderId',       type: 'key', attributes: ['senderId'] },
    { key: 'idx_conv_created',   type: 'key', attributes: ['conversationId', '$createdAt'] },
  ],
};

/**
 * tests
 */
export const TestsSchema = {
  collectionId: Collections.TESTS,
  name:         'Tests',
  permissions: {
    read:   ['users'],
    create: ['label:admin'],
    update: ['label:admin'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'type',             type: 'string',  size: 20,    required: true  },  // auto|supervised
    { key: 'title',            type: 'string',  size: 300,   required: true  },
    { key: 'description',      type: 'string',  size: 2000,  required: true  },
    { key: 'language',         type: 'string',  size: 10,    required: true, default: 'fr' },
    { key: 'questionsJson',    type: 'string',  size: 50000, required: true  },  // JSON stringified
    { key: 'passingScore',     type: 'integer', required: true,  default: 60 },
    { key: 'estimatedMinutes', type: 'integer', required: false, default: 10 },
    { key: 'isPremium',        type: 'boolean', required: true,  default: false },
    { key: 'isPublished',      type: 'boolean', required: true,  default: false },
    { key: 'createdBy',        type: 'string',  size: 36,    required: true  },
  ],
  indexes: [
    { key: 'idx_type',        type: 'key', attributes: ['type'] },
    { key: 'idx_isPublished', type: 'key', attributes: ['isPublished'] },
    { key: 'idx_language',    type: 'key', attributes: ['language'] },
  ],
};

/**
 * test_attempts
 */
export const TestAttemptsSchema = {
  collectionId: Collections.TEST_ATTEMPTS,
  name:         'Test Attempts',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin', 'label:professional'],  // + owner via document
    create: ['users'],
    update: ['label:admin', 'label:professional'],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'userId',         type: 'string',  size: 36,    required: true  },
    { key: 'testId',         type: 'string',  size: 36,    required: true  },
    { key: 'answersJson',    type: 'string',  size: 50000, required: true, default: '[]' },  // JSON
    { key: 'score',          type: 'float',   required: false, default: null, min: 0, max: 100 },
    { key: 'status',         type: 'string',  size: 30,    required: true, default: 'in_progress' },
    // in_progress | pending_review | reviewed | completed
    { key: 'startedAt',      type: 'datetime',required: true  },
    { key: 'completedAt',    type: 'datetime',required: false, default: null },
    { key: 'reviewedAt',     type: 'datetime',required: false, default: null },
    { key: 'professionalId', type: 'string',  size: 36,    required: false, default: null },
    { key: 'feedback',       type: 'string',  size: 5000,  required: false, default: null },
  ],
  indexes: [
    { key: 'idx_userId',         type: 'key', attributes: ['userId'] },
    { key: 'idx_testId',         type: 'key', attributes: ['testId'] },
    { key: 'idx_status',         type: 'key', attributes: ['status'] },
    { key: 'idx_professionalId', type: 'key', attributes: ['professionalId'] },
    { key: 'idx_user_status',    type: 'key', attributes: ['userId', 'status'] },
  ],
};

/**
 * notifications
 */
export const NotificationsSchema = {
  collectionId: Collections.NOTIFICATIONS,
  name:         'Notifications',
  documentSecurity: true,
  permissions: {
    read:   ['label:admin'],  // + owner via document
    create: ['label:admin'],
    update: ['users'],        // pour marquer lu
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'userId',  type: 'string',  size: 36,   required: true  },
    { key: 'type',    type: 'string',  size: 50,   required: true  },
    { key: 'title',   type: 'string',  size: 200,  required: true  },
    { key: 'body',    type: 'string',  size: 500,  required: true  },
    { key: 'dataJson',type: 'string',  size: 1000, required: false, default: '{}' },
    { key: 'isRead',  type: 'boolean', required: true, default: false },
  ],
  indexes: [
    { key: 'idx_userId',       type: 'key', attributes: ['userId'] },
    { key: 'idx_isRead',       type: 'key', attributes: ['isRead'] },
    { key: 'idx_user_isRead',  type: 'key', attributes: ['userId', 'isRead'] },
  ],
};

/**
 * otp_codes (for email verification)
 * TTL via scheduled cleanup function
 */
export const OtpCodesSchema = {
  collectionId: Collections.OTP_CODES,
  name:         'OTP Codes',
  permissions: {
    read:   [],              // Functions only
    create: [],              // Functions only
    update: [],
    delete: ['label:admin'],
  },
  attributes: [
    { key: 'userId',    type: 'string',  size: 36,  required: true  },
    { key: 'code',      type: 'string',  size: 10,  required: true  },
    { key: 'expiresAt', type: 'datetime',required: true  },
    { key: 'used',      type: 'boolean', required: true, default: false },
  ],
  indexes: [
    { key: 'idx_userId',    type: 'key',    attributes: ['userId'] },
    { key: 'idx_expiresAt', type: 'key',    attributes: ['expiresAt'] },
  ],
};

/**
 * audit_logs
 */
export const AuditLogsSchema = {
  collectionId: Collections.AUDIT_LOGS,
  name:         'Audit Logs',
  permissions: {
    read:   ['label:admin'],
    create: [],  // Functions only
    update: [],
    delete: [],
  },
  attributes: [
    { key: 'adminId',    type: 'string', size: 36,   required: true  },
    { key: 'action',     type: 'string', size: 100,  required: true  },
    { key: 'targetId',   type: 'string', size: 36,   required: true  },
    { key: 'targetType', type: 'string', size: 50,   required: true  },
    { key: 'metaJson',   type: 'string', size: 2000, required: false, default: '{}' },
    { key: 'ip',         type: 'string', size: 50,   required: false, default: null },
  ],
  indexes: [
    { key: 'idx_adminId',    type: 'key', attributes: ['adminId'] },
    { key: 'idx_action',     type: 'key', attributes: ['action'] },
    { key: 'idx_targetId',   type: 'key', attributes: ['targetId'] },
  ],
};

// ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────

export const Buckets = {
  AVATARS:    'avatars',
  AUDIO:      'audio',
  VIDEO:      'video',
  THUMBNAILS: 'thumbnails',
  CHAT_AUDIO: 'chat_audio',
} as const;

export const BucketsSchema = [
  {
    bucketId:     Buckets.AVATARS,
    name:         'User Avatars',
    permissions:  { read: ['users'], write: ['users'] },
    fileSecurity: true,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maximumFileSize: 5 * 1024 * 1024, // 5MB
    encryption: false,
    antivirus:  false,
  },
  {
    bucketId:     Buckets.AUDIO,
    name:         'Resource Audio',
    permissions:  { read: ['label:admin', 'label:professional'], write: ['label:admin', 'label:professional'] },
    fileSecurity: true,
    allowedFileExtensions: ['mp3', 'mp4', 'ogg', 'wav', 'm4a'],
    maximumFileSize: 100 * 1024 * 1024, // 100MB
    encryption: true,
    antivirus:  false,
  },
  {
    bucketId:     Buckets.VIDEO,
    name:         'Resource Video',
    permissions:  { read: ['label:admin', 'label:professional'], write: ['label:admin'] },
    fileSecurity: true,
    allowedFileExtensions: ['mp4', 'webm', 'mov'],
    maximumFileSize: 500 * 1024 * 1024, // 500MB
    encryption: true,
    antivirus:  false,
  },
  {
    bucketId:     Buckets.THUMBNAILS,
    name:         'Thumbnails',
    permissions:  { read: ['any'], write: ['label:admin', 'label:professional'] },
    fileSecurity: false,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maximumFileSize: 2 * 1024 * 1024, // 2MB
    encryption: false,
    antivirus:  false,
  },
  {
    bucketId:     Buckets.CHAT_AUDIO,
    name:         'Chat Audio Messages',
    permissions:  { read: ['users'], write: ['users'] },
    fileSecurity: true,
    allowedFileExtensions: ['mp3', 'ogg', 'm4a', 'webm'],
    maximumFileSize: 10 * 1024 * 1024, // 10MB
    encryption: true,
    antivirus:  false,
  },
];