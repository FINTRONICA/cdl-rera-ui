import { useCallback } from 'react'
import { useLabels, useLabelsLoadingState } from '@/store'
import { BudgetManagementFirmLabelsService } from '@/services/api/budgetApi/budgetManagementFirmLabelsService'
import { BudgetLabelsService } from '@/services/api/budgetApi/budgetCategoryLabelsService'

/**
 * Budget management firm labels with Zustand cache (mirrors useBuildPartnerLabelsWithCache).
 * Uses budgetLabels from store; labels loaded by compliance loader on app init.
 */
export function useBudgetManagementLabelsWithCache() {
  const { budgetManagementFirmLabels } = useLabels()
  const { budgetManagementFirmLabelsLoading } = useLabelsLoadingState()

  const getLabel = useCallback(
    (configId: string, language: string, fallback: string) => {
      if (budgetManagementFirmLabels) {
        return BudgetManagementFirmLabelsService.getLabel(budgetManagementFirmLabels, configId, language, fallback)
      }
      return fallback
    },
    [budgetManagementFirmLabels]
  )

  const hasLabels = useCallback(() => {
    return BudgetManagementFirmLabelsService.hasLabels(budgetManagementFirmLabels || {})
  }, [budgetManagementFirmLabels])

  const getAvailableLanguages = useCallback(() => {
    return BudgetLabelsService.getAvailableLanguages(budgetManagementFirmLabels || {})
  }, [budgetManagementFirmLabels])

  return {
    data: budgetManagementFirmLabels,
    isLoading: budgetManagementFirmLabelsLoading,
    error: null,
    isError: false,
    isFetching: budgetManagementFirmLabelsLoading,
    isSuccess: !!budgetManagementFirmLabels,
    refetch: () => Promise.resolve({ data: budgetManagementFirmLabels }),
    getLabel,
    hasLabels,
    getAvailableLanguages,
    hasCache: !!budgetManagementFirmLabels,
    cacheStatus: budgetManagementFirmLabels ? 'cached' : budgetManagementFirmLabelsLoading ? 'Loading...' : 'fresh',
  }
}
