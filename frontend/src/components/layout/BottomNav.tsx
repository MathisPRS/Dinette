import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, PlusCircle, Shuffle, User } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/favorites', icon: Heart, label: 'Favorites' },
  { to: '/recipes/new', icon: PlusCircle, label: 'Add' },
  { to: '/suggest', icon: Shuffle, label: 'Suggest' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-2 gap-0.5 min-h-[56px]',
                'transition-colors',
                active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
