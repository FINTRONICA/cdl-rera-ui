import { useCallback } from 'react'
import { useLabels, useLabelsLoadingState } from '@/store'
import { BudgetLabelsService } from '@/services/api/budgetApi/budgetCategoryLabelsService'

export function useBudgetLabelsWithCache(language: string = 'EN') {
  // Using Zustand store instead of localStorage
  // API remains identical for backward compatibility
  const { budgetLabels } = useLabels()
  const { budgetLabelsLoading } = useLabelsLoadingState()
  
  // Labels are loaded by the compliance loader service on app initialization

  const getLabel = useCallback(
    (configId: string, lang: string = language, fallback: string = configId) => {
      // Using Zustand store data instead of localStorage
      if (budgetLabels) {
        return BudgetLabelsService.getLabel(budgetLabels, configId, lang, fallback)
      }
      return fallback
    },
    [budgetLabels, language]
  )

  const hasLabels = useCallback(() => {
    // Using Zustand store data instead of localStorage
    return BudgetLabelsService.hasLabels(budgetLabels || {})
  }, [budgetLabels])

  const getAvailableLanguages = useCallback(() => {
    // Using Zustand store data instead of localStorage
    return BudgetLabelsService.getAvailableLanguages(budgetLabels || {})
  }, [budgetLabels])

  // Return identical API structure for backward compatibility
  return {
    getLabel,
    hasLabels,
    getAvailableLanguages,
    isLoading: budgetLabelsLoading,
    labels: budgetLabels,
  }
}

