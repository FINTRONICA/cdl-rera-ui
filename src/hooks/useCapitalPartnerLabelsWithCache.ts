import { useCallback } from 'react'
import { useLabels, useLabelsLoadingState } from '@/store'
import { CapitalPartnerLabelsService } from '@/services/api/capitalPartnerLabelsService'

export function useCapitalPartnerLabelsWithCache() {
  // 🏦 BANKING COMPLIANCE: Now using Zustand store instead of localStorage
  // API remains identical for backward compatibility
  const { ownerRegistryLabels } = useLabels()
  const { ownerRegistryLabelsLoading } = useLabelsLoadingState()

  const getLabel = useCallback(
    (configId: string, language: string, fallback: string) => {
      if (ownerRegistryLabels) {
        return CapitalPartnerLabelsService.getLabel(ownerRegistryLabels, configId, language, fallback)
      }
      return fallback
    },
    [ownerRegistryLabels]
  )

  const hasLabels = useCallback(() => {
    return CapitalPartnerLabelsService.hasLabels(ownerRegistryLabels || {})
  }, [ownerRegistryLabels])

  const getAvailableLanguages = useCallback(() => {
    return CapitalPartnerLabelsService.getAvailableLanguages(ownerRegistryLabels || {})
  }, [ownerRegistryLabels])

  return {
    data: ownerRegistryLabels,
    isLoading: ownerRegistryLabelsLoading,
    error: null,
    isError: false,
    isFetching: ownerRegistryLabelsLoading,
    isSuccess: !!ownerRegistryLabels,
    refetch: () => Promise.resolve({ data: ownerRegistryLabels }),
    getLabel,
    hasLabels,
    getAvailableLanguages,
    hasCache: !!ownerRegistryLabels,
    cacheStatus: ownerRegistryLabels ? 'cached' : ownerRegistryLabelsLoading ? 'Loading...' : 'fresh',
  }
}
