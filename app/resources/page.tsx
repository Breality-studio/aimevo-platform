'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { SubscriptionService } from '@/services/subscription.service';
import { ResourceService } from '@/services/resource.service';
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Badge, Button, Input, Empty } from '@/components/ui';
import {
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue
} from '@/components/ui/select'
import Link from 'next/link';
import { BookOpen, Video, Headphones, FileText, Lock, ChevronRight } from 'lucide-react';

const RESOURCE_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'article', label: 'Articles' },
  { value: 'audio', label: 'Audios' },
  { value: 'video', label: 'Vidéos' },
  { value: 'pdf', label: 'PDF' },
];

export default function ResourcesPage() {
  const { profile } = useAuth();
  const { setLoading } = useLoading();

  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    if (!profile) return;
    loadResources();
  }, [profile, typeFilter, search]);

  const loadResources = async () => {
    setLocalLoading(true);
    setLoading(true, 'Chargement des ressources...');

    try {
      const activeSub = await SubscriptionService.getActive(profile!.$id);
      const userPremium = !!activeSub;
      setHasPremium(userPremium);

      const params: any = { limit: 20 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;

      const list = await ResourceService.listPublic(params);
      const filtered = list.filter(r => !r.isPremium || userPremium);
      setResources(filtered);
    } catch (err) {
      console.error('Erreur chargement ressources', err);
      setResources([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      {/* Navbar du landing page */}
      <Header />

      {/* Contenu principal */}
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto animate-fade-up space-y-10">
        {/* En-tête */}
        <PageHeader
          title="Ressources & Formations"
          subtitle="Articles, audios, vidéos et documents pour votre bien-être"
        />

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Rechercher par titre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <Empty
            title="Aucune ressource trouvée"
            description="Essayez d’autres filtres ou revenez plus tard."
            // icon={<BookOpen className="h-12 w-12 text-[#C4922A]/50" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <Link key={resource.$id} href={`/resources/${resource.$id}`}>
                <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-[#D4C9B8]/60 bg-white">
                  <div className="relative">
                    {resource.previewImageBase64 ? (
                      <img
                        src={resource.previewImageBase64}
                        alt={resource.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-linear-to-br from-[#FAFAF8] to-[#F0EDE6] flex items-center justify-center">
                        {resource.type === 'article' && <FileText className="h-12 w-12 text-[#8B7355]" />}
                        {resource.type === 'audio' && <Headphones className="h-12 w-12 text-[#8B7355]" />}
                        {resource.type === 'video' && <Video className="h-12 w-12 text-[#8B7355]" />}
                        {resource.type === 'pdf' && <FileText className="h-12 w-12 text-[#8B7355]" />}
                      </div>
                    )}

                    {resource.isPremium && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#C4922A] text-white flex items-center gap-1 px-3 py-1">
                          <Lock className="h-3 w-3" /> Premium
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-medium text-lg line-clamp-2 mb-2 text-[#0F0D0A]">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-[#8B7355] line-clamp-3 mb-4">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#8B7355]">
                      <Badge variant="blue" className="bg-[#FAFAF8]">
                        {resource.type}
                      </Badge>
                      <span>{resource.language?.toUpperCase() || 'FR'}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Bouton d'accès rapide vers toutes les ressources */}
        <div className="flex justify-center mt-8">
          <Button variant="primary" className="border-[#C4922A] text-[#C4922A] hover:bg-[#C4922A]/10">
            Explorer toutes les ressources
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}