import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content — offset by sidebar width on desktop */}
      <main className="lg:ml-60">
        <div className="max-w-5xl mx-auto pb-20 lg:pb-8 lg:px-6 lg:pt-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </div>
  );
}
