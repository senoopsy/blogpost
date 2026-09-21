import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('senoopsy_theme');
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'dark';
};

interface UIState {
  theme: 'dark' | 'light';
  searchQuery: string;
  activeCategory: string;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
}

const initialState: UIState = {
  theme: getInitialTheme(),
  searchQuery: '',
  activeCategory: 'all',
  isMobileMenuOpen: false,
  isSearchOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('senoopsy_theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('senoopsy_theme', action.payload);
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setActiveCategory: (state, action: PayloadAction<string>) => {
      state.activeCategory = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setSearchQuery,
  setActiveCategory,
  toggleMobileMenu,
  closeMobileMenu,
  toggleSearch,
} = uiSlice.actions;

export default uiSlice.reducer;