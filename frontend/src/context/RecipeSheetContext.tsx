import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface RecipeSheetContextValue {
  openRecipeId: string | null;
  openSheet: (id: string) => void;
  closeSheet: () => void;
  /** Register a listener called when a recipe is deleted from the sheet */
  onDeleted: (listener: (id: string) => void) => () => void;
  /** Called internally by RecipeSheet after a successful delete */
  notifyDeleted: (id: string) => void;
}

const RecipeSheetContext = createContext<RecipeSheetContextValue | null>(null);

export function RecipeSheetProvider({ children }: { children: ReactNode }) {
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const listenersRef = useRef<Set<(id: string) => void>>(new Set());

  const openSheet = useCallback((id: string) => setOpenRecipeId(id), []);
  const closeSheet = useCallback(() => setOpenRecipeId(null), []);

  const onDeleted = useCallback((listener: (id: string) => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const notifyDeleted = useCallback((id: string) => {
    listenersRef.current.forEach((fn) => fn(id));
  }, []);

  return (
    <RecipeSheetContext.Provider value={{ openRecipeId, openSheet, closeSheet, onDeleted, notifyDeleted }}>
      {children}
    </RecipeSheetContext.Provider>
  );
}

export function useRecipeSheet() {
  const ctx = useContext(RecipeSheetContext);
  if (!ctx) throw new Error('useRecipeSheet must be used inside RecipeSheetProvider');
  return ctx;
}
