'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { Header } from '@/components/layout/Header';
import { PageHeader, Card, Button, Input, Badge } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, Shield, Edit, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const { setLoading } = useLoading();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    setLoading(true, 'Chargement de votre profil...');
    
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: user?.$id === profile.userId ? user.email : '',
    });

    setLoading(false);
  }, [profile, user, setLoading]);

  useEffect(() => {
    if (!profile) return;
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setLoading(true, 'Mise à jour de votre profil...');

    try {
      // TODO: implémenter updateProfile dans AuthService
      // await AuthService.updateProfile(profile!.$id, formData);
      alert('Profil mis à jour avec succès !');
      setEditMode(false);
    } catch (err) {
      alert('Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] to-[#F0EDE6]">
      <Header />

      <main className="pt-20 pb-12 px-4 md:px-8 max-w-4xl mx-auto animate-fade-up space-y-10">
        <PageHeader
          title="Mon Profil"
          subtitle="Gérez vos informations personnelles et votre compte"
        />

        <Card className="border-[#D4C9B8]/60 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-[#C4922A]/30">
                  {/* <AvatarImage src={profile.avatarUrl} alt={profile.firstName} /> */}
                  <AvatarFallback className="bg-[#C4922A]/10 text-[#C4922A] text-4xl font-semibold">
                    {profile.firstName?.[0]}
                    {profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute bottom-0 right-0 bg-white shadow-md rounded-full"
                  onClick={() => alert('Fonctionnalité d’avatar en développement')}
                >
                  <Edit className="h-5 w-5 text-[#C4922A]" />
                </Button>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-3xl font-semibold text-[#0F0D0A]">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-[#8B7355] flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
                <p className="text-sm text-[#8B7355] flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Inscrit le {new Date(profile.$createdAt).toLocaleDateString('fr-FR')}
                </p>
                <Badge className="mt-2 bg-amber-800 text-white">
                  Membre
                </Badge>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#C4922A]" />
                  Informations personnelles
                </h3>

                {editMode ? (
                  <div className="space-y-4">
                    <Input
                      label="Prénom"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    <Input
                      label="Nom"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    <Input
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                    />
                    <div className="flex gap-4">
                      <Button
                        onClick={handleSave}
                        className="bg-[#C4922A] hover:bg-[#A07520]"
                      >
                        Enregistrer
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Prénom</p>
                      <p className="font-medium">{profile.firstName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-medium">{profile.lastName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email || profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Langue préférée</p>
                      <p className="font-medium">
                        {profile.preferredLanguage?.toUpperCase() || 'FR'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-[#D4C9B8]/60">
                <Button
                  variant="danger"
                  className="w-full md:w-auto"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}