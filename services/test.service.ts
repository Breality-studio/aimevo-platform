import { ID, Query, Permission, Role } from 'appwrite';
import { databases, functions, DB_ID, Col, Fn } from '@/lib/appwrite';
import type {
  Test, TestAttempt, TestQuestion, TestAnswer,
  CreateTestPayload, SubmitTestPayload, ReviewTestPayload,
  AttemptStatus, Lang, TestType,
} from '@/lib/types';

export const TestService = {
  async listAdmin(params: {
    search?: string;
    type?: TestType;
    isPublished?: boolean;
    limit?: number;
    cursor?: string;
  } = {}): Promise<Test[]> {
    const q: string[] = [Query.orderDesc('$createdAt'), Query.limit(params.limit ?? 20)];

    if (params.search) q.push(Query.search('title', params.search));
    if (params.type) q.push(Query.equal('type', params.type));
    if (params.isPublished !== undefined) q.push(Query.equal('isPublished', params.isPublished));
    if (params.cursor) q.push(Query.cursorAfter(params.cursor));

    const res = await databases.listDocuments<any>(DB_ID, Col.TESTS, q);
    return res.documents.map(parseTest);
  },

  /**
   * Liste les tests publics disponibles pour les utilisateurs
   */
  async listPublic(params: { type?: TestType; language?: Lang } = {}): Promise<Test[]> {
    const q: string[] = [
      Query.equal('isPublished', true),
      Query.orderDesc('$createdAt'),
      Query.limit(20),
    ];

    if (params.type) q.push(Query.equal('type', params.type));
    if (params.language) q.push(Query.equal('language', params.language));

    try {
      const res = await databases.listDocuments<Test>(DB_ID, Col.TESTS, q);
      return res.documents.map(parseTest).map(stripCorrectAnswers);
    } catch (err) {
      console.error('Erreur liste tests publics', err);
      return [];
    }
  },

  async list(params: { type?: TestType; language?: Lang } = {}): Promise<Test[]> {
    const q: string[] = [Query.equal('isPublished', true), Query.orderDesc('$createdAt')];
    if (params.type) q.push(Query.equal('type', params.type));
    if (params.language) q.push(Query.equal('language', params.language));
    const res = await databases.listDocuments<any>(DB_ID, Col.TESTS, q);
    return res.documents.map(parseTest).map(stripCorrectAnswers);
  },

  async get(testId: string): Promise<Test> {
    const doc = await databases.getDocument<any>(DB_ID, Col.TESTS, testId);
    return stripCorrectAnswers(parseTest(doc));
  },

  async create(adminId: string, payload: CreateTestPayload): Promise<Test> {
    const questions = payload.questions.map((q, i) => ({
      id: `q_${i + 1}`,
      text: q.text,
      responseType: q.responseType,
      options: q.options ?? [],
      correctAnswer: q.correctAnswer ?? null,
      weight: q.weight ?? 1,
      order: q.order ?? i + 1,
    }));
    return databases.createDocument<any>(
      DB_ID, Col.TESTS, ID.unique(),
      {
        type: payload.type,
        title: payload.title,
        description: payload.description,
        language: payload.language,
        questionsJson: JSON.stringify(questions),
        passingScore: payload.passingScore ?? 60,
        estimatedMinutes: payload.estimatedMinutes ?? 10,
        isPremium: payload.isPremium ?? false,
        isPublished: false,
        createdBy: adminId,
      },
    );
  },

  async update(
    testId: string,
    data: Partial<CreateTestPayload & { isPublished: boolean }>,
  ): Promise<Test> {
    const updates: Record<string, unknown> = { ...data };
    if (data.questions) {
      updates.questionsJson = JSON.stringify(data.questions);
      delete updates.questions;
    }
    return databases.updateDocument<any>(DB_ID, Col.TESTS, testId, updates);
  },

  async delete(testId: string): Promise<void> {
    await databases.deleteDocument(DB_ID, Col.TESTS, testId);
  },

  async start(userId: string, testId: string): Promise<TestAttempt> {
    const existing = await databases.listDocuments<any>(DB_ID, Col.TEST_ATTEMPTS, [
      Query.equal('userId', userId),
      Query.equal('testId', testId),
      Query.equal('status', 'in_progress'),
      Query.limit(1),
    ]);
    if (existing.documents.length) return parseAttempt(existing.documents[0]);

    const attempt = await databases.createDocument<any>(
      DB_ID, Col.TEST_ATTEMPTS, ID.unique(),
      { userId, testId, answersJson: '[]', status: 'in_progress' as AttemptStatus, startedAt: new Date().toISOString() },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.read(Role.label('admin')),
        Permission.read(Role.label('professional')),
        Permission.update(Role.label('admin')),
        Permission.update(Role.label('professional')),
      ],
    );
    return parseAttempt(attempt);
  },

  async submit(userId: string, payload: SubmitTestPayload): Promise<{
    score?: number; passed?: boolean; message: string; status: AttemptStatus;
  }> {
    const { attemptId, answers } = payload;
    const attempt = await databases.getDocument<any>(DB_ID, Col.TEST_ATTEMPTS, attemptId);
    if (attempt.userId !== userId) throw new Error('Accès interdit');
    if (attempt.status !== 'in_progress') throw new Error('Tentative déjà soumise');

    const test = parseTest(await databases.getDocument<any>(DB_ID, Col.TESTS, attempt.testId));
    const now = new Date().toISOString();

    if (test.type === 'auto') {
      const score = _calculateScore(test.questions!, answers);
      const passed = score >= test.passingScore;
      await databases.updateDocument(DB_ID, Col.TEST_ATTEMPTS, attemptId, {
        answersJson: JSON.stringify(answers), score,
        status: 'completed' as AttemptStatus, completedAt: now,
      });
      return { score, passed, message: _scoreMessage(score, test.passingScore), status: 'completed' };
    } else {
      await databases.updateDocument(DB_ID, Col.TEST_ATTEMPTS, attemptId, {
        answersJson: JSON.stringify(answers),
        status: 'pending_review' as AttemptStatus, completedAt: now,
      });
      functions.createExecution(Fn.NOTIFY, JSON.stringify({
        action: 'test_submitted', attemptId, userId,
      })).catch(console.error);
      return {
        message: 'Réponses soumises. Un professionnel analysera votre évaluation sous 48h.',
        status: 'pending_review',
      };
    }
  },

  async getAttempt(attemptId: string): Promise<any> {
    const attempt = await databases.getDocument<any>(DB_ID, Col.TEST_ATTEMPTS, attemptId);

    const [test, user] = await Promise.all([
      databases.getDocument<any>(DB_ID, Col.TESTS, attempt.testId),
      databases.getDocument<any>(DB_ID, Col.PROFILES, attempt.userId),
    ]);

    return {
      ...attempt,
      testTitle: test.title,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonyme',
      userEmail: user.email || '',
    };
  },

  async myAttempts(userId: string): Promise<TestAttempt[]> {
    const res = await databases.listDocuments<any>(DB_ID, Col.TEST_ATTEMPTS, [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(30),
    ]);
    return res.documents.map(parseAttempt);
  },

  async pendingReview(): Promise<(TestAttempt & { testTitle?: string; userName?: string })[]> {
    const res = await databases.listDocuments<any>(DB_ID, Col.TEST_ATTEMPTS, [
      Query.equal('status', 'pending_review'),
      Query.orderAsc('$createdAt'),
      Query.limit(50),
    ]);

    return Promise.all(
      res.documents.map(async a => {
        const parsed = parseAttempt(a);
        try {
          const [test, userProfile] = await Promise.all([
            databases.getDocument<any>(DB_ID, Col.TESTS, a.testId),
            databases.getDocument<any>(DB_ID, Col.PROFILES, a.userId),
          ]);
          return {
            ...parsed,
            testTitle: test.title,
            userName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Anonyme',
          };
        } catch {
          return parsed;
        }
      })
    );
  },

  async publish(testId: string, isPublished: boolean): Promise<Test> {
    const updates: Record<string, unknown> = {
      isPublished,
    };
    if (isPublished) {
      updates.publishedAt = new Date().toISOString();
    }
    return databases.updateDocument<any>(DB_ID, Col.TESTS, testId, updates);
  },

  async review(professionalId: string, payload: ReviewTestPayload): Promise<TestAttempt> {
    const { attemptId, score, feedback } = payload;

    if (score < 0 || score > 100) throw new Error('Score doit être entre 0 et 100');

    const attempt = await databases.getDocument<any>(DB_ID, Col.TEST_ATTEMPTS, attemptId);

    if (attempt.status !== 'pending_review') {
      throw new Error('Cette tentative a déjà été révisée ou n’est pas en attente');
    }

    const updated = await databases.updateDocument<any>(DB_ID, Col.TEST_ATTEMPTS, attemptId, {
      score,
      feedback,
      status: 'reviewed' as AttemptStatus,
      professionalId,
      reviewedAt: new Date().toISOString(),
    });

    functions.createExecution(Fn.NOTIFY, JSON.stringify({
      action: 'test_reviewed',
      userId: attempt.userId,
      attemptId,
      score,
      testId: attempt.testId,
    })).catch(console.error);

    return parseAttempt(updated);
  }

};

// ─── Helpers privés ───────────────────────────────────────────────────────────

function parseTest(doc: Test): Test {
  try { return { ...doc, questions: JSON.parse(doc.questionsJson) }; }
  catch { return { ...doc, questions: [] }; }
}

function parseAttempt(doc: TestAttempt): TestAttempt {
  try { return { ...doc, answers: JSON.parse(doc.answersJson) }; }
  catch { return { ...doc, answers: [] }; }
}

function stripCorrectAnswers(test: Test): Test {
  if (!test.questions) return test;
  return {
    ...test,
    questions: test.questions.map(({ correctAnswer, ...q }) => q as TestQuestion),
  };
}

function _calculateScore(questions: TestQuestion[], answers: TestAnswer[]): number {
  let score = 0, total = 0;
  for (const q of questions) {
    const w = q.weight ?? 1;
    total += w;
    const a = answers.find(x => x.questionId === q.id);
    if (!a) continue;
    if (q.responseType === 'scale') {
      const max = q.options?.length ?? 5;
      score += (Number(a.answer) / max) * w;
    } else if (q.responseType === 'multiple_choice' && Array.isArray(q.correctAnswer)) {
      const ua = Array.isArray(a.answer) ? a.answer.map(String) : [String(a.answer)];
      const ca = (q.correctAnswer as string[]).map(String);
      if (ua.length === ca.length && ua.every(x => ca.includes(x))) score += w;
    } else {
      if (String(a.answer) === String(q.correctAnswer)) score += w;
    }
  }
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function _scoreMessage(score: number, passing: number): string {
  if (score >= 80) return 'Excellent ! Votre bien-être est très bon.';
  if (score >= passing) return 'Bon résultat. Quelques points à améliorer.';
  if (score >= 40) return 'Résultat modéré. Nous vous recommandons de consulter un professionnel.';
  return 'Résultat préoccupant. Veuillez contacter un professionnel de santé mentale.';
}