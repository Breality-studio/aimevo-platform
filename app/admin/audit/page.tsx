'use client';
import { useEffect, useState } from 'react';
import { AdminService } from '../../../services/admin.service';
import { PageHeader, Card, Badge, Table, Empty } from '../../../components/ui';

export default function AdminAuditPage() {
  const [logs, setLogs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ AdminService.listAuditLogs(100).then(r=>{setLogs(r.documents??[]);setLoading(false);}); },[]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Logs d'audit" subtitle="Historique des actions administrateurs"/>
      <Card padding={false}>
        <Table
          columns={[
            {key:'action',label:'Action',render:l=><span className="text-sm font-mono font-medium text-[#C4922A]">{l.action}</span>},
            {key:'admin',label:'Admin',render:l=><span className="text-sm text-[#0F0D0A]">{l.adminId?.slice(0,10)}…</span>},
            {key:'target',label:'Cible',render:l=><span className="text-xs text-[#8B7355]">{l.targetType} · {l.targetId?.slice(0,10)}</span>},
            {key:'ip',label:'IP',render:l=><span className="text-xs font-mono text-[#B5A48A]">{l.ip??'—'}</span>},
            {key:'date',label:'Date',render:l=><span className="text-xs text-[#8B7355]">{new Date(l.$createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>},
          ]}
          data={logs} loading={loading} keyFn={l=>l.$id}/>
        {!loading&&logs.length===0&&<Empty title="Aucun log" icon="◌"/>}
      </Card>
    </div>
  );
}
