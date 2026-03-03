'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TestService } from '@/services/test.service';
import { Card, Button, Textarea, Input, Badge, Alert } from '@/components/ui';
import { Save, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AlertDescription } from '@/components/ui/alert';

export default function ProTestReview() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [attempt, setAttempt] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId || !profile) return;

    const load = async () => {
      setLoading(true);
      try {
        // À implémenter : getAttemptById dans TestService
        const data = await TestService.getAttempt(attemptId); // À créer
        if (data) {
          setAttempt(data);
          setScore(data.score || 0);
          setFeedback(data.feedback || '');
        }
      } catch (err) {
        console.error('Erreur chargement tentative', err);
        setError('Impossible de charger ce test.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [attemptId, profile]);

  const handleSubmit = async () => {
    if (!attempt) return;

    setSaving(true);
    setError(null);

    try {
      await TestService.review(profile!.$id, {
        attemptId,
        score: Number(score),
        feedback: feedback.trim(),
      });

      alert('Évaluation enregistrée avec succès.');
      router.push('/pro/tests');
    } catch (err) {
      console.error('Erreur enregistrement évaluation', err);
      setError('Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement du test...</div>;
  }

  if (!attempt || error) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">{error || 'Test introuvable'}</p>
        <Button onClick={() => router.push('/pro/tests')}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Correction du test</h1>
        <Button variant="ghost" onClick={() => router.push('/pro/tests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Patient</Label>
            <p className="font-medium">{attempt.userName || 'Anonyme'}</p>
            <p className="text-sm text-muted-foreground">{attempt.userEmail || '—'}</p>
          </div>
          <div>
            <Label>Test</Label>
            <p className="font-medium">{attempt.testTitle || 'Sans titre'}</p>
            <p className="text-sm text-muted-foreground">
              Soumis le {new Date(attempt.completedAt).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        {/* Réponses du patient */}
        <div className="space-y-4">
          <h3 className="font-medium">Réponses soumises</h3>
          <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(JSON.parse(attempt.answersJson || '{}'), null, 2)}
            </pre>
          </div>
        </div>

        {/* Formulaire de notation */}
        <div className="space-y-6 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Score final (0–100)</Label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Commentaire / Feedback</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Points forts, axes d’amélioration, conseils personnalisés..."
              rows={6}
            />
          </div>

          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => router.push('/pro/tests')}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Valider l’évaluation'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}