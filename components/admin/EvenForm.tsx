'use client';

import { useState } from 'react';
import { EventService } from '@/services/event.service';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface EventFormProps {
    authorId: string;
    initialEvent?: any | null;
    onSuccess: () => void;
}

export default function EventForm({ authorId, initialEvent, onSuccess }: EventFormProps) {
    const [form, setForm] = useState({
        title: initialEvent?.title || '',
        description: initialEvent?.description || '',
        type: initialEvent?.type || 'online',
        location: initialEvent?.location || '',
        startDate: initialEvent?.startDate ? new Date(initialEvent.startDate).toISOString().slice(0, 16) : '',
        endDate: initialEvent?.endDate ? new Date(initialEvent.endDate).toISOString().slice(0, 16) : '',
        price: initialEvent?.price || 0,
        maxPlaces: initialEvent?.maxPlaces || 50,
        tags: initialEvent?.tags?.join(', ') || '',
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload: any = {
                title: form.title,
                description: form.description,
                type: form.type,
                location: form.location || null,
                startDate: new Date(form.startDate).toISOString(),
                endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
                price: Number(form.price),
                maxPlaces: Number(form.maxPlaces),
                tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            };

            if (initialEvent) {
                await EventService.update(initialEvent.$id, payload);
            } else {
                await EventService.create(authorId, payload);
            }

            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Titre *</Label>
                    <Input value={form.title} onChange={e => handleChange('title', e.target.value)} />
                </div>

                <div>
                    <Label>Type *</Label>
                    <Select value={form.type} onValueChange={val => handleChange('type', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="online">En ligne</SelectItem>
                            <SelectItem value="presentiel">Présentiel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Date de début *</Label>
                    <Input
                        type="datetime-local"
                        value={form.startDate}
                        onChange={e => handleChange('startDate', e.target.value)}
                    />
                </div>

                <div>
                    <Label>Date de fin (optionnelle)</Label>
                    <Input
                        type="datetime-local"
                        value={form.endDate}
                        onChange={e => handleChange('endDate', e.target.value)}
                    />
                </div>

                <div>
                    <Label>Lieu ou lien *</Label>
                    <Input
                        placeholder={form.type === 'online' ? 'https://zoom.us/j/...' : 'Adresse complète'}
                        value={form.location}
                        onChange={e => handleChange('location', e.target.value)}
                    />
                </div>

                <div>
                    <Label>Prix (0 = gratuit) *</Label>
                    <Input
                        type="number"
                        value={form.price}
                        onChange={e => handleChange('price', e.target.value)}
                        min={0}
                    />
                </div>

                <div>
                    <Label>Nombre maximum de places</Label>
                    <Input
                        type="number"
                        value={form.maxPlaces}
                        onChange={e => handleChange('maxPlaces', e.target.value)}
                        min={1}
                    />
                </div>
            </div>

            <div>
                <Label>Description détaillée</Label>
                <Textarea
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={5}
                />
            </div>

            <div>
                <Label>Tags (séparés par virgule)</Label>
                <Input
                    value={form.tags}
                    onChange={e => handleChange('tags', e.target.value)}
                    placeholder="santé mentale, méditation, ..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" type="button" onClick={onSuccess}>
                    Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Enregistrement...' : initialEvent ? 'Mettre à jour' : 'Créer'}
                </Button>
            </div>
        </div>
    );
}