import { ReactNode } from 'react';
import { ProSidebar } from '@/components/layout/ProSidebar';

export const metadata = { title: 'Dashboard Pro' };

export default function ProLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FAFAF8]">
      <ProSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}