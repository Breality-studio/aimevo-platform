'use client';

import { useState, useEffect, useCallback } from 'react';
import { ResourceService } from '@/services/resource.service';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Empty,
  Badge,
} from '@/components/ui';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Resource } from '@/lib/types';
import ResourceForm from '@/components/admin/ResourceForm';
import ResourceViewer from '@/components/admin/ResourceViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface ResourceAdmin extends Resource {
  $id: string;
  $createdAt: string;
  author?: string;
}

const RESOURCE_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'article', label: 'Article' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Vidéo' },
  { value: 'module', label: 'Module' },
];

const LANGUAGES = [
  { value: 'all', label: 'Toutes les langues' },
  { value: 'fr', label: 'Français' },
  { value: 'fon', label: 'Fon' },
  { value: 'goun', label: 'Goun' },
  { value: 'mina', label: 'Mina' },
];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [premiumFilter, setPremiumFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedResource, setSelectedResource] = useState<ResourceAdmin | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

    const loadResources = useCallback(async (loadMore = false) => {
    setLoading(true);
    try {
      const res = await ResourceService.listAdmin({
        search: search || undefined,
        type: typeFilter !== 'all' ? (typeFilter as any) : '',
        language: langFilter !== 'all' ? (langFilter as any) : '',
        isPremium: premiumFilter === 'premium' ? true : premiumFilter === 'free' ? false : undefined,
        isPublished: publishedFilter === 'published' ? true : publishedFilter === 'draft' ? false : undefined,
        limit: 15,
        cursor: loadMore ? (cursor as any) : undefined,
      });

      setResources(prev => loadMore ? [...prev, ...res.resources] : res.resources);
      setCursor(res.cursor);
      setHasMore(!!res.cursor);
    } catch (err) {
      console.error('Erreur chargement ressources', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, langFilter, premiumFilter, publishedFilter, cursor]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handlePublishToggle = async (resourceId: string, current: boolean) => {
    try {
      await ResourceService.publish(resourceId, !current);
      setResources(prev =>
        prev.map(r =>
          r.$id === resourceId ? { ...r, isPublished: !current } : r
        )
      );
    } catch (err) {
      console.error('Erreur publication', err);
    }
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    try {
      await ResourceService.delete(resourceToDelete);
      setResources(prev => prev.filter(r => r.$id !== resourceToDelete));
    } catch (err) {
      console.error('Erreur suppression', err);
    } finally {
      setResourceToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const columns: ColumnDef<ResourceAdmin>[] = [
    {
      accessorKey: 'title',
      header: 'Titre',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge>{row.original.type}</Badge>,
    },
    {
      accessorKey: 'language',
      header: 'Langue',
      cell: ({ row }) =>
        row.original.language?.toUpperCase() ?? '-',
    },
    {
      accessorKey: 'isPublished',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? 'green' : 'orange'}>
          {row.original.isPublished ? 'Publié' : 'Brouillon'}
        </Badge>
      ),
    },
    {
      accessorKey: 'isPremium',
      header: 'Accès',
      cell: ({ row }) => (
        <Badge variant={row.original.isPremium ? 'purple' : 'blue'}>
          {row.original.isPremium ? 'Premium' : 'Gratuit'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedResource(r);
                setIsViewModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedResource(r);
                setIsEditModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                handlePublishToggle(r.$id, r.isPublished)
              }
            >
              {r.isPublished ? (
                <XCircle className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                setResourceToDelete(r.$id);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ressources & Formations"
        subtitle="Gestion des contenus éducatifs et culturels"
        actions={
          <Button
            onClick={() => {
              setSelectedResource(null);
              setIsEditModalOpen(true);
            }}
          >
            Nouvelle ressource
          </Button>
        }
      />

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher par titre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_TYPES.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Langue" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={premiumFilter} onValueChange={setPremiumFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Accès" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="free">Gratuit</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>

        <Select value={publishedFilter} onValueChange={setPublishedFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <DataTable columns={columns} data={resources} />
      </Card>

      {hasMore && (
        <Button
          onClick={() => loadResources(true)}
          disabled={loading}
          className="mx-auto block"
        >
          {loading ? 'Chargement...' : 'Charger plus'}
        </Button>
      )}

      {/* Modal Visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <ResourceViewer resource={selectedResource} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Edition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {selectedResource ? 'Modifier' : 'Nouvelle'} ressource
            </DialogTitle>
          </DialogHeader>
          <ResourceForm
            resource={selectedResource}
            onSuccess={() => {
              setIsEditModalOpen(false);
              loadResources();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}