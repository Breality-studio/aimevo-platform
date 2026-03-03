
import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const metadata = { title: 'Dashboard Admin' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FAFAF8]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
