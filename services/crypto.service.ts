/**
 * services/crypto.service.ts — Chiffrement E2EE Web
 * ==================================================
 * ⚠️  SPÉCIFIQUE WEB — Utilise window.crypto.subtle + localStorage
 *     Mobile → react-native-crypto-service avec AsyncStorage
 *
 * Algorithmes :
 *   Échange de clés : ECDH P-256
 *   Dérivation      : HKDF-SHA-256
 *   Chiffrement     : AES-GCM 256 bits
 */

// ─── Stockage des clés dans localStorage ─────────────────────────────────────
/**
 * services/crypto.service.ts — E2EE Web
 */

const KEYS = {
  pub: (uid: string) => `aimevo_pubkey_${uid}`,
  priv: (uid: string) => `aimevo_privkey_${uid}`,
};

export const KeyStorage = {
  saveKeyPair(userId: string, pub: string, priv: string) {
    localStorage.setItem(KEYS.pub(userId), pub);
    localStorage.setItem(KEYS.priv(userId), priv);
  },
  getPublicKey(userId: string) {
    return localStorage.getItem(KEYS.pub(userId));
  },
  getPrivateKey(userId: string) {
    return localStorage.getItem(KEYS.priv(userId));
  },
  clear(userId: string) {
    localStorage.removeItem(KEYS.pub(userId));
    localStorage.removeItem(KEYS.priv(userId));
  },
};

// Base64 helpers

const toBase64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const fromBase64 = (b64: string) =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0));

// ─────────────────────────────────────────────

export const CryptoService = {

  async initForUser(userId: string): Promise<string> {
    const existing = KeyStorage.getPublicKey(userId);
    if (existing) return existing;

    const pair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

    const pubRaw = await crypto.subtle.exportKey('spki', pair.publicKey);
    const privRaw = await crypto.subtle.exportKey('pkcs8', pair.privateKey);

    const pub = toBase64(pubRaw);
    const priv = toBase64(privRaw);

    KeyStorage.saveKeyPair(userId, pub, priv);
    return pub;
  },

  async deriveAesKey(myPrivKey: CryptoKey, theirPubKey: CryptoKey) {
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: theirPubKey },
      myPrivKey,
      256
    );

    return crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async encryptMessage({
    plaintext,
    myUserId,
    theirPublicKey,
  }: {
    plaintext: string;
    myUserId: string;
    theirPublicKey: string;
  }) {
    const myPrivRaw = KeyStorage.getPrivateKey(myUserId);
    if (!myPrivRaw) throw new Error('Clé privée introuvable');

    const myPrivKey = await crypto.subtle.importKey(
      'pkcs8',
      fromBase64(myPrivRaw),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );

    const theirPubKey = await crypto.subtle.importKey(
      'spki',
      fromBase64(theirPublicKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const aesKey = await this.deriveAesKey(myPrivKey, theirPubKey);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      new TextEncoder().encode(plaintext)
    );

    return {
      encryptedContent: toBase64(ciphertext),
      iv: toBase64(iv.buffer),
    };
  },

  async decryptMessage({
    encryptedContent,
    iv,
    myUserId,
    senderPublicKey,
  }: {
    encryptedContent: string;
    iv: string;
    myUserId: string;
    senderPublicKey: string;
  }) {
    const myPrivRaw = KeyStorage.getPrivateKey(myUserId);
    if (!myPrivRaw) throw new Error('Clé privée introuvable');

    const myPrivKey = await crypto.subtle.importKey(
      'pkcs8',
      fromBase64(myPrivRaw),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );

    const senderPubKey = await crypto.subtle.importKey(
      'spki',
      fromBase64(senderPublicKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const aesKey = await this.deriveAesKey(myPrivKey, senderPubKey);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) },
      aesKey,
      fromBase64(encryptedContent)
    );

    return new TextDecoder().decode(decrypted);
  },
};