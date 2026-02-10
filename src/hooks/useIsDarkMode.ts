import { useState, useEffect } from 'react'

/**
 * Returns true when the document has the "dark" class (e.g. from ThemeProvider).
 * Used to match stepper/button styling to DeveloperStepper in dark mode.
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}
