/**
 * AÏMEVO — seed.ts
 * ================
 * Insère toutes les données initiales :
 *   • 3 plans tarifaires (Individuel, Entreprise, ONG)
 *   • 1 compte administrateur
 *   • 1 professionnel de démonstration
 *   • 4 tests psychologiques (2 auto, 2 supervisés)
 *   • 5 ressources de démonstration
 *
 * Usage :
 *   npx tsx seed.ts
 *   npx tsx seed.ts --reset    (supprime et recrée les données)
 *
 * Variables d'environnement (.env) :
 *   NEXT_APPWRITE_ENDPOINT     = https://cloud.appwrite.io/v1
 *   NEXT_APPWRITE_PROJECT_ID   = votre_project_id
 *   NEXT_APPWRITE_API_KEY      = votre_api_key
 *   ADMIN_EMAIL           = admin@aimevo.com   (optionnel)
 *   ADMIN_PASSWORD        = VotreMotDePasse!   (optionnel)
 *   PRO_EMAIL             = pro@aimevo.com     (optionnel)
 *   PRO_PASSWORD          = VotreMotDePasse!   (optionnel)
 */

import { Client, Databases, Users, ID, Permission, Role } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── Client ──────────────────────────────────────────────────────────────────

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? 'https://sgp.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? '69a05607000107d09a69')
  .setKey(process.env.NEXT_APPWRITE_API_KEY ?? 'standard_4be90eb2e9c84af77a5df53d5e9f7a2f32b0c71ca30839c75cb0b535f89467bd16159c5be05d423250038ae71ddaf4bdd6e3528e5377079821a9e62c6b10e1fb994ac70ba99c6148390f0e6b7aa38f533ed05bc9e32906cceb8b6d3432a7762767d713372243c663e6b6616fe12662e304dc41624f4051df0245d8c7271397d3');


const db = new Databases(client);
const users = new Users(client);

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? '69a158cd003562fd9a95';
const Col = {
  PLANS: 'plans',
  PROFILES: 'profiles',
  TESTS: 'tests',
  RESOURCES: 'resources',
  EVENTS: 'events',
  EVENT_REGISTRATIONS: 'event_registrations',
  USER_PROGRESS: 'user_progress',
};

const RESET = process.argv.includes('--reset');
// ─── Helpers ─────────────────────────────────────────────────────────────────

async function upsert(
  collectionId: string,
  docId: string,
  data: Record<string, unknown>,
  label: string,
  permissions?: string[],
) {
  try {
    await db.createDocument(DB, collectionId, docId, data, permissions);
    console.log(`  ✅ ${label}`);
  } catch (err: any) {
    if (err?.code === 409) {
      // ← Toujours mettre à jour data + permissions (même sans --reset)
      // updateDocument sans permissions = Appwrite garde les anciennes
      // updateDocument AVEC permissions = Appwrite remplace complètement
      await db.updateDocument(DB, collectionId, docId, data, permissions);
      if (RESET) {
        console.log(`  🔄 ${label} (mis à jour + permissions)`);
      } else {
        console.log(`  ♻️  ${label} (permissions synchronisées)`);
      }
    } else {
      throw err;
    }
  }
}

// ─── CRITIQUE : Permissions document-level pour les profils ──────────────────
//
// La collection profiles a :
//   documentSecurity: true  → les permissions sont CUMULÉES (collection + document)
//   update: []              → aucune permission update au niveau collection
//
// Conséquence : si on crée un document SANS permissions explicites,
// Appwrite ne pose aucune permission document-level.
// Résultat → 401 sur toute tentative d'update, même pour le propriétaire.
//
// SOLUTION : toujours passer profilePermissions(userId) à createDocument.
//
function profilePermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),           // User lit son propre profil
    Permission.update(Role.user(userId)),         // User modifie son propre profil ← LA CLÉ
    Permission.read(Role.label('admin')),         // Admin lit tout
    Permission.read(Role.label('professional')),  // Pro lit (clé publique E2EE)
    Permission.delete(Role.label('admin')),       // Seul admin peut supprimer
  ];
}

// ─── 1. Plans tarifaires ─────────────────────────────────────────────────────

const PLANS = [
  {
    $id: 'plan_individual',
    name: 'Pack Individuel',
    type: 'individual',
    priceMonthly: 2000,
    priceQuarterly: 5000,
    priceYearly: 18000,
    currency: 'XOF',
    features: [
      'Assistant psychologique illimité',
      'Accès ressources audio premium',
      'Auto-tests de bien-être',
      'Chat avec professionnel',
      'Support sous 48h',
    ],
    maxMembers: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    $id: 'plan_enterprise',
    name: 'Pack Entreprise',
    type: 'enterprise',
    priceMonthly: 15000,
    priceQuarterly: 40000,
    priceYearly: 150000,
    currency: 'XOF',
    features: [
      "Jusqu'à 50 comptes membres",
      'Dashboard RH & reporting',
      'Tests supervisés en équipe',
      'Ressources en 5 langues',
      'Support prioritaire 24h',
      'Formation équipe RH incluse',
    ],
    maxMembers: 50,
    isActive: true,
    sortOrder: 2,
  },
  {
    $id: 'plan_ngo',
    name: 'Pack ONG',
    type: 'ngo',
    priceMonthly: 8000,
    priceQuarterly: 22000,
    priceYearly: 80000,
    currency: 'XOF',
    features: [
      'Comptes communautaires illimités',
      'Tarif réduit ONG / Associations',
      'Ressources en langues locales (fon, goun, mina)',
      'Tests supervisés communauté',
      'Support dédié ONG',
    ],
    maxMembers: 200,
    isActive: true,
    sortOrder: 3,
  },
];

async function seedPlans() {
  console.log('\n📦 Plans tarifaires...');
  for (const plan of PLANS) {
    const { $id, ...data } = plan;
    // Plans : lecture publique, pas de documentSecurity → pas de permissions à passer
    await upsert(Col.PLANS, $id, data, plan.name);
  }
}

// ─── 2. Utilisateurs initiaux ─────────────────────────────────────────────────

async function createUser(
  userId: string,
  email: string,
  phone: string,
  password: string,
  name: string,
  labels: string[],
) {
  try {
    await users.get(userId);
    console.log(`  ♻️  ${name} (${email}) existe déjà`);
  } catch {
    await users.create(userId, email, phone, password, name);
    console.log(`  ✅ ${name} créé (${email})`);
  }
  await users.updateLabels(userId, labels);
  await users.updateEmailVerification(userId, true);
  return userId;
}

async function seedUsers() {
  console.log('\n👤 Utilisateurs initiaux...');

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@aimevo.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@aimevo2026!';
  const adminId = 'usr_admin_001';

  await createUser(adminId, adminEmail, '+22997000001', adminPassword, 'Admin AÏMEVO', ['admin']);

  // ← Permissions document-level explicites : OBLIGATOIRE pour que l'admin
  //   puisse mettre à jour son propre profil (update: [] au niveau collection)
  await upsert(Col.PROFILES, adminId, {
    userId: adminId, firstName: 'Admin', lastName: 'AÏMEVO',
    preferredLanguage: 'fr', role: 'admin',
    profileCompleted: true, isActive: true,
  }, 'Profil admin', profilePermissions(adminId));

  // ── Professionnel démo ─────────────────────────────────────────────────────
  const proEmail = process.env.PRO_EMAIL ?? 'pro@aimevo.com';
  const proPassword = process.env.PRO_PASSWORD ?? 'Pro@aimevo2026!';
  const proId = 'usr_pro_001';

  await createUser(proId, proEmail, '+22997000002', proPassword, 'Dr. Koffi Mensah', ['professional']);

  await upsert(Col.PROFILES, proId, {
    userId: proId, firstName: 'Koffi', lastName: 'Mensah',
    profession: 'Psychologue clinicien',
    country: 'Bénin', city: 'Cotonou',
    bio: "Psychologue clinicien diplômé de l'UAC. Spécialisé en thérapie cognitivo-comportementale et bien-être en entreprise.",
    preferredLanguage: 'fr', role: 'professional',
    profileCompleted: true, isActive: true,
  }, 'Profil professionnel démo', profilePermissions(proId));

  console.log(`\n  ⚠️  Identifiants à conserver :`);
  console.log(`     Admin : ${adminEmail} / ${adminPassword}`);
  console.log(`     Pro   : ${proEmail} / ${proPassword}`);
  console.log(`     ⚠️  Changez ces mots de passe en production!`);
}

// ─── 3. Tests psychologiques ──────────────────────────────────────────────────

const TESTS = [
  {
    $id: 'test_wellbeing_001',
    type: 'auto',
    title: 'Évaluation du bien-être général',
    description: "Un test rapide pour évaluer votre état de bien-être global cette semaine. Résultats immédiats.",
    language: 'fr',
    passingScore: 50,
    estimatedMinutes: 5,
    isPremium: false,
    isPublished: true,
    createdBy: 'usr_admin_001',
    questions: [
      { id: 'q1', order: 1, weight: 2, text: 'Comment évaluez-vous votre humeur générale cette semaine ?', responseType: 'scale', options: ['Très mauvaise (1)', 'Mauvaise (2)', 'Neutre (3)', 'Bonne (4)', 'Très bonne (5)'] },
      { id: 'q2', order: 2, weight: 2, text: 'Avez-vous eu des difficultés à vous endormir ?', responseType: 'single_choice', options: ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Toujours'], correctAnswer: 'Jamais' },
      { id: 'q3', order: 3, weight: 2, text: 'Vous sentez-vous soutenu(e) par votre entourage ?', responseType: 'single_choice', options: ['Pas du tout', 'Peu', 'Modérément', 'Bien', 'Très bien'], correctAnswer: 'Très bien' },
      { id: 'q4', order: 4, weight: 1, text: 'Avez-vous pratiqué une activité qui vous plaît cette semaine ?', responseType: 'single_choice', options: ['Non', 'Une fois', 'Quelques fois', 'Tous les jours ou presque'], correctAnswer: 'Tous les jours ou presque' },
      { id: 'q5', order: 5, weight: 2, text: 'Comment gérez-vous le stress au quotidien ?', responseType: 'single_choice', options: ['Très difficilement', 'Difficilement', 'Correctement', 'Facilement', 'Très facilement'], correctAnswer: 'Facilement' },
    ],
  },
  {
    $id: 'test_stress_001',
    type: 'auto',
    title: 'Niveau de stress professionnel',
    description: "Évaluez votre niveau de stress lié au travail. Ce test vous aide à identifier les domaines nécessitant attention.",
    language: 'fr',
    passingScore: 40,
    estimatedMinutes: 7,
    isPremium: false,
    isPublished: true,
    createdBy: 'usr_admin_001',
    questions: [
      { id: 'q1', order: 1, weight: 2, text: 'Ma charge de travail est excessive.', responseType: 'scale', options: ['Jamais (1)', 'Rarement (2)', 'Parfois (3)', 'Souvent (4)', 'Toujours (5)'] },
      { id: 'q2', order: 2, weight: 2, text: 'Je me sens dépassé(e) par les responsabilités de mon poste.', responseType: 'scale', options: ['Jamais (1)', 'Rarement (2)', 'Parfois (3)', 'Souvent (4)', 'Toujours (5)'] },
      { id: 'q3', order: 3, weight: 1, text: 'Je peux me déconnecter du travail pendant mes heures de repos.', responseType: 'single_choice', options: ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Toujours'], correctAnswer: 'Toujours' },
      { id: 'q4', order: 4, weight: 2, text: 'Je me sens reconnu(e) et valorisé(e) dans mon travail.', responseType: 'single_choice', options: ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Toujours'], correctAnswer: 'Toujours' },
      { id: 'q5', order: 5, weight: 1, text: 'Lesquels de ces symptômes physiques ressentez-vous régulièrement ?', responseType: 'multiple_choice', options: ['Maux de tête', 'Douleurs dorsales', 'Fatigue chronique', 'Troubles digestifs', 'Aucun de ces symptômes'] },
    ],
  },
  {
    $id: 'test_anxiety_001',
    type: 'supervised',
    title: "Évaluation de l'anxiété (GAD-7 adapté)",
    description: "Test supervisé par un professionnel basé sur le GAD-7. Vos réponses seront analysées sous 48h.",
    language: 'fr',
    passingScore: 60,
    estimatedMinutes: 10,
    isPremium: true,
    isPublished: true,
    createdBy: 'usr_admin_001',
    questions: [
      { id: 'q1', order: 1, weight: 2, text: 'À quelle fréquence vous êtes-vous senti(e) nerveux/anxieux ces deux dernières semaines ?', responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q2', order: 2, weight: 2, text: "Vous êtes-vous senti(e) incapable d'arrêter de vous inquiéter ?", responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q3', order: 3, weight: 2, text: 'Avez-vous eu du mal à vous détendre ?', responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q4', order: 4, weight: 3, text: "Décrivez une situation récente qui vous a causé de l'anxiété et comment vous l'avez gérée.", responseType: 'text' },
      { id: 'q5', order: 5, weight: 1, text: 'Quelles stratégies utilisez-vous pour calmer votre anxiété ?', responseType: 'multiple_choice', options: ['Respiration profonde', 'Méditation', 'Exercice physique', "Parler à quelqu'un", 'Écouter de la musique', "Je n'ai pas de stratégie", 'Autre'] },
    ],
  },
  {
    $id: 'test_depression_001',
    type: 'supervised',
    title: 'Évaluation de la dépression légère (PHQ-9 adapté)',
    description: "Évaluation supervisée basée sur le PHQ-9. Ce test est un outil de dépistage, pas un diagnostic. Un professionnel analysera vos réponses avec bienveillance.",
    language: 'fr',
    passingScore: 60,
    estimatedMinutes: 12,
    isPremium: true,
    isPublished: true,
    createdBy: 'usr_admin_001',
    questions: [
      { id: 'q1', order: 1, weight: 2, text: "Peu d'intérêt ou de plaisir à faire les choses :", responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q2', order: 2, weight: 2, text: 'Se sentir triste, déprimé(e) ou sans espoir :', responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q3', order: 3, weight: 2, text: "Difficultés à s'endormir, rester endormi(e) ou dormir trop :", responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q4', order: 4, weight: 2, text: "Se sentir fatigué(e) ou manquer d'énergie :", responseType: 'single_choice', options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
      { id: 'q5', order: 5, weight: 3, text: 'Décrivez comment vous vous sentez en ce moment dans votre vie quotidienne. Qu\'est-ce qui vous pèse le plus ?', responseType: 'text' },
    ],
  },
];

async function seedTests() {
  console.log('\n🧠 Tests psychologiques...');
  for (const test of TESTS) {
    const { $id, questions, ...data } = test as any;
    // Tests : pas de documentSecurity → pas de permissions document nécessaires
    await upsert(Col.TESTS, $id, { ...data, questionsJson: JSON.stringify(questions) }, test.title);
  }
}

// ─── 4. Ressources de démonstration ──────────────────────────────────────────

const RESOURCES = [
  {
    $id: 'res_article_001',
    type: 'article', language: 'fr',
    title: 'Introduction à la pleine conscience africaine',
    description: "Découvrez comment les traditions africaines de pleine conscience peuvent enrichir votre bien-être moderne.",
    content: `# La pleine conscience à travers le prisme africain\n\n## Ubuntu : "Je suis parce que nous sommes"\n\nLa philosophie Ubuntu offre une perspective unique sur le bien-être mental. Contrairement à l'approche occidentale centrée sur l'individu, Ubuntu reconnaît que notre santé mentale est intrinsèquement liée à notre appartenance communautaire.\n\n## Les pratiques traditionnelles\n\n**La danse rituelle** — Dans de nombreuses cultures béninoises, la danse est thérapeutique. Le mouvement synchronisé au rythme des tambours crée un état de pleine conscience naturel.\n\n**La méditation sous l'arbre** — S'asseoir en silence sous un grand arbre est une forme ancestrale de pleine conscience.\n\n## Application au quotidien\n\n1. **Matinée Ubuntu** : 3 personnes qui contribuent à votre bien-être\n2. **Pause arbre** : 5 minutes dans un espace vert, sans téléphone\n3. **Respiration 4-7-8** : Inspirez 4s, bloquez 7s, expirez 8s`,
    isPremium: false, isPublished: true,
    tags: ['pleine conscience', 'ubuntu', 'méditation', 'traditions africaines'],
    createdBy: 'usr_admin_001', viewCount: 0,
  },
  {
    $id: 'res_article_002',
    type: 'article', language: 'fr',
    title: 'Gérer le stress au travail en 5 étapes',
    description: "Des techniques pratiques et culturellement adaptées pour réduire le stress professionnel au quotidien.",
    content: `# Gérer le stress au travail : 5 étapes\n\n## 1. La respiration de l'ancêtre (2 min)\nFermez les yeux. Inspirez 4s, bloquez 4s, expirez 6s. Répétez 5 fois.\n\n## 2. L'inventaire des ressources\nListez 3 personnes sur qui vous pouvez compter. Cette pratique Ubuntu active les circuits de sécurité du cerveau.\n\n## 3. La marche consciente (10 min)\nPortez attention à 5 choses que vous voyez, 4 que vous entendez, 3 que vous pouvez toucher.\n\n## 4. Le recadrage cognitif\n"Dans 5 ans, ce problème aura-t-il encore autant d'importance ?"\n\n## 5. La déconnexion rituelle\nCréez un rituel de fin de journée. Ex : se laver les mains en imaginant le stress qui s'écoule avec l'eau.`,
    isPremium: false, isPublished: true,
    tags: ['stress', 'travail', 'techniques', 'gestion émotions'],
    createdBy: 'usr_admin_001', viewCount: 0,
  },
  {
    $id: 'res_audio_001',
    type: 'audio', language: 'fr',
    title: 'Méditation guidée : Retrouver la paix intérieure',
    description: "Une méditation de 10 minutes inspirée des pratiques africaines pour calmer le mental.",
    durationSeconds: 600,
    isPremium: false, isPublished: true,
    tags: ['méditation', 'pleine conscience', 'relaxation'],
    createdBy: 'usr_admin_001', viewCount: 0,
  },
  {
    $id: 'res_audio_002',
    type: 'audio', language: 'fr',
    title: 'Respiration cohérence cardiaque 5 minutes',
    description: "Exercice de cohérence cardiaque guidé. À pratiquer matin, midi et soir.",
    durationSeconds: 300,
    isPremium: true, isPublished: true,
    tags: ['respiration', 'cohérence cardiaque', 'stress'],
    createdBy: 'usr_admin_001', viewCount: 0,
  },
  {
    $id: 'res_module_001',
    type: 'module', language: 'fr',
    title: 'Module : Les fondamentaux du bien-être mental',
    description: "Un parcours complet de 4 semaines pour construire des bases solides en santé mentale.",
    content: `# Module : Les fondamentaux du bien-être mental\n\n## Semaine 1 — Se connaître soi-même\n- Journal de gratitude (3 choses positives / jour)\n- Cartographier ses émotions\n- Identifier ses valeurs profondes\n\n## Semaine 2 — Gérer ses émotions\n- Techniques de régulation émotionnelle\n- Communication non-violente\n\n## Semaine 3 — Relations saines\n- Frontières dans la culture collective\n- Dire non avec bienveillance\n\n## Semaine 4 — Routine de bien-être\n- Routine matinale\n- Hygiène du sommeil\n- Mon plan personnalisé`,
    isPremium: true, isPublished: true,
    tags: ['module', 'formation', 'bien-être', '4 semaines'],
    createdBy: 'usr_admin_001', viewCount: 0,
  },
];

async function seedResources() {
  console.log('\n📚 Ressources de démonstration...');
  for (const resource of RESOURCES) {
    const { $id, ...data } = resource as any;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await upsert(Col.RESOURCES, $id, cleanData, resource.title);
  }
}

// ─── 5. Ateliers de démonstration ───────────────────────────────────────────
const EVENTS = [
  {
    $id: 'evt_001',
    title: 'Atelier : Gestion du stress par la danse traditionnelle',
    description: 'Une soirée pratique et culturelle pour libérer les tensions.',
    type: 'presentiel',
    location: 'Centre Culturel Français, Cotonou',
    startDate: '2026-03-15T18:00:00.000Z',
    endDate: '2026-03-15T20:00:00.000Z',
    price: 5000,
    maxPlaces: 30,
    remainingPlaces: 30,
    isPublished: true,
    createdBy: 'usr_admin_001',
    tags: ['stress', 'danse', 'culture'],
  },
  {
    $id: 'evt_002',
    title: 'Webinaire : Sommeil et bien-être en Afrique',
    description: 'Comment améliorer son sommeil avec les plantes et rituels locaux.',
    type: 'online',
    location: 'https://zoom.us/j/123456789',
    startDate: '2026-03-20T19:00:00.000Z',
    price: 0,
    maxPlaces: 100,
    remainingPlaces: 100,
    isPublished: true,
    createdBy: 'usr_admin_001',
    tags: ['sommeil', 'plantes'],
  },
];

async function seedEvents() {
  console.log('\n📅 Ateliers de démonstration...');
  for (const event of EVENTS) {
    const { $id, ...data } = event;
    await upsert(Col.EVENTS, $id, data, event.title);
  }
}


// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 AÏMEVO — Seeder\n');
  console.log(`   Endpoint   : ${process.env.APPWRITE_ENDPOINT}`);
  console.log(`   Project ID : ${process.env.APPWRITE_PROJECT_ID}`);
  console.log(`   Mode       : ${RESET ? '⚠️  RESET' : 'Normal (skip si existant)'}`);

  const start = Date.now();
  await seedPlans();
  await seedUsers();
  await seedTests();
  await seedResources();
  await seedEvents();

  console.log(`\n✅ Seeder terminé en ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log('\n📋 Résumé :');
  console.log(`   Plans      : ${PLANS.length}`);
  console.log(`   Users      : 2 (admin + pro démo)`);
  console.log(`   Tests      : ${TESTS.length}`);
  console.log(`   Ressources : ${RESOURCES.length}\n`);
}

main().catch(err => {
  console.error('\n❌ Seeder échoué:', err?.message ?? err);
  process.exit(1);
});