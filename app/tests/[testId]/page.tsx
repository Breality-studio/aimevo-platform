'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { TestService } from '@/services/test.service';
import { Header } from '@/components/layout/Header';
import { Button, Card, Alert } from '@/components/ui';
import { AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const { profile } = useAuth();
  const { setLoading } = useLoading();
  const router = useRouter();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLocalLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!testId) return;
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement du test...');

    try {
      const data = await TestService.getPublic(testId);
      setTest(data);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Erreur chargement test', err);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setLoading(true, 'Soumission des réponses...');

    try {
      await TestService.submitAnswers(profile!.$id, testId, answers);
      alert('Test soumis avec succès ! Vos résultats sont disponibles dans votre historique.');
      router.push('/tests/history');
    } catch (err) {
      alert('Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  if (loading) {
    return null; // GlobalLoader
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <Alert variant="destructive">
            <AlertDescription>Test introuvable ou non disponible.</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/tests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux tests
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      <Header />

      <main className="pt-20 pb-12 px-4 md:px-8 max-w-4xl mx-auto animate-fade-up space-y-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/tests')}
            className="text-[#0F0D0A] hover:bg-[#C4922A]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux tests
          </Button>

          <Badge className="bg-purple-600 text-white">
            Question {currentQuestion + 1} / {questions.length}
          </Badge>
        </div>

        <Card className="border-[#D4C9B8]/60 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="p-8">
            <h1 className="font-display text-3xl font-semibold text-[#0F0D0A] mb-8">
              {test.title}
            </h1>

            <div className="space-y-8">
              <div className="bg-[#FAFAF8]/70 p-6 rounded-xl">
                <p className="text-lg text-[#0F0D0A] leading-relaxed">
                  {currentQ?.text}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ?.options?.map((option: string, idx: number) => (
                  <Button
                    key={idx}
                    variant={answers[currentQ.id] === option ? 'default' : 'outline'}
                    className={`h-auto py-4 text-left ${
                      answers[currentQ.id] === option
                        ? 'bg-[#C4922A] text-white hover:bg-[#A07520]'
                        : 'border-[#C4922A]/30 hover:border-[#C4922A]'
                    }`}
                    onClick={() => handleAnswer(currentQ.id, option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                >
                  Question précédente
                </Button>

                {currentQuestion < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    disabled={!answers[currentQ.id]}
                  >
                    Question suivante
                  </Button>
                ) : (
                  <Button
                    className="bg-[#C4922A] hover:bg-[#A07520]"
                    disabled={submitting || Object.keys(answers).length < questions.length}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Soumission en cours...' : 'Soumettre le test'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}