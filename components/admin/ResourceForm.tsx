'use client';

import { useState, useEffect } from 'react';
import { ResourceService } from '@/services/resource.service';
import {
  Card,
  Input,
  Textarea,
} from '@/components/ui';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth';

interface ResourceFormProps {
  initialResource?: any | null;
  onSuccess: () => void;
}

export default function ResourceForm({
  initialResource,
  onSuccess,
}: ResourceFormProps) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'article',
    language: 'fr',
    externalUrl: '',
    iframeUrl: '',
    contentBase64: '',
    previewImageBase64: '',
    isPremium: false,
    tags: '',
  });

  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (initialResource) {
      setForm({
        title: initialResource.title ?? '',
        description: initialResource.description ?? '',
        type: initialResource.type ?? 'article',
        language: initialResource.language ?? 'fr',
        externalUrl: initialResource.externalUrl ?? '',
        iframeUrl: initialResource.iframeUrl ?? '',
        contentBase64: initialResource.contentBase64 ?? '',
        previewImageBase64: initialResource.previewImageBase64 ?? '',
        isPremium: initialResource.isPremium ?? false,
        tags: initialResource.tags?.join(', ') ?? '',
      });

      if (initialResource.previewImageBase64) {
        setPreviewImage(initialResource.previewImageBase64);
      }
    }
  }, [initialResource]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileToBase64 = (
    file: File,
    field: 'contentBase64' | 'previewImageBase64'
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm(prev => ({ ...prev, [field]: base64 }));
      if (field === 'previewImageBase64') setPreviewImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        externalUrl: form.externalUrl || null,
        iframeUrl: form.iframeUrl || null,
        previewImageBase64: form.previewImageBase64 || null,
        tags: form.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
      };

      if (initialResource) {
        await ResourceService.update(initialResource.$id, payload);
      } else {
        await ResourceService.create(user?.$id, payload, true);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='max-w-xl w-full h-125 overflow-auto '>
      <CardContent className="space-y-6">

        {/* Informations principales */}
        <div className="w-full grid md:grid-cols-2 gap-2">

          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              className='w-full'
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={form.type}
              onValueChange={value => handleChange('type', value)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-full'>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Vidéo</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="external">Externe (iframe)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Langue *</Label>
            <Select
              value={form.language}
              onValueChange={value => handleChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="fon">Fon</SelectItem>
                <SelectItem value="goun">Goun</SelectItem>
                <SelectItem value="mina">Mina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={form.isPremium}
              onCheckedChange={checked =>
                handleChange('isPremium', checked)
              }
            />
            <Label>Contenu Premium</Label>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
          />
        </div>

        {/* Contenu principal */}
        {(form.type === 'article' ||
          form.type === 'audio' ||
          form.type === 'video') && (
            <div className="space-y-2">
              <Label>Fichier principal</Label>
              <Input
                type="file"
                accept={
                  form.type === 'article'
                    ? 'image/*'
                    : form.type === 'audio'
                      ? 'audio/*'
                      : 'video/*'
                }
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileToBase64(file, 'contentBase64');
                }}
              />
            </div>
          )}

        {/* Lien externe */}
        <div className="space-y-2">
          <Label>Lien externe</Label>
          <Input
            placeholder="https://..."
            value={form.externalUrl}
            onChange={e => handleChange('externalUrl', e.target.value)}
          />
        </div>

        {(form.type === 'video' || form.type === 'external') && (
          <div className="space-y-2">
            <Label>Iframe URL</Label>
            <Input
              placeholder="https://www.youtube.com/embed/..."
              value={form.iframeUrl}
              onChange={e => handleChange('iframeUrl', e.target.value)}
            />
          </div>
        )}

        {/* Image preview */}
        <div className="space-y-2">
          <Label>Image de couverture</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileToBase64(file, 'previewImageBase64');
            }}
          />

          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="mt-2 max-h-40 rounded-lg border object-cover"
            />
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <Input
            value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
            placeholder="culture, bien-être, méditation"
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? 'Enregistrement...'
              : initialResource
                ? 'Mettre à jour'
                : 'Créer'}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}