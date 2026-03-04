'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminService } from '@/services/admin.service';
import { PageHeader, Card, Badge, Button, Input, Select, Table, Empty } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

const ROLES = [
  { value: 'all', label: 'Tous les rôles' },
  { value: 'member', label: 'Membres' },
  { value: 'professional', label: 'Professionnels' },
  { value: 'admin', label: 'Admins' },
];

interface User {
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'professional' | 'member';
  isActive: boolean;
  $createdAt: string;
}

const ROLE_MAP: Record<User['role'], { label: string; variant: any }> = {
  admin: { label: 'Admin', variant: 'red' },
  professional: { label: 'Professionnel', variant: 'gold' },
  member: { label: 'Membre', variant: 'stone' },
};

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await AdminService.listUsers({ limit: 50 });
      setUsers(usersRes.users ?? []);

      console.log(users)
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (userId: string, current: boolean) => {
    if (!profile?.$id) return;

    try {
      await AdminService.setUserActive(profile.$id, userId, !current);

      setUsers(prev =>
        prev.map(u =>
          u.$id === userId ? { ...u, isActive: !current } : u
        )
      );
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const assignRole = async (userId: string, newRole: User['role']) => {
    if (!profile?.$id) return;

    try {
      await AdminService.assignRole(profile.$id, userId, newRole);

      setUsers(prev =>
        prev.map(u =>
          u.$id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error('Failed to assign role', err);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`;
      const matchSearch =
        !search ||
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = role === 'all' || u.role === role;

      return matchSearch && matchRole;
    });
  }, [users, search, role]);

  return (
    <div className="animate-fade-up space-y-6">

      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} comptes enregistrés`}
        actions={
          <Button onClick={() => router.push('/admin/users/new')}>
            Ajouter utilisateur
          </Button>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Rechercher par nom ou email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select
          options={ROLES}
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-48"
        />
      </div>

      <Card padding={false}>
        <Table
          columns={[
            {
              key: 'user',
              label: 'Utilisateur',
              render: (u: User) => (
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('select')) {
                      router.push(`/admin/users/${u.$id}`);
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#F0EDE6] flex items-center justify-center text-xs font-bold text-[#8B7355]">
                    {(u.firstName?.[0] + u.lastName?.[0]).toUpperCase() || 'NA'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F0D0A]">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-[#8B7355]">{u.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'role',
              label: 'Rôle',
              render: (u: User) => (
                <Badge variant={ROLE_MAP[u.role].variant}>
                  {ROLE_MAP[u.role].label}
                </Badge>
              ),
            },
            {
              key: 'status',
              label: 'Statut',
              render: (u: User) => (
                <Badge variant={u.isActive ? 'green' : 'red'}>
                  {u.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              ),
            },
            {
              key: 'date',
              label: 'Inscription',
              render: (u: User) => (
                <span className="text-xs text-[#8B7355]">
                  {new Date(u.$createdAt).toLocaleDateString('fr-FR')}
                </span>
              ),
            },
            {
              key: 'actions',
              label: '',
              render: (u: User) => (
                <div className="flex items-center gap-2">
                  <select
                    onChange={e =>
                      assignRole(u.$id, e.target.value as User['role'])
                    }
                    value={u.role}
                    className="text-xs border border-[#D4C9B8] rounded-lg px-2 h-7 text-[#0F0D0A] bg-white focus:border-[#C4922A] outline-none"
                  >
                    <option value="member">Membre</option>
                    <option value="professional">Professionnel</option>
                    <option value="admin">Admin</option>
                  </select>

                  <Button
                    size="sm"
                    variant={u.isActive ? 'secondary' : 'primary'}
                    onClick={() => toggleActive(u.$id, u.isActive)}
                  >
                    {u.isActive ? 'Suspendre' : 'Activer'}
                  </Button>
                </div>
              ),
            },
          ]}

          data={filtered}
          loading={loading}
          keyFn={(u: User) => u.$id}
          
          // onRow={(u: User, e: React.MouseEvent) => {
          //   const target = e.target as HTMLElement;
          //   if (!target.closest('button') && !target.closest('select')) {
          //     router.push(`/admin/users/${u.$id}`);
          //   }
          // }}
        />

        {!loading && filtered.length === 0 && (
          <Empty title="Aucun utilisateur" />
        )}
      </Card>
    </div>
  );
}