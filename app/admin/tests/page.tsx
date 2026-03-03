'use client';

import { useState, useEffect, useCallback } from 'react';
import { TestService } from '@/services/test.service';
import { useAuth } from '@/hooks/useAuth';

import {
  PageHeader,
  Input,
  Empty,
} from '@/components/ui';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TestForm from '@/components/admin/TestForm';
import TestAttemptReview from '@/components/admin/TestAttemptReview';

const TEST_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'auto', label: 'Auto-évaluation' },
  { value: 'supervised', label: 'Supervisé' },
];

export default function AdminTestsPage() {
  const { user, profile } = useAuth();

  const [tests, setTests] = useState<any[]>([]);
  const [pendingAttempts, setPendingAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [editTest, setEditTest] = useState<any | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const testsRes = await TestService.listAdmin({
        search,
        type: typeFilter !== 'all' ? (typeFilter as any) : undefined,
      });

      const attemptsRes = await TestService.pendingReview();

      setTests(testsRes || []);
      setPendingAttempts(attemptsRes || []);
    } catch (err) {
      console.error(err);
      setTests([]);
      setPendingAttempts([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePublish = async (id: string, current: boolean) => {
    await TestService.publish(id, !current);
    setTests(prev =>
      prev.map(t =>
        t.$id === id ? { ...t, isPublished: !current } : t
      )
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await TestService.delete(deleteId);
    setTests(prev => prev.filter(t => t.$id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tests & Évaluations"
        subtitle="Gestion des questionnaires et corrections"
        actions={<Button onClick={() => setEditTest({})}>Nouveau test</Button>}
      />

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">
            Tests ({tests.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({pendingAttempts.length})
          </TabsTrigger>
        </TabsList>

        {/* ================= TESTS ================= */}
        <TabsContent value="tests" className="space-y-6">

          <div className="flex gap-3">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64"
            />

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="p-6 space-y-4">
            {tests.length === 0 && !loading && (
              <Empty title="Aucun test créé" />
            )}

            {tests.map(test => (
              <div
                key={test.$id}
                className="flex items-center justify-between border rounded-xl p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium">{test.title}</p>

                  <div className="flex gap-2">
                    <Badge>
                      {test.type === 'auto' ? 'Auto' : 'Supervisé'}
                    </Badge>

                    <Badge variant={test.isPublished ? 'default' : 'secondary'}>
                      {test.isPublished ? 'Publié' : 'Brouillon'}
                    </Badge>

                    <Badge variant={test.isPremium ? 'destructive' : 'outline'}>
                      {test.isPremium ? 'Premium' : 'Gratuit'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditTest(test)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(test.$id, test.isPublished)}
                  >
                    {test.isPublished ? (
                      <XCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => setDeleteId(test.$id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* ================= PENDING ================= */}
        <TabsContent value="pending">
          <Card className="p-6 space-y-4">
            {pendingAttempts.length === 0 && !loading && (
              <Empty title="Aucune tentative en attente" />
            )}

            {pendingAttempts.map(attempt => (
              <div
                key={attempt.$id}
                className="flex justify-between items-center border rounded-xl p-4"
              >
                <div>
                  <p className="font-medium">
                    {attempt.userFirstName || 'Anonyme'}{' '}
                    {attempt.userLastName || ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {attempt.testTitle}
                  </p>
                </div>

                <Button size="sm" onClick={() => setReviewAttempt(attempt)}>
                  Corriger
                </Button>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= MODALS ================= */}

      <Dialog open={editTest !== null} onOpenChange={() => setEditTest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTest?.$id ? 'Modifier le test' : 'Nouveau test'}
            </DialogTitle>
          </DialogHeader>

          <TestForm
            initialTest={editTest?.$id ? editTest : null}
            onSuccess={() => {
              setEditTest(null);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={reviewAttempt !== null} onOpenChange={() => setReviewAttempt(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Noter la tentative</DialogTitle>
          </DialogHeader>

          {reviewAttempt && (
            <TestAttemptReview
              professionalId={user?.$id}
              attempt={reviewAttempt}
              onSuccess={() => {
                setReviewAttempt(null);
                loadData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
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