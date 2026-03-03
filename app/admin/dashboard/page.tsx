'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  CreditCard,
  BarChart3,
  ClipboardCheck,
  PlusCircle,
  FileText,
  Activity,
  Shield
} from 'lucide-react'

import { AdminService } from '@/services/admin.service'
import { StatCard, Card, Badge, PageHeader, Button, Table } from '@/components/ui'
import Link from 'next/link'

export default function AdminDashboard() {

  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await AdminService.getDashboardStats()
        setStats(statsRes)
        setLoadingStats(false)

        const usersRes = await AdminService.listUsers({ limit: 5 })

        console.log(usersRes)

        setUsers(usersRes.users ?? [])
        setLoadingUsers(false)

      } catch (e: any) {
        setError(e.message)
        setLoadingStats(false)
        setLoadingUsers(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="animate-fade-up space-y-6">

      <PageHeader
        title="Tableau de bord"
        subtitle={new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          label="Utilisateurs"
          value={stats?.totalUsers ?? '—'}
          loading={loadingStats}
          icon={<Users size={18} />}
        />

        <StatCard
          label="Abonnements actifs"
          value={stats?.activeSubscriptions ?? '—'}
          loading={loadingStats}
          icon={<Activity size={18} />}
        />

        <StatCard
          label="Revenus (XOF)"
          value={stats?.totalRevenue
            ? `${(stats.totalRevenue / 1000).toFixed(0)}k`
            : '—'}
          loading={loadingStats}
          icon={<CreditCard size={18} />}
        />

        <StatCard
          label="Tests en attente"
          value={stats?.pendingTests ?? '—'}
          loading={loadingStats}
          icon={<ClipboardCheck size={18} />}
        />

      </div>

      {/* TABLE + ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* USERS TABLE */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4C9B8]/60">
              <h2 className="font-display text-lg font-semibold">
                Derniers utilisateurs
              </h2>

              <Link href="/admin/users">
                <Button size="sm" variant="ghost">
                  Voir tout →
                </Button>
              </Link>
            </div>

            <Table
              columns={[
                {
                  key: 'name',
                  label: 'Nom',
                  render: r => (
                    <div>
                      <p className="font-medium text-sm">{r?.firstName + ' ' + r?.lastName || '—'}</p>
                      <p className="text-xs text-[#8B7355]">{r.email}</p>
                    </div>
                  )
                },
                {
                  key: 'role',
                  label: 'Rôle',
                  render: r => (
                    <Badge
                      variant={
                        r.role?.includes('admin')
                          ? 'red'
                          : r.role?.includes('professional')
                            ? 'gold'
                            : 'stone'
                      }
                    >
                      {r.role?.includes('admin')
                        ? 'Admin'
                        : r.role?.includes('professional')
                          ? 'Pro'
                          : 'Membre'}
                    </Badge>
                  )
                },
                {
                  key: 'date',
                  label: 'Inscription',
                  render: r => (
                    <span className="text-xs text-[#8B7355]">
                      {new Date(r.$createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  )
                }
              ]}
              data={users}
              loading={loadingUsers}
              keyFn={r => r.$id}
            />
          </Card>
        </div>

        {/* QUICK LINKS */}
        <Card>
          <h2 className="font-display text-lg font-semibold mb-4">
            Actions rapides
          </h2>

          <div className="space-y-2">

            {[
              { href: '/admin/users', icon: <Users size={16} />, label: 'Gérer les utilisateurs' },
              { href: '/admin/resources/new', icon: <FileText size={16} />, label: 'Ajouter une ressource' },
              { href: '/admin/tests/new', icon: <PlusCircle size={16} />, label: 'Créer un test' },
              { href: '/admin/payments', icon: <CreditCard size={16} />, label: 'Voir les paiements' },
              { href: '/admin/audit', icon: <Shield size={16} />, label: 'Logs d’audit' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F0EDE6] transition-colors group"
              >
                <span className="text-[#C4922A]">{l.icon}</span>
                <span className="text-sm group-hover:text-[#C4922A]">
                  {l.label}
                </span>
                <span className="ml-auto text-[#D4C9B8] text-xs">→</span>
              </Link>
            ))}

          </div>
        </Card>

      </div>
    </div>
  )
}