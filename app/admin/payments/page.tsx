'use client';
import { useEffect, useState } from 'react';
import { AdminService } from '../../../services/admin.service';
import { PageHeader, Card, Badge, Table, Button, Empty } from '../../../components/ui';

const STATUS_BADGE: Record<string,any> = { success:'green', failed:'red', pending:'orange', refunded:'blue' };

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(()=>{ AdminService.listPayments(100).then(r=>{setPayments(r.documents??[]);setLoading(false);}); },[]);

  async function refund(id:string) {
    if (!confirm('Confirmer le remboursement ?')) return;
    await AdminService.refundPayment(id,'Remboursement admin');
    setPayments(prev=>prev.map(p=>p.$id===id?{...p,status:'refunded'}:p));
  }

  const total = payments.filter(p=>p.status==='success').reduce((s,p)=>s+p.amount,0);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Paiements" subtitle={`Total encaissé : ${total.toLocaleString('fr-FR')} XOF`}/>
      <Card padding={false}>
        <Table
          columns={[
            {key:'user',label:'Utilisateur',render:p=><span className="text-sm font-medium">{p.userId?.slice(0,10)}…</span>},
            {key:'amount',label:'Montant',render:p=><span className="text-sm font-semibold text-[#0F0D0A]">{p.amount?.toLocaleString('fr-FR')} XOF</span>},
            {key:'method',label:'Méthode',render:p=><span className="text-sm text-[#8B7355] capitalize">{p.method?.replace('_',' ')}</span>},
            {key:'status',label:'Statut',render:p=><Badge variant={STATUS_BADGE[p.status]??'stone'}>{p.status}</Badge>},
            {key:'date',label:'Date',render:p=><span className="text-xs text-[#8B7355]">{new Date(p.$createdAt).toLocaleDateString('fr-FR')}</span>},
            {key:'actions',label:'',render:p=>(
              p.status==='success'
                ? <Button size="sm" variant="ghost" onClick={e=>{e.stopPropagation();refund(p.$id);}}>Rembourser</Button>
                : null
            )},
          ]}
          data={payments} loading={loading} keyFn={p=>p.$id}/>
        {!loading&&payments.length===0&&<Empty title="Aucun paiement" icon="◆"/>}
      </Card>
    </div>
  );
}
