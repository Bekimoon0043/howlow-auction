import { create } from 'zustand'

interface ThemeState {
  dark: boolean
  init: () => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: false,
  init: () => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved ? saved === 'dark' : prefersDark
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    set({ dark })
  },
  toggle: () => {
    const next = !get().dark
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', next ? 'dark' : 'light')
    set({ dark: next })
  }
}))
