import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'

// Real Estate Asset Response Types based on the API response
export interface assetRegisterDTO {
  id: number
  arDeveloperId: string
  arCifrera: string
  arDeveloperRegNo: string
  arName: string
  arMasterName: string
  arNameLocal: string | null
  arOnboardingDate: string | null
  arContactAddress: string | null
  arContactTel: string | null
  arPoBox: string | null
  arMobile: string | null
  arFax: string | null
  arEmail: string | null
  arLicenseNo: string | null
  arLicenseExpDate: string | null
  arWorldCheckFlag: string | null
  arWorldCheckRemarks: string | null
  arMigratedData: boolean | null
  arremark: string | null
  arRegulatorDTO: any | null
  arActiveStatusDTO: any | null
  beneficiaryIds: any[]
  deleted: boolean | null
  taskStatusDTO: any | null
}

export interface LanguageTranslationId {
  id: number
  configId: string
  configValue: string
  content: any | null
  status: any | null
  enabled: boolean
  deleted: boolean | null
}

export interface StatusDTO {
  id: number
  settingKey: string
  settingValue: string
  languageTranslationId: LanguageTranslationId
  remarks: any | null
  status: any | null
  enabled: boolean
  deleted: boolean | null
}

export interface RealEstateAsset {
  id: number
  mfId: string
  mfCif: string
  mfName: string
  mfNameLocal: string | null
  mfLocation: string
  mfReraNumber: string
  mfStartDate: string | null
  mfCompletionDate: string | null
  mfPercentComplete: string | null
  mfConstructionCost: number
  reaAccStatusDate: string | null
  mfRegistrationDate: string | null
  mfNoOfUnits: number
  mfRemarks: string | null
  mfSpecialApproval: string | null
  mfManagedBy: string | null
  mfBackupUser: string | null
  mfRetentionPercent: string | null
  mfAdditionalRetentionPercent: string | null
  mfTotalRetentionPercent: string | null
  mfRetentionEffectiveDate: string | null
  mfManagementExpenses: string | null
  mfMarketingExpenses: string | null
  mfAccoutStatusDate: string | null
  mfTeamLeadName: string | null
  mfRelationshipManagerName: string | null
  mfAssestRelshipManagerName: string | null
  mfRealEstateBrokerExp: number
  mfAdvertisementExp: number
  mfLandOwnerName: string | null
  assetRegisterDTO: assetRegisterDTO
  mfStatusDTO: StatusDTO
  mfTypeDTO: StatusDTO
  mfAccountStatusDTO: StatusDTO
  mfConstructionCostCurrencyDTO: StatusDTO
  status: string | null
  mfBlockPaymentTypeDTO: StatusDTO | null
  deleted: boolean | null
  taskStatusDTO: any | null
}

export interface RealEstateAssetResponse {
  content: RealEstateAsset[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export class RealEstateAssetService {
  /**
   * Fetch all real estate assets from the API
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @returns Promise<RealEstateAsset[]>
   */
  async getRealEstateAssets(
    page: number = 0,
    size: number = 20,
    buildPartnerId?: number
  ): Promise<RealEstateAsset[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      })
      
      if (buildPartnerId) {
        params.append('buildPartnerId.equals', buildPartnerId.toString())
      }
      
      const url = buildApiUrl(`/real-estate-assest?${params.toString()}`)
      const result = await apiClient.get<
        RealEstateAssetResponse | RealEstateAsset[]
      >(url)

      // Handle both response formats: direct array or paginated response
      let assets: RealEstateAsset[] = []

      if (Array.isArray(result)) {
        // Direct array response (as shown in your example)
        assets = result
      } else if (result && typeof result === 'object' && 'content' in result) {
        // Paginated response
        assets = result.content || []
      } else {
        assets = []
      }

      return assets
    } catch (error) {
      console.error(
        ' RealEstateAssetService.getRealEstateAssets Failed:',
        error
      )
      throw error
    }
  }

  /**
   * Find real estate asset by name
   * @param name - Asset name to search for
   * @returns RealEstateAsset | undefined
   */
  async findAssetByName(name: string): Promise<RealEstateAsset | undefined> {
    try {
      const assets = await this.getRealEstateAssets(0, 100) // Get more assets for search
      return assets.find((asset) => asset.mfName === name)
    } catch (error) {
      console.error('RealEstateAssetService.findAssetByName Failed:', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
      return undefined
    }
  }

  /**
   * Find real estate asset by ID
   * @param assetId - Asset ID to search for
   * @returns RealEstateAsset | undefined
   */
  async findAssetById(assetId: string): Promise<RealEstateAsset | undefined> {
    try {
      const assets = await this.getRealEstateAssets(0, 100) // Get more assets for search
      return assets.find((asset) => asset.mfId === assetId)
    } catch (error) {
      console.error('RealEstateAssetService.findAssetById Failed:', {
        assetId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
      return undefined
    }
  }

  /**
   * Delete a real estate asset
   * @param assetId - Asset ID to delete
   * @returns Promise<void>
   */
  async deleteRealEstateAsset(assetId: string): Promise<void> {
    try {
      const url = buildApiUrl(`/real-estate-assest/${assetId}`)
      await apiClient.delete(url)

     
    } catch (error) {
      console.error('RealEstateAssetService.deleteRealEstateAsset Failed:', {
        assetId,
        error: error instanceof Error ? error.message : 'Unknown error',

        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Search real estate assets by name with pagination
   * Used for autocomplete functionality
   */
  async searchRealEstateAssets(
    query: string,
    page = 0,
    size = 20
  ): Promise<RealEstateAsset[]> {
    try {
      if (!query || query.trim().length === 0) {
        return []
      }

      const params = new URLSearchParams({
        'mfName.contains': query.trim(),
        'page': page.toString(),
        'size': size.toString(),
        'deleted.equals': 'false',
        'enabled.equals': 'true',
      })

      const url = buildApiUrl(`/real-estate-assest?${params.toString()}`)
      const response = await apiClient.get(url)
      
      // Handle both single object and paginated response formats
      let assets: RealEstateAsset[] = []
      
      if (Array.isArray(response)) {
        // Direct array response
        assets = response
      } else if (response && typeof response === 'object') {
        if ('content' in response && Array.isArray(response.content)) {
          // Paginated response format
          assets = response.content
        } else if ('id' in response || 'mfName' in response) {
          // Single object response - wrap in array
          assets = [response as RealEstateAsset]
        }
      }
      
      return assets
    } catch (error) {
      console.error('Error searching real estate assets:', error)
      throw new Error('Failed to search real estate assets')
    }
  }
}

// Create service instance
export const realEstateAssetService = new RealEstateAssetService()
