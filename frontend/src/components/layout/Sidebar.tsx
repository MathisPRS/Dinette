import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, PlusCircle, Shuffle, User, LogIn } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/favorites', icon: Heart, label: 'Favoris' },
  { to: '/recipes/new', icon: PlusCircle, label: 'Ajouter' },
  { to: '/suggest', icon: Shuffle, label: 'Suggestion' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold text-gray-900">Dinette</span>
        </Link>
        <p className="text-xs text-gray-400 mt-0.5 ml-9">Votre carnet de recettes</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-brand-600' : ''}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        {isAuthenticated && user ? (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogIn size={18} />
            Se connecter
          </button>
        )}
      </div>
    </aside>
  );
}
