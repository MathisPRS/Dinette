import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { HomePage } from '@/pages/Home';
import { RecipeDetailPage } from '@/pages/RecipeDetail';
import { RecipeFormPage } from '@/pages/RecipeForm';
import { FavoritesPage } from '@/pages/Favorites';
import { SuggestPage } from '@/pages/Suggest';
import { ProfilePage } from '@/pages/Profile';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Semi-public (viewable without auth, but auth optional) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/suggest" element={<SuggestPage />} />

        {/* Protected */}
        <Route
          path="/recipes/new"
          element={
            <RequireAuth>
              <RecipeFormPage mode="create" />
            </RequireAuth>
          }
        />
        <Route
          path="/recipes/:id/edit"
          element={
            <RequireAuth>
              <RecipeFormPage mode="edit" />
            </RequireAuth>
          }
        />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <FavoritesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
