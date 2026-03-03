'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ResourceService } from '@/services/resource.service';
import { SubscriptionService } from '@/services/subscription.service';
import { PageHeader, Card, Badge, Button, Input, Empty } from '@/components/ui';
import { BookOpen, Video, Headphones, FileText, Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardContent } from '@/components/ui/card';

const RESOURCE_TYPES = [
    { value: 'all', label: 'Tous les types' },
    { value: 'article', label: 'Articles' },
    { value: 'audio', label: 'Audios' },
    { value: 'video', label: 'Vidéos' },
    { value: 'pdf', label: 'PDF' },
];

export default function ResourcesPage() {
    const { profile } = useAuth();

    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [hasPremium, setHasPremium] = useState(false);

    useEffect(() => {
        loadResources();
    }, [typeFilter, search]);

    const loadResources = async () => {
        setLoading(true);
        try {
            const activeSub = await SubscriptionService.getActive(profile?.$id || '');
            const userPremium = !!activeSub;
            setHasPremium(userPremium);

            const params: any = { limit: 20 };
            if (search) params.search = search;
            if (typeFilter !== 'all') params.type = typeFilter;

            const list = await ResourceService.listPublic(params);

            // Filtrer premium si pas abonné
            const filtered = list.filter(r => !r.isPremium || userPremium);
            setResources(filtered);
        } catch (err) {
            console.error('Erreur chargement ressources', err);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Ressources & Formations"
                subtitle="Articles, audios, vidéos et documents pour votre bien-être"
            />

            <div className="flex flex-wrap gap-4">
                <Input
                    placeholder="Rechercher par titre..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-64"
                />
                <Select value={typeFilter} onValueChange={(e: any) => setTypeFilter(e.target.value)}>
                    <SelectTrigger className='w-48'>
                        <SelectValue placeholder="Selectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                        {RESOURCE_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <CardContent key={i} className="h-64 animate-pulse bg-gray-100" />
                    ))}
                </div>
            ) : resources.length === 0 ? (
                <Empty
                    title="Aucune ressource trouvée"
                    description="Essayez d’autres filtres ou revenez plus tard."
                    // icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(resource => (
                        <Link key={resource.$id} href={`/resources/${resource.$id}`}>
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                                <div className="relative">
                                    {resource.previewImageBase64 ? (
                                        <img
                                            src={resource.previewImageBase64}
                                            alt={resource.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                                            {resource.type === 'article' && <FileText className="h-12 w-12 text-muted-foreground" />}
                                            {resource.type === 'audio' && <Headphones className="h-12 w-12 text-muted-foreground" />}
                                            {resource.type === 'video' && <Video className="h-12 w-12 text-muted-foreground" />}
                                        </div>
                                    )}

                                    {resource.isPremium && (
                                        <div className="absolute top-3 right-3">
                                            <Badge variant="purple" className="flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> Premium
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-medium line-clamp-2 mb-2">{resource.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                        {resource.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <Badge variant="gray">{resource.type}</Badge>
                                        <span>{resource.language?.toUpperCase()}</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}