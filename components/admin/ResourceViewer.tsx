import { Resource } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

interface ResourceAdmin extends Resource {
  $id: string;
  $createdAt: string;
  author?: string;
}

interface ResourceViewerProps {
  resource: ResourceAdmin;
}

export default function ResourceViewer({ resource }: ResourceViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {resource.description}
        </p>

        <Separator />

        {/* Article */}
        {resource.type === 'article' && resource.contentBase64 && (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: resource.contentBase64 }}
          />
        )}

        {/* Video / External */}
        {(resource.type === 'video' || resource.type === 'external') && (
          <div className="aspect-video rounded-xl overflow-hidden border">
            <iframe
              src={resource.iframeUrl || resource.externalUrl}
              title={resource.title}
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {/* Audio */}
        {resource.type === 'audio' && (
          <audio
            controls
            src={resource.contentBase64 || resource.externalUrl}
            className="w-full"
          />
        )}

        {/* Image */}
        {resource.previewImageBase64 && (
          <img
            src={resource.previewImageBase64}
            alt="Preview"
            className="rounded-xl border max-h-64 object-cover"
          />
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Type :</span>{' '}
            <Badge>{resource.type}</Badge>
          </div>
          <div>
            <span className="font-medium">Langue :</span>{' '}
            {resource.language?.toUpperCase()}
          </div>
          <div>
            <span className="font-medium">Statut :</span>{' '}
            <Badge variant={resource.isPublished ? 'default' : 'secondary'}>
              {resource.isPublished ? 'Publié' : 'Brouillon'}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Accès :</span>{' '}
            <Badge variant={resource.isPremium ? 'destructive' : 'outline'}>
              {resource.isPremium ? 'Premium' : 'Gratuit'}
            </Badge>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}