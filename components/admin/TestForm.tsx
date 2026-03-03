'use client';

import { useState } from 'react';
import { TestService } from '@/services/test.service';
import {
    Input,
    Textarea,
    Card
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';

interface Question {
    id: string;
    text: string;
    correctAnswer: string;
    weight: number;
}

interface Props {
    initialTest?: any | null;
    onSuccess: () => void;
}

export default function TestForm({ initialTest, onSuccess }: Props) {
    const { user } = useAuth();

    const [title, setTitle] = useState(initialTest?.title || '');
    const [description, setDescription] = useState(initialTest?.description || '');
    const [type, setType] = useState(initialTest?.type || 'auto');
    const [isPremium, setIsPremium] = useState(initialTest?.isPremium || false);

    const [questions, setQuestions] = useState<Question[]>(
        initialTest?.questionsJson
            ? JSON.parse(initialTest.questionsJson)
            : []
    );

    const addQuestion = () => {
        setQuestions(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                text: '',
                correctAnswer: '',
                weight: 1,
            },
        ]);
    };

    const updateQuestion = (id: string, field: string, value: any) => {
        setQuestions(prev =>
            prev.map(q => (q.id === id ? { ...q, [field]: value } : q))
        );
    };

    const removeQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handleSubmit = async () => {
        const payload :any = {
            title,
            description,
            type,
            isPremium,
            questionsJson: JSON.stringify(questions),
        };

        if (initialTest) {
            await TestService.update(initialTest.$id, payload);
        } else {
            await TestService.create(user?.$id, payload);
        }

        onSuccess();
    };

    return (
        <div className="space-y-6">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" />
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />

            <div className="flex items-center gap-3">
                <Label>Premium</Label>
                <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </div>

            <Card className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Questions</h3>
                    <Button size="sm" onClick={addQuestion}>Ajouter</Button>
                </div>

                {questions.map(q => (
                    <div key={q.id} className="border rounded-lg p-4 space-y-3">
                        <Input
                            placeholder="Question"
                            value={q.text}
                            onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                        />
                        <Input
                            placeholder="Bonne réponse"
                            value={q.correctAnswer}
                            onChange={e => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Poids"
                            value={q.weight}
                            onChange={e => updateQuestion(q.id, 'weight', Number(e.target.value))}
                        />
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeQuestion(q.id)}
                        >
                            Supprimer
                        </Button>
                    </div>
                ))}
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSubmit}>
                    {initialTest ? 'Mettre à jour' : 'Créer'}
                </Button>
            </div>
        </div>
    );
}