import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'

// ---------- Response DTOs ----------
export interface assetRegisterDTO {
  id: number
  arDeveloperId: string
  arCifrera: string
  arDeveloperRegNo: string
  arName: string
  arMasterName: string
  arNameLocal: string
  arOnboardingDate: string
  arContactAddress: string
  arContactTel: string
  arPoBox: string
  arMobile: string
  arFax: string
  arEmail: string
  arLicenseNo: string
  arLicenseExpDate: string
  arWorldCheckFlag: string
  arWorldCheckRemarks: string
  arMigratedData: boolean
  arremark: string
  arRegulatorDTO: any
  arActiveStatusDTO: any
  beneficiaryIds: number[]
  deleted: boolean | null
  taskStatusDTO: any
}

export interface RealEstateAsset {
  id: number
  mfId: string
  mfCif: string
  mfName: string
  mfNameLocal: string
  mfLocation: string
  mfReraNumber: string
  mfStartDate: string
  mfCompletionDate: string
  mfPercentComplete: string
  mfConstructionCost: number
  reaAccStatusDate: string
  mfRegistrationDate: string
  mfNoOfUnits: number
  mfRemarks: string
  mfSpecialApproval: string
  mfManagedBy: string
  mfBackupUser: string
  mfRetentionPercent: string
  mfAdditionalRetentionPercent: string
  mfTotalRetentionPercent: string
  mfRetentionEffectiveDate: string
  mfManagementExpenses: string
  mfMarketingExpenses: string
  mfAccoutStatusDate: string
  mfTeamLeadName: string
  mfRelationshipManagerName: string
  mfAssestRelshipManagerName: string
  mfRealEstateBrokerExp: number
  mfAdvertisementExp: number
  mfLandOwnerName: string
  assetRegisterDTO: assetRegisterDTO
  mfStatusDTO: any
  mfTypeDTO: any
  mfAccountStatusDTO: any
  mfConstructionCostCurrencyDTO: any
  status: any
  mfBlockPaymentTypeDTO: any
  deleted: boolean
  taskStatusDTO: any
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

// ---------- Service ----------
class RealEstateAssetService {
  async getRealEstateAssetById(id: number): Promise<RealEstateAsset> {
    const url = buildApiUrl(
      API_ENDPOINTS.MANAGEMENT_FIRMS.GET_BY_ID(id.toString())
    )
    const data = await apiClient.get<RealEstateAsset>(url)
    return data
  }

  async updateRealEstateAsset(
    id: number,
    payload: Partial<RealEstateAsset>
  ): Promise<RealEstateAsset> {
    const url = buildApiUrl(
      API_ENDPOINTS.MANAGEMENT_FIRMS.UPDATE(id.toString())
    )
    const response = await apiClient.put(url, payload)
    return response as RealEstateAsset
  }

  async deleteRealEstateAsset(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.MANAGEMENT_FIRMS.SOFT_DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async createRealEstateAsset(payload: any): Promise<RealEstateAsset> {
    const url = buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS.SAVE)
    const response = await apiClient.post(url, payload)
    return response as RealEstateAsset
  }

  async findAllRealEstateAssets(): Promise<RealEstateAssetResponse> {
    const url = buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS.GET_ALL)
    const filteredUrl = `${url}`
    const data = await apiClient.get<RealEstateAssetResponse>(filteredUrl)
    return data
  }

  async getRealEstateAssets(
    page = 0,
    size = 1000
  ): Promise<RealEstateAssetResponse> {
    const url = buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS.GET_ALL)
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    })
    const fullUrl = `${url}&${queryParams.toString()}`
    const data = await apiClient.get<RealEstateAssetResponse>(fullUrl)
    return data
  }
}

// Export service instance
export const realEstateAssetService = new RealEstateAssetService()
export { RealEstateAssetService }
