import { create } from 'zustand';

const getStoredTheme = () => {
  try {
    const raw = localStorage.getItem('theme-storage');
    if (!raw) return 'dark';
    const parsed = JSON.parse(raw);
    return parsed.theme || 'dark';
  } catch {
    return 'dark';
  }
};

const storedTheme = getStoredTheme();
document.documentElement.setAttribute('data-theme', storedTheme);

export const useThemeStore = create((set) => ({
  theme: storedTheme,

  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme-storage', JSON.stringify({ theme: next }));
    return { theme: next };
  })
}));
