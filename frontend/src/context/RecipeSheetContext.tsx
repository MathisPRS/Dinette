import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface RecipeSheetContextValue {
  openRecipeId: string | null;
  openSheet: (id: string) => void;
  closeSheet: () => void;
}

const RecipeSheetContext = createContext<RecipeSheetContextValue | null>(null);

export function RecipeSheetProvider({ children }: { children: ReactNode }) {
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const openSheet = useCallback((id: string) => setOpenRecipeId(id), []);
  const closeSheet = useCallback(() => setOpenRecipeId(null), []);

  return (
    <RecipeSheetContext.Provider value={{ openRecipeId, openSheet, closeSheet }}>
      {children}
    </RecipeSheetContext.Provider>
  );
}

export function useRecipeSheet() {
  const ctx = useContext(RecipeSheetContext);
  if (!ctx) throw new Error('useRecipeSheet must be used inside RecipeSheetProvider');
  return ctx;
}
