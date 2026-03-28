import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, applyTheme, THEMES } from '@/store/theme';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { HomePage } from '@/pages/Home';
import { RecipeDetailPage } from '@/pages/RecipeDetail';
import { RecipeFormPage } from '@/pages/RecipeForm';
import { FavoritesPage } from '@/pages/Favorites';
import { SuggestPage } from '@/pages/Suggest';
import { ProfilePage } from '@/pages/Profile';
import { GroupsPage } from '@/pages/Groups';
import { GroupDetailPage } from '@/pages/GroupDetail';
import { RecipeSheetProvider } from '@/context/RecipeSheetContext';
import { RecipeSheet } from '@/components/recipe/RecipeSheet';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    applyTheme(themeId);
    // Update browser/PWA theme-color meta tag to match
    const palette = THEMES.find((t) => t.id === themeId);
    if (palette) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', palette.vars['--brand-600']);
    }
  }, [themeId]);

  return (
    <BrowserRouter>
      <RecipeSheetProvider>
        <Routes>
          {/* Public — login/register only */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Everything else requires auth */}
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/recipes/:id" element={<RequireAuth><RecipeDetailPage /></RequireAuth>} />
          <Route path="/recipes/new" element={<RequireAuth><RecipeFormPage mode="create" /></RequireAuth>} />
          <Route path="/recipes/:id/edit" element={<RequireAuth><RecipeFormPage mode="edit" /></RequireAuth>} />
          <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/suggest" element={<RequireAuth><SuggestPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
          <Route path="/groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <RecipeSheet />
      </RecipeSheetProvider>
    </BrowserRouter>
  );
}
