/**
 * services/auth.service.ts — Authentification Web
 * ================================================
 * ⚠️  SPÉCIFIQUE WEB.
 *     OAuth : createOAuth2Session() → redirection navigateur directe
 *     Session : cookie HttpOnly posé automatiquement par Appwrite
 *     E2EE : clés dans localStorage via CryptoService
 */

import { ID, OAuthProvider } from 'appwrite';
import { account, databases, functions, DB_ID, Col, Fn } from '@/lib/appwrite';
import type {
    Profile,
    SignupPayload,
    UpdateProfilePayload,
    Lang,
    UserRole,
} from '@/lib/types';
import { CryptoService, KeyStorage } from './crypto.service';

export const AuthService = {

    // ── Login ────────────────────────────────────────────────────────────────────
    async login(email: string, password: string) {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();

        // Initialiser les clés E2EE dans localStorage
        const publicKey = await CryptoService.initForUser(user.$id);
        await _syncPublicKey(user.$id, publicKey);

        return { session, userId: user.$id };
    },

    // ── Inscription ─────────────────────────────────────────────────────────────
    // services/auth.service.ts

    async register(payload: SignupPayload): Promise<{ userId: string; session: any }> {
        const { email, password, firstName, lastName, preferredLanguage = 'fr' } = payload;

        try {
            // 1. Créer le compte utilisateur (mode guest)
            const user = await account.create(
                ID.unique(),
                email.trim().toLowerCase(),
                password,
                `${firstName.trim()} ${lastName.trim()}`.trim()
            );

            // 2. Créer immédiatement une session active (connexion automatique)
            const session = await account.createEmailPasswordSession(email, password);

            // 3. Créer le profil associé (maintenant possible car authentifié)
            await databases.createDocument(DB_ID, Col.PROFILES, user.$id, {
                userId: user.$id,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                preferredLanguage: preferredLanguage as Lang,
                role: 'member' as UserRole,
                profileCompleted: false,
                isActive: true,
                avatarFileId: null,
            });

            // 4. Déclencher la vérification d'email officielle Appwrite
            // URL de redirection après clic sur le lien de vérification
            const verificationUrl = 'https://aimevo-platform.vercel.app/verify';

            await account.createVerification(verificationUrl);

            // 5. (Optionnel) Déclencher votre fonction personnalisée d'envoi OTP
            // Si vous l'utilisez en complément de la vérification Appwrite
            // await functions.createExecution(
            //     Fn.SEND_OTP,
            //     JSON.stringify({ userId: user.$id, email: email.trim() })
            // );

            // Retourner les informations utiles
            return { userId: user.$id, session };
        } catch (err: any) {
            console.error('Erreur lors de l\'inscription complète :', err);

            if (err.type === 'user_already_exists') {
                throw new Error('Cet email est déjà utilisé.');
            }
            if (err.type === 'general_argument_invalid') {
                throw new Error('Les informations fournies sont invalides.');
            }

            throw new Error(err.message || 'Échec de l\'inscription. Veuillez réessayer.');
        }
    },

    // ── OAuth — redirection navigateur ──────────────────────────────────────────
    loginWithGoogle(successUrl: string, failureUrl: string) {
        // createOAuth2Session déclenche une redirection complète du navigateur
        // → pas de retour de fonction, le navigateur quitte la page
        account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
    },

    loginWithFacebook(successUrl: string, failureUrl: string) {
        account.createOAuth2Session(OAuthProvider.Facebook, successUrl, failureUrl);
    },

    // Appelé dans /auth/callback après retour OAuth
    async finalizeOAuthLogin(): Promise<void> {
        const user = await account.get(); // session déjà active via cookie

        // Créer le profil si c'est un nouveau compte OAuth
        try {
            await databases.getDocument(DB_ID, Col.PROFILES, user.$id);
        } catch {
            const [first, ...rest] = (user.name ?? '').split(' ');
            await databases.createDocument(DB_ID, Col.PROFILES, user.$id, {
                userId: user.$id,
                firstName: first ?? '',
                lastName: rest.join(' ') ?? '',
                preferredLanguage: 'fr',
                role: 'member' as UserRole,
                profileCompleted: false,
                isActive: true,
            });
        }

        const publicKey = await CryptoService.initForUser(user.$id);
        await _syncPublicKey(user.$id, publicKey);
    },

    async verifyEmail(userId: string, secret: string): Promise<void> {
        await account.updateVerification(userId, secret);
    },
    // ── OTP ──────────────────────────────────────────────────────────────────────
    async verifyOtp(userId: string, code: string): Promise<void> {
        const res = await functions.createExecution(
            Fn.VERIFY_OTP,
            JSON.stringify({ userId, code }),
        );
        const body = JSON.parse(res.responseBody);
        if (!body.success) throw new Error(body.error ?? 'Code OTP invalide');
    },

    async resendOtp(userId: string, email: string): Promise<void> {
        await functions.createExecution(
            Fn.SEND_OTP,
            JSON.stringify({ userId, email }),
        );
    },

    // ── Récupération mot de passe ────────────────────────────────────────────────
    async forgotPassword(email: string, redirectUrl: string) {
        return account.createRecovery(email, redirectUrl);
    },

    async resetPassword(userId: string, secret: string, password: string) {
        return account.updateRecovery(userId, secret, password);
    },

    // ── Profil ───────────────────────────────────────────────────────────────────
    async getMe(): Promise<{ user: any; profile: any }> {
        const user = await account.get();
        const profile = await databases.getDocument(DB_ID, Col.PROFILES, user.$id);
        return { user, profile };
    },

    async getProfile(userId: string) {
        return databases.getDocument(DB_ID, Col.PROFILES, userId);
    },

    async updateProfile(userId: string, data: UpdateProfilePayload) {
        const profile = await databases.updateDocument(
            DB_ID, Col.PROFILES, userId, { ...data },
        );

        // Marquer le profil comme complet si les champs obligatoires sont remplis
        if (profile.firstName && profile.lastName && profile.country && !profile.profileCompleted) {
            await databases.updateDocument(DB_ID, Col.PROFILES, userId, { profileCompleted: true });
        }

        // Synchroniser le nom dans Appwrite Auth
        if (data.firstName || data.lastName) {
            const p = await databases.getDocument(DB_ID, Col.PROFILES, userId);
            await account.updateName(`${p.firstName} ${p.lastName}`);
        }

        return profile;
    },

    async uploadAvatar(userId: string, file: File): Promise<string> {
        const { storage, Bucket } = await import('@/lib/appwrite');
        const { ID: AppID, Permission, Role } = await import('appwrite');

        // Supprimer l'ancien avatar si existant
        const profile = await databases.getDocument(DB_ID, Col.PROFILES, userId);
        if (profile.avatarFileId) {
            try {
                await storage.deleteFile(Bucket.AVATARS, profile.avatarFileId);
            } catch { }
        }

        const uploaded = await storage.createFile(
            Bucket.AVATARS,
            AppID.unique(),
            file,
            [Permission.read(Role.users()), Permission.delete(Role.user(userId))],
        );

        await databases.updateDocument(DB_ID, Col.PROFILES, userId, {
            avatarFileId: uploaded.$id,
        });

        return uploaded.$id;
    },

    async getPublicKey(userId: string): Promise<string | null> {
        try {
            const p = await databases.getDocument(DB_ID, Col.PROFILES, userId);
            return p.publicKey ?? null;
        } catch {
            return null;
        }
    },

    async registerFcmToken(userId: string, token: string) {
        await databases.updateDocument(DB_ID, Col.PROFILES, userId, { fcmToken: token });
    },

    // ── Déconnexion ──────────────────────────────────────────────────────────────
    async logout(userId?: string) {
        await account.deleteSession('current');
        if (userId) KeyStorage.clear(userId);
    },

    async logoutAll(userId?: string) {
        await account.deleteSessions();
        if (userId) KeyStorage.clear(userId);
    },
};

// ─── Helper interne ───────────────────────────────────────────────────────────
async function _syncPublicKey(userId: string, publicKey: string) {
    try {
        const p = await databases.getDocument(DB_ID, Col.PROFILES, userId);
        if (p.publicKey !== publicKey) {
            await databases.updateDocument(DB_ID, Col.PROFILES, userId, { publicKey });
        }
    } catch { }
}