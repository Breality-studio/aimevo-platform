// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

export type UserRole = 'member' | 'professional' | 'admin';
export type Lang = 'fr' | 'en' | 'fon' | 'goun' | 'mina';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type PlanType = 'individual' | 'enterprise' | 'ngo';
export type ResourceType = 'audio' | 'video' | 'module' | 'article' | 'external';
export type PaymentMethod = 'mobile_money' | 'card' | 'manual';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type SubStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type AttemptStatus = 'in_progress' | 'pending_review' | 'reviewed' | 'completed';
export type MessageType = 'text' | 'audio';
export type ConvStatus = 'open' | 'closed';
export type TestType = 'auto' | 'supervised';

// ─── DOCUMENTS APPWRITE ───────────────────────────────────────────────────────
// $id, $createdAt, $updatedAt sont ajoutés automatiquement par Appwrite

export interface Profile {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
  profession?: string;
  country?: string;
  city?: string;
  preferredLanguage: Lang;
  avatarFileId?: string;
  bio?: string;
  publicKey?: string;   // ECDH P-256 public key (E2EE)
  fcmToken?: string;   // Firebase push token
  profileCompleted: boolean;
  isActive: boolean;
  organizationId?: string;
  role: UserRole;
}

export interface Organization {
  $id: string;
  $createdAt: string;
  name: string;
  type: 'enterprise' | 'ngo';
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  contactEmail?: string;
  country?: string;
  logoFileId?: string;
}

export interface OrgMember {
  $id: string;
  organizationId: string;
  userId: string;
  role: 'manager' | 'member';
  invitedBy: string;
}

export interface Plan {
  $id: string;
  name: string;
  type: PlanType;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  maxMembers: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  ownerId: string;
  planId: string;
  amount: number;
  lastPaymentId?: string;
  nextBillingDate?: string;
  providerSubscriptionId?: string;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  status: SubStatus;
  autoRenew: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  paymentMethod?: PaymentMethod;
}

export interface Payment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  paidAt?: string;
  refundId?: string;
  refundedAmount?: number;
  currency: string;
  method: PaymentMethod;
  providerName?: string;
  providerReference?: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  idempotencyKey: string;
  failureReason?: string;
  notes?: string;
  refundedAt?: string;
}

export interface Resource {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  parentId?: string;
  type: ResourceType;
  language: Lang;
  externalUrl?: string;          // Lien YouTube, PDF, SoundCloud, etc.
  iframeUrl?: string;            // Lien iframe spécifique (optionnel)
  contentBase64?: string;        // Base64 pour article complet, audio ou vidéo embarquée
  previewImageBase64?: string;
  title: string;
  description: string;
  content?: string;        // Markdown pour articles
  audioFileId?: string;
  videoFileId?: string;
  thumbnailFileId?: string;
  durationSeconds?: number;
  isPremium: boolean;
  tags: string[];
  createdBy: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  // Computed (côté client)
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  locked?: boolean;       
}

export interface Conversation {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  memberId: string;
  professionalId: string;
  memberPublicKey?: string;
  participants: string[];
  proPublicKey?: string;
  status: ConvStatus;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  memberUnread: number;
  proUnread: number;
}

export interface Message {
  $id: string;
  $createdAt: string;
  conversationId: string;
  senderId: string;
  encryptedContent: string;   // AES-GCM ciphertext base64
  iv?: string;   // AES-GCM IV base64
  type: MessageType;
  audioFileId?: string;
  isRead: boolean;
  // Computed
  decrypted?: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  responseType: 'single_choice' | 'multiple_choice' | 'scale' | 'text' | 'audio';
  options?: string[];
  correctAnswer?: string | number | string[];
  weight: number;
  order: number;
}

export interface Test {
  $id: string;
  $createdAt: string;
  type: TestType;
  title: string;
  description: string;
  language: Lang;
  questionsJson: string;    // JSON.stringify(TestQuestion[])
  passingScore: number;
  estimatedMinutes: number;
  isPremium: boolean;
  isPublished: boolean;
  createdBy: string;
  // Computed
  questions?: TestQuestion[];
}

export interface TestAnswer {
  questionId: string;
  answer: string | number | string[];
  audioFileId?: string;
}

export interface TestAttempt {
  $id: string;
  $createdAt: string;
  userId: string;
  testId: string;
  answersJson: string;   // JSON.stringify(TestAnswer[])
  score?: number;
  status: AttemptStatus;
  startedAt: string;
  completedAt?: string;
  reviewedAt?: string;
  professionalId?: string;
  feedback?: string;
  // Computed
  answers?: TestAnswer[];
}

export interface Notification {
  $id: string;
  $createdAt: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  dataJson: string;   // JSON.stringify(Record<string,string>)
  isRead: boolean;
}

export interface AuditLog {
  $id: string;
  $createdAt: string;
  adminId: string;
  action: string;
  targetId: string;
  targetType: string;
  metaJson: string;
  ip?: string;
}

// ─── PAYLOADS API ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: Lang;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  profession?: string;
  country?: string;
  city?: string;
  preferredLanguage?: Lang;
  bio?: string;
}

export interface CreateSubscriptionPayload {
  planId: string;
  billingCycle: BillingCycle;
  organizationId?: string;
}

export interface InitiatePaymentPayload {
  subscriptionId: string;
  method: PaymentMethod;
  phoneNumber?: string;
  providerName?: string;
}

export interface CreateResourcePayload {
  type: ResourceType;
  language: Lang;
  title: string;
  description: string;
  content?: string;
  parentId?: string;
  isPremium?: boolean;
  tags?: string[];
  durationSeconds?: number;
}

export interface CreateTestPayload {
  type: TestType;
  title: string;
  description: string;
  language: Lang;
  questions: Omit<TestQuestion, 'id'>[];
  passingScore?: number;
  estimatedMinutes?: number;
  isPremium?: boolean;
}

export interface SubmitTestPayload {
  attemptId: string;
  answers: TestAnswer[];
}

export interface ReviewTestPayload {
  attemptId: string;
  score: number;
  feedback: string;
}

export interface SendMessagePayload {
  conversationId: string;
  encryptedContent: string;
  iv?: string;
  type?: MessageType;
  audioFileId?: string;
}

export type EventType = 'online' | 'presentiel';

export interface Event {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  title: string;
  description: string;
  type: EventType;
  location?: string;           // lieu physique ou lien de visioconférence
  startDate: string;           // ISO datetime
  endDate?: string;            // ISO datetime (optionnel si pas de fin précise)
  price: number;               // 0 = gratuit
  maxPlaces: number;
  remainingPlaces: number;
  isPublished: boolean;
  createdBy: string;           // userId de l'admin ou pro qui a créé
  tags?: string[];

  $permissions?: string[];
  $collectionId?: string;
  $databaseId?: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  type: EventType;
  location?: string;
  startDate: string;
  endDate?: string;
  price?: number;
  maxPlaces?: number;
  tags?: string[];
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface EventRegistration {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  eventId: string;
  userId: string;
  status: RegistrationStatus;
  qrFileId?: string;           // ID du fichier QR code dans Storage
  registeredAt: string;        // ISO datetime
  paymentId?: string;          // lien vers un paiement si payant

  // Champs système
  $permissions?: string[];
}

export interface CreateEventRegistrationPayload {
  eventId: string;
  userId: string;
}

export interface UserProgress {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  userId: string;
  resourceId: string;
  progressSeconds: number;     // temps écoulé / vu en secondes
  lastPosition: number;        // dernière position en secondes (pour reprise)
  lastUpdated: string;         // ISO datetime

  // Champs système
  $permissions?: string[];
}

export interface SaveProgressPayload {
  resourceId: string;
  progressSeconds: number;
  lastPosition: number;
}
