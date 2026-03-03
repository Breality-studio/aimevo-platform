'use client';

import { useState } from 'react';
import { TestService } from '@/services/test.service';
import { Input, Textarea } from '@/components/ui';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface AttemptProps {
    attemptId: string;
    score: number;
    feedback: string;
    [key: string]: any
}

interface TestAttemptReviewProps {
    professionalId: string;
    attempt: AttemptProps;
    onSuccess: () => void;
}

export default function TestAttemptReview({ professionalId, attempt, onSuccess }: TestAttemptReviewProps) {
    const [score, setScore] = useState<number>(attempt.score || 0);
    const [feedback, setFeedback] = useState(attempt.feedback || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await TestService.review(professionalId, { attemptId: attempt.$id, score, feedback });
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-medium">Utilisateur</h3>
                <p>{attempt.userFirstName || 'Anonyme'} {attempt.userLastName || ''}</p>
            </div>

            <div>
                <h3 className="font-medium">Test</h3>
                <p>{attempt.testTitle}</p>
            </div>

            <div>
                <h3 className="font-medium">Réponses soumises</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(JSON.parse(attempt.answersJson || '{}'), null, 2)}
                </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Score final (0-100)</Label>
                    <Input
                        type="number"
                        value={score}
                        onChange={e => setScore(Number(e.target.value))}
                        min={0}
                        max={100}
                    />
                </div>
            </div>

            <div>
                <Label>Feedback / Commentaire</Label>
                <Textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={6}
                    placeholder="Points forts, axes d’amélioration, conseils..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={onSuccess}>
                    Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Valider la notation'}
                </Button>
            </div>
        </div>
    );
}