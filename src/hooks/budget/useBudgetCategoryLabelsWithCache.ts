import { useCallback } from 'react'
import { useLabels, useLabelsLoadingState } from '@/store'
import { BudgetLabelsService } from '@/services/api/budgetApi/budgetCategoryLabelsService'

/**
 * Budget category labels with Zustand cache (mirrors useBuildPartnerLabelsWithCache).
 * Uses budgetLabels from store; labels loaded by compliance loader on app init.
 */
export function useBudgetCategoryLabelsWithCache() {
  const { budgetLabels } = useLabels()
  const { budgetLabelsLoading } = useLabelsLoadingState()

  const getLabel = useCallback(
    (configId: string, language: string, fallback: string) => {
      if (budgetLabels) {
        return BudgetLabelsService.getLabel(budgetLabels, configId, language, fallback)
      }
      return fallback
    },
    [budgetLabels]
  )

  const hasLabels = useCallback(() => {
    return BudgetLabelsService.hasLabels(budgetLabels || {})
  }, [budgetLabels])

  const getAvailableLanguages = useCallback(() => {
    return BudgetLabelsService.getAvailableLanguages(budgetLabels || {})
  }, [budgetLabels])

  return {
    data: budgetLabels,
    isLoading: budgetLabelsLoading,
    error: null,
    isError: false,
    isFetching: budgetLabelsLoading,
    isSuccess: !!budgetLabels,
    refetch: () => Promise.resolve({ data: budgetLabels }),
    getLabel,
    hasLabels,
    getAvailableLanguages,
    hasCache: !!budgetLabels,
    cacheStatus: budgetLabels ? 'cached' : budgetLabelsLoading ? 'Loading...' : 'fresh',
  }
}

/** Alias for budget category page and stepper (same API as useBudgetCategoryLabelsWithCache). */
export const useBudgetLabelsWithCache = useBudgetCategoryLabelsWithCache
