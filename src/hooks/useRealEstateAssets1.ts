import { useState, useEffect } from 'react'
import {
  realEstateAssetService,
  type RealEstateAsset,
} from '../services/api/realEstateAssetService1'

interface UseRealEstateAssetsReturn {
  data: RealEstateAsset[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch real estate assets for project dropdown
 */
export const useRealEstateAssets = (): UseRealEstateAssetsReturn => {
  const [data, setData] = useState<RealEstateAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRealEstateAssets = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await realEstateAssetService.findAllRealEstateAssets()

      // Normalize: API may return { content: [...] } or a plain array
      const list = Array.isArray(response)
        ? response
        : (response?.content ?? [])
      setData(list)
    } catch (err) {
      console.error('Error fetching real estate assets:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch real estate assets'
      )
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealEstateAssets()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchRealEstateAssets,
  }
}

/**
 * Transform real estate asset data for dropdown usage
 */
export const transformRealEstateAssetsForDropdown = (
  assets: RealEstateAsset[] | undefined
) => {
  if (!assets || !Array.isArray(assets)) return []
  return assets.map((asset) => {
    const ar = asset.assetRegisterDTO
    return {
      id: asset.id,
      displayName: asset.mfName ?? '',
      settingValue: asset.mfId ?? '',
      projectId: asset.mfId ?? '',
      developerId: ar?.arDeveloperId ?? '',
      developerName: ar?.arName ?? '',
      assetRegisterId: ar?.id != null ? String(ar.id) : '',
      assetRegisterName: ar?.arName ?? '',
      fullAsset: asset,
    }
  })
}
