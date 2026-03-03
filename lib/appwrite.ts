/**
 * lib/appwrite.ts — Client Appwrite Web (Next.js)
 * ================================================
 * Point central de toute communication avec Appwrite.
 * À importer dans les services uniquement, jamais directement dans les composants.
 *
 * ⚠️  Fichier SPÉCIFIQUE WEB.
 *     Mobile → react-native-appwrite avec .setPlatform()
 *
 * .env.local :
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT   = https://cloud.appwrite.io/v1
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID = votre_project_id
 */

import {
  Client,
  Account,
  Databases,
  Storage,
  Functions,
//   Realtime,
} from 'appwrite';

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   ?? 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '69a05607000107d09a69';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? '69a158cd003562fd9a95';  


if (!PROJECT_ID && typeof window !== 'undefined') {
  console.warn('[aimevo-web] NEXT_PUBLIC_APPWRITE_PROJECT_ID manquant dans .env.local');
}

// ─── Client singleton ─────────────────────────────────────────────────────────

export const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

export const account   = new Account(client);
export const databases = new Databases(client);
export const storage   = new Storage(client);
export const functions = new Functions(client);
// export const realtime  = new Realtime(client); 

// ─── Constantes ───────────────────────────────────────────────────────────────

export const ENDPOINT_URL = ENDPOINT;
export const PROJECT      = PROJECT_ID;
export const DB_ID        = DATABASE_ID;

// Collections
export const Col = {
  PROFILES:      'profiles',
  ORGANIZATIONS: 'organizations',
  ORG_MEMBERS:   'org_members',
  PLANS:         'plans',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS:      'payments',
  RESOURCES:     'resources',
  CONVERSATIONS: 'conversations',
  MESSAGES:      'messages',
  TESTS:         'tests',
  TEST_ATTEMPTS: 'test_attempts',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS:    'audit_logs',
  OTP_CODES:     'otp_codes',
  EVENTS: 'events',
  EVENT_REGISTRATIONS: 'event_registrations',
  USER_PROGRESS: 'user_progress',
} as const;

// Buckets Storage
export const Bucket = {
  AVATARS:    'avatars',
  AUDIO:      'audio',
  VIDEO:      'video',
  THUMBNAILS: 'thumbnails',
  CHAT_AUDIO: 'chat_audio',
} as const;

// Functions
export const Fn = {
  SEND_OTP:    'send-otp',
  VERIFY_OTP:  'verify-otp',
  AUTH_HOOKS:  'auth-hooks',
  NOTIFY:      'notify',
  SCHEDULER:   'subscription-scheduler',
} as const;

// ─── Helpers URL Storage ──────────────────────────────────────────────────────

/** URL de visualisation directe d'un fichier (lecture publique ou avec session) */
export const getFileViewUrl = (bucketId: string, fileId: string) =>
  `${ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${PROJECT_ID}`;

/** URL de prévisualisation image avec redimensionnement optionnel */
export const getImagePreviewUrl = (
  bucketId: string,
  fileId: string,
  opts: { width?: number; height?: number; quality?: number } = {},
) => {
  const p = new URLSearchParams({ project: PROJECT_ID });
  if (opts.width)   p.set('width',   String(opts.width));
  if (opts.height)  p.set('height',  String(opts.height));
  if (opts.quality) p.set('quality', String(opts.quality));
  return `${ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/preview?${p}`;
};
