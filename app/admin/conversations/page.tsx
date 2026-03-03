'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, Button, Input, Table, Empty, Textarea } from '@/components/ui';
import { MessageSquare, Eye, XCircle, FileText, Search, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChatService } from '@/services/chat.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'open', label: 'Ouvertes' },
    { value: 'closed', label: 'Fermées' },
    { value: 'archived', label: 'Archivées' },
];

export default function AdminConversationsPage() {
    const { profile } = useAuth();

    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [closeReason, setCloseReason] = useState('');
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [availablePros, setAvailablePros] = useState<any[]>([]);
    const [newProId, setNewProId] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { status: statusFilter !== 'all' ? statusFilter : undefined };
            const { conversations } = await ChatService.listAdmin(params);
            setConversations(conversations);
        } catch (err) {
            console.error(err);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (transferDialogOpen) {
            ChatService.listAvailableProfessionals().then(setAvailablePros).catch(console.error);
        }
    }, [transferDialogOpen]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return load();
        setLoading(true);
        try {
            const res = await ChatService.searchAdmin(searchQuery);
            setConversations(res);
        } catch (err) {
            console.error(err);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        if (!selectedConv) return;
        try {
            await ChatService.close(selectedConv.$id, profile!.$id, closeReason.trim() || undefined);
            setConversations(prev => prev.map(c => c.$id === selectedConv.$id ? { ...c, status: 'closed' } : c));
            setCloseDialogOpen(false);
            setCloseReason('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNote = async () => {
        if (!selectedConv || !newNote.trim()) return;
        try {
            await ChatService.addAdminNote(selectedConv.$id, newNote.trim());
            const updated = await ChatService.getAdmin(selectedConv.$id);
            setConversations(prev => prev.map(c => c.$id === selectedConv.$id ? updated.conversation : c));
            setNoteDialogOpen(false);
            setNewNote('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleTransfer = async () => {
        if (!selectedConv || !newProId) return;
        try {
            await ChatService.transfer(selectedConv.$id, newProId, profile!.$id);
            const updated = await ChatService.getAdmin(selectedConv.$id);
            setConversations(prev => prev.map(c => c.$id === selectedConv.$id ? updated.conversation : c));
            setTransferDialogOpen(false);
            setNewProId('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Supervision des Conversations"
                subtitle="Historique, statut et notes internes"
            />

            <div className="flex flex-wrap gap-3">
                <div className="flex gap-2">
                    <Input
                        placeholder="Rechercher par nom ou ID participant"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-72"
                    />
                    <Button onClick={handleSearch}>
                        <Search className="h-4 w-4 mr-2" />
                        Rechercher
                    </Button>
                </div>
                <Select value={statusFilter} onValueChange={(e: any) => setStatusFilter(e.target.value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_FILTERS.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}

                    </SelectContent>
                </Select>
                <Button variant="ghost" onClick={load}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Rafraîchir
                </Button>
            </div>

            <Card padding={false}>
                <Table
                    columns={[
                        {
                            key: 'participants', label: 'Participants', render: (c: any) => (
                                <div>
                                    <div className="font-medium">{c.memberName}</div>
                                    <div className="text-xs text-muted-foreground">→ {c.proName}</div>
                                </div>
                            )
                        },
                        {
                            key: 'status', label: 'Statut', render: (c: any) => (
                                <Badge variant={
                                    c.status === 'open' ? 'green' :
                                        c.status === 'closed' ? 'red' : 'gray'
                                }>
                                    {c.status === 'open' ? 'Active' : c.status === 'closed' ? 'Fermée' : 'Archivée'}
                                </Badge>
                            )
                        },
                        { key: 'lastMessage', label: 'Dernier message', render: (c: any) => c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('fr-FR') : '—' },
                        {
                            key: 'actions',
                            label: '',
                            render: (c: any) => (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedConv(c)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {c.status === 'open' && (
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setSelectedConv(c); setCloseDialogOpen(true); }}>
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => { setSelectedConv(c); setNoteDialogOpen(true); }}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setSelectedConv(c); setTransferDialogOpen(true); }}>
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        },
                    ]}
                    data={conversations}
                    loading={loading}
                    keyFn={c => c.$id}
                />

                {!loading && conversations.length === 0 && <Empty title="Aucune conversation trouvée" />}
            </Card>

            {/* Modal détail conversation */}
            <Dialog open={selectedConv !== null && !closeDialogOpen && !noteDialogOpen && !transferDialogOpen} onOpenChange={() => setSelectedConv(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Conversation : {selectedConv?.memberName} ↔ {selectedConv?.proName}</DialogTitle>
                    </DialogHeader>
                    {selectedConv && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Statut :</strong> {selectedConv.status}</div>
                                <div><strong>Début :</strong> {new Date(selectedConv.createdAt).toLocaleString('fr-FR')}</div>
                                <div><strong>Dernier message :</strong> {selectedConv.lastMessageAt ? new Date(selectedConv.lastMessageAt).toLocaleString('fr-FR') : '—'}</div>
                                {selectedConv.closedAt && <div><strong>Fermée le :</strong> {new Date(selectedConv.closedAt).toLocaleString('fr-FR')}</div>}
                            </div>

                            {selectedConv.adminNotes && (
                                <div>
                                    <h3 className="font-medium mb-2">Notes administrateur</h3>
                                    <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-sm">
                                        {selectedConv.adminNotes}
                                    </div>
                                </div>
                            )}

                            {/* Historique messages */}
                            <div>
                                <h3 className="font-medium mb-2">Historique récent</h3>
                                <p className="text-sm text-muted-foreground italic">
                                    (Affichage complet des messages non implémenté ici – utiliser une page dédiée si nécessaire)
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog Fermeture */}
            <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fermer la conversation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Indiquez une raison (optionnelle) puis confirmez.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={closeReason}
                        onChange={e => setCloseReason(e.target.value)}
                        placeholder="Raison de la fermeture (ex: demande utilisateur, fin de suivi...)"
                        className="min-h-24"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClose}>
                            Confirmer la fermeture
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Ajout note */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter une note interne</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Note visible uniquement par les administrateurs..."
                        rows={6}
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setNoteDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                            Ajouter la note
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog Transfert */}
            <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transférer la conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Sélectionnez un professionnel disponible pour transférer la conversation.
                        </p>
                        <Select value={newProId} onValueChange={(e: any) => setNewProId(e.target.value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={""}>
                                    Choisir un professionnel
                                </SelectItem>
                                {availablePros.map(pro => (
                                    <SelectItem key={pro.$id} value={pro.$id}>
                                        {pro.firstName} {pro.lastName} ({pro.availabilityStatus})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setTransferDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleTransfer} disabled={!newProId}>
                                Transférer
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}