import { useMemo } from 'react'
import { CapitalPartnerLabelsService } from '@/services/api/capitalPartnerLabelsService'
import { useAppStore } from '@/store'

/**
 * Hook that reads from Zustand store (labels are pre-loaded by ComplianceProvider)
 * No API calls are made here to avoid duplicate requests
 */
export function useCapitalPartnerLabels() {
  const ownerRegistryLabels = useAppStore((state) => state.ownerRegistryLabels)
  const ownerRegistryLabelsLoading = useAppStore((state) => state.ownerRegistryLabelsLoading)
  const ownerRegistryLabelsError = useAppStore((state) => state.ownerRegistryLabelsError)

  return useMemo(
    () => ({
      data: ownerRegistryLabels,
      isLoading: ownerRegistryLabelsLoading,
      error: ownerRegistryLabelsError ? new Error(ownerRegistryLabelsError) : null,
      isError: !!ownerRegistryLabelsError,
      isSuccess: !ownerRegistryLabelsLoading && !!ownerRegistryLabels,
    }),
    [ownerRegistryLabels, ownerRegistryLabelsLoading, ownerRegistryLabelsError]
  )
}

/**
 * Hook with utility methods for capital partner labels
 */
export function useCapitalPartnerLabelsWithUtils() {
  const query = useCapitalPartnerLabels()
  
  return {
    ...query,
    // Utility methods
    hasLabels: () => CapitalPartnerLabelsService.hasLabels(query.data || {}),
    getLabel: (configId: string, language: string, fallback: string) => 
      CapitalPartnerLabelsService.getLabel(query.data || {}, configId, language, fallback),
    getAvailableLanguages: () => 
      CapitalPartnerLabelsService.getAvailableLanguages(query.data || {}),
  }
}
