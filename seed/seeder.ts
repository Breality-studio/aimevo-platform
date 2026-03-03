/**
 * AÏMEVO – Seeder Appwrite
 * ==========================
 * Initialise la base avec : plans, admin, tests exemples
 *
 * Usage :
 *   npx ts-node seeder.ts
 *
 * Prérequis :
 *   export APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
 *   export APPWRITE_PROJECT_ID=xxxx
 *   export APPWRITE_API_KEY=xxxx (scope: databases.write, users.write)
 *   export ADMIN_EMAIL=admin@aimevo.com
 *   export ADMIN_PASSWORD=ChangeMe123!
 */

import { Client, Databases, Users, ID } from 'node-appwrite';

const DB_ID = 'aimevodb';
const Col   = {
  PLANS:    'plans',
  PROFILES: 'profiles',
  TESTS:    'tests',
};

const client = new Client()
  .setEndpoint(process.env.NEXT_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_APPWRITE_PROJECT_ID ?? '')
  .setKey(process.env.NEXT_APPWRITE_API_KEY ?? '');

const db    = new Databases(client);
const users = new Users(client);

// ─── PLANS ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    $id:            'plan_individual',
    name:           'Pack Individuel',
    type:           'individual',
    priceMonthly:   2000,
    priceQuarterly: 5000,
    priceYearly:    18000,
    currency:       'XOF',
    features: [
      'Assistant psychologique illimité',
      'Accès ressources audio premium',
      'Auto-tests de bien-être',
      'Chat avec professionnel',
      'Support 48h',
    ],
    maxMembers: 1,
    isActive:   true,
    sortOrder:  1,
  },
  {
    $id:            'plan_enterprise',
    name:           'Pack Entreprise',
    type:           'enterprise',
    priceMonthly:   15000,
    priceQuarterly: 40000,
    priceYearly:    150000,
    currency:       'XOF',
    features: [
      'Jusqu\'à 50 comptes membres',
      'Dashboard RH & reporting',
      'Tests supervisés équipe',
      'Ressources multilangues',
      'Support prioritaire 24h',
      'Formation équipe RH',
    ],
    maxMembers: 50,
    isActive:   true,
    sortOrder:  2,
  },
  {
    $id:            'plan_ngo',
    name:           'Pack ONG',
    type:           'ngo',
    priceMonthly:   8000,
    priceQuarterly: 22000,
    priceYearly:    80000,
    currency:       'XOF',
    features: [
      'Comptes communautaires illimités',
      'Tarif réduit ONG/Associations',
      'Ressources en langues locales',
      'Tests supervisés communauté',
      'Support dédié',
    ],
    maxMembers: 200,
    isActive:   true,
    sortOrder:  3,
  },
];

// ─── TESTS EXEMPLES ───────────────────────────────────────────────────────────

const TESTS = [
  {
    type:  'auto',
    title: 'Évaluation du bien-être général',
    description: 'Un test rapide pour évaluer votre état de bien-être global cette semaine.',
    language: 'fr',
    passingScore: 50,
    estimatedMinutes: 5,
    isPremium: false,
    isPublished: true,
    questions: [
      {
        id: 'q1', text: 'Comment évaluez-vous votre humeur générale cette semaine ?',
        responseType: 'scale',
        options: ['Très mauvaise', 'Mauvaise', 'Neutre', 'Bonne', 'Très bonne'],
        weight: 2, order: 1,
      },
      {
        id: 'q2', text: 'Avez-vous eu des difficultés à dormir récemment ?',
        responseType: 'single_choice',
        options: ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Toujours'],
        correctAnswer: 'Jamais',
        weight: 1, order: 2,
      },
      {
        id: 'q3', text: 'Vous sentez-vous soutenu(e) par votre entourage ?',
        responseType: 'single_choice',
        options: ['Pas du tout', 'Peu', 'Modérément', 'Bien', 'Très bien'],
        correctAnswer: 'Très bien',
        weight: 2, order: 3,
      },
      {
        id: 'q4', text: 'Avez-vous pratiqué une activité qui vous plaît cette semaine ?',
        responseType: 'single_choice',
        options: ['Non', 'Une fois', 'Quelques fois', 'Souvent'],
        correctAnswer: 'Souvent',
        weight: 1, order: 4,
      },
      {
        id: 'q5', text: 'Comment gérez-vous le stress au quotidien ?',
        responseType: 'single_choice',
        options: ['Très difficilement', 'Difficilement', 'Correctement', 'Facilement', 'Très facilement'],
        correctAnswer: 'Facilement',
        weight: 2, order: 5,
      },
    ],
  },
  {
    type:  'supervised',
    title: 'Évaluation de l\'anxiété (GAD-7 simplifié)',
    description: 'Test supervisé par un professionnel pour évaluer les symptômes d\'anxiété. Vos réponses seront analysées par notre équipe.',
    language: 'fr',
    passingScore: 60,
    estimatedMinutes: 10,
    isPremium: true,
    isPublished: true,
    questions: [
      {
        id: 'q1', text: 'À quelle fréquence vous êtes-vous senti(e) nerveux/nerveuse, anxieux/anxieuse ou à bout ces deux dernières semaines ?',
        responseType: 'single_choice',
        options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'],
        weight: 2, order: 1,
      },
      {
        id: 'q2', text: 'Vous êtes-vous senti(e) incapable d\'arrêter de vous inquiéter ou de contrôler vos inquiétudes ?',
        responseType: 'single_choice',
        options: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'],
        weight: 2, order: 2,
      },
      {
        id: 'q3', text: 'Décrivez une situation récente qui vous a causé de l\'anxiété et comment vous l\'avez gérée.',
        responseType: 'text',
        weight: 3, order: 3,
      },
      {
        id: 'q4', text: 'Quelles stratégies utilisez-vous pour calmer votre anxiété ?',
        responseType: 'multiple_choice',
        options: ['Respiration profonde', 'Méditation', 'Exercice physique', 'Parler à quelqu\'un', 'Écouter de la musique', 'Autre'],
        weight: 1, order: 4,
      },
    ],
  },
];

// ─── RUNNER ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Démarrage du seeder AÏMEVO...\n');

  // ── Plans ──────────────────────────────────────────────────────────────────
  console.log('📦 Création des plans...');
  for (const plan of PLANS) {
    const { $id, ...data } = plan;
    try {
      await db.createDocument(DB_ID, Col.PLANS, $id, data);
      console.log(`  ✅ ${plan.name}`);
    } catch (err: any) {
      if (err.code === 409) {
        await db.updateDocument(DB_ID, Col.PLANS, $id, data);
        console.log(`  ♻️  ${plan.name} (mis à jour)`);
      } else {
        console.error(`  ❌ ${plan.name}: ${err.message}`);
      }
    }
  }

  // ── Admin initial ──────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL ?? 'admin@aimevo.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';

  console.log('\n👤 Création de l\'administrateur...');
  try {
    const adminId  = 'admin_001';
    let adminUser;
    try {
      adminUser = await users.get(adminId);
      console.log(`  ♻️  Admin existant: ${adminEmail}`);
    } catch {
      adminUser = await users.create(adminId, adminEmail, '+22900000000', adminPassword, 'Admin AÏMEVO');
      console.log(`  ✅ Admin créé: ${adminEmail}`);
    }

    // Assigner le label admin
    await users.updateLabels(adminId, ['admin']);
    await users.updateEmailVerification(adminId, true);

    // Créer le profil admin
    try {
      await db.createDocument(DB_ID, Col.PROFILES, adminId, {
        userId:            adminId,
        firstName:         'Admin',
        lastName:          'AÏMEVO',
        preferredLanguage: 'fr',
        role:              'admin',
        profileCompleted:  true,
        isActive:          true,
      });
      console.log(`  ✅ Profil admin créé`);
    } catch (err: any) {
      if (err.code === 409) console.log(`  ♻️  Profil admin existant`);
      else throw err;
    }

  } catch (err: any) {
    console.error(`  ❌ Admin: ${err.message}`);
  }

  // ── Tests exemples ─────────────────────────────────────────────────────────
  console.log('\n📝 Création des tests exemples...');
  for (const test of TESTS) {
    const { questions, ...testData } = test;
    try {
      await db.createDocument(DB_ID, Col.TESTS, ID.unique(), {
        ...testData,
        questionsJson: JSON.stringify(questions),
        createdBy:     'admin_001',
      });
      console.log(`  ✅ ${test.title}`);
    } catch (err: any) {
      console.error(`  ❌ ${test.title}: ${err.message}`);
    }
  }

  console.log('\n🎉 Seeder terminé avec succès!');
  console.log('\n📋 Récapitulatif :');
  console.log(`   Plans: ${PLANS.length} créés`);
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Tests: ${TESTS.length} créés`);
  console.log('\n⚠️  Changez le mot de passe admin en production!\n');
}

seed().catch((err) => {
  console.error('❌ Seeder échoué:', err);
  process.exit(1);
});

