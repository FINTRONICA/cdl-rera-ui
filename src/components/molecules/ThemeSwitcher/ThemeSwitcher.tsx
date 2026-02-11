'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Debug logging
  // React.useEffect(() => {
  //   console.log('🎨 [ThemeSwitcher] Component rendered with:', {
  //     theme,
  //     resolvedTheme,
  //     htmlClassList: document.documentElement.classList.toString(),
  //     bodyBg: window.getComputedStyle(document.body).backgroundColor,
  //   })
  // }, [theme, resolvedTheme])

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const currentResolved = resolvedTheme
    const newTheme = currentResolved === 'dark' ? 'light' : 'dark'

    try {
      setTheme(newTheme)

      if (typeof window !== 'undefined') {
        const root = document.documentElement

        // Remove both classes first to ensure clean state
        root.classList.remove('dark', 'light')

        // Add the new theme class
        if (newTheme === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.add('light')
        }

        // Force a reflow to ensure styles are applied
        void root.offsetHeight
      }
    } catch (error) {
      console.error(' [ThemeSwitcher] Error toggling theme:', error)
    }
  }

  const getThemeLabel = () => {
    return resolvedTheme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative z-10 p-2 transition-colors rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label={`Current theme: ${getThemeLabel()}. Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Theme: ${getThemeLabel()}. Click to switch`}
      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="w-5 h-5 text-gray-700 pointer-events-none dark:text-gray-300" />
      ) : (
        <Sun className="w-5 h-5 text-gray-700 pointer-events-none dark:text-gray-300" />
      )}
    </button>
  )
}
