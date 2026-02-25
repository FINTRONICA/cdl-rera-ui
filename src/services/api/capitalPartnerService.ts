import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { PaginatedResponse } from '@/types'
import { mapCapitalPartnerToInvestorData } from '@/constants/mappings/capitalPartnerMapper'

// Task Status DTO interface
export interface TaskStatusDTO {
  id: number
  code: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  deleted: boolean
  enabled: boolean
}

// ---------- Request DTO ----------
export interface CapitalPartnerRequest {
  capitalPartnerId?: string
  capitalPartnerName?: string
  capitalPartnerMiddleName?: string
  capitalPartnerLastName?: string
  capitalPartnerOwnershipPercentage?: number
  capitalPartnerIdNo?: string
  capitalPartnerTelephoneNo?: string
  capitalPartnerMobileNo?: string
  capitalPartnerEmail?: string
  capitalPartnerOwnerNumber?: number
  isCurrent?: boolean
  idExpiaryDate?: string
  documentTypeDTO?: OptionDTO
  countryOptionDTO?: OptionDTO
  ownerTypeDTO?: OptionDTO
  ownerRegistryTypeDTO?: OptionDTO
  capitalPartnerBankInfoDTOS?: any[]
  ownerRegistryUnitDTO?: any
  ownerRegistryId?: string
  ownerRegistryName?: string
  ownerRegistryMiddleName?: string
  ownerRegistryLastName?: string
  ownerRegistryOwnershipPercentage?: number
  ownerRegistryIdNo?: string
  ownerRegistryTelephoneNo?: string
  ownerRegistryMobileNo?: string
  ownerRegistryEmail?: string
  ownerRegistryOwnerNumber?: number
  ownerRegistryLocaleName?: string
  ownerRegistryBankInfoDTOS?: any[]
  deleted?: boolean
  taskStatusDTO?: TaskStatusDTO | null
}

export interface OptionDTO {
  id: number
  enabled?: boolean
}

// ---------- Response DTO ----------
export interface CapitalPartnerResponse {
  id: number
  capitalPartnerId?: string
  capitalPartnerName?: string
  capitalPartnerMiddleName?: string
  capitalPartnerLastName?: string
  capitalPartnerOwnershipPercentage?: number
  capitalPartnerIdNo?: string
  capitalPartnerTelephoneNo?: string
  capitalPartnerMobileNo?: string
  capitalPartnerEmail?: string
  capitalPartnerOwnerNumber?: number
  isCurrent?: boolean
  idExpiaryDate?: string
  ownerRegistryId?: string
  ownerRegistryName?: string
  ownerRegistryMiddleName?: string
  ownerRegistryLastName?: string
  ownerRegistryOwnershipPercentage?: number
  ownerRegistryIdNo?: string
  ownerRegistryTelephoneNo?: string
  ownerRegistryMobileNo?: string
  ownerRegistryEmail?: string
  ownerRegistryOwnerNumber?: number
  ownerRegistryLocaleName?: string
  ownerRegistryUnitDTO?: any
  documentTypeDTO?: OptionDTO
  countryOptionDTO?: OptionDTO
  ownerRegistryTypeDTO?: OptionDTO
  ownerTypeDTO?: OptionDTO
  taskStatusDTO?: TaskStatusDTO | null
}

// ---------- UI Model (Owner Registry) ----------
export interface OwnerRegistryUIData extends Record<string, unknown> {
  id: number
  owner: string
  ownerId: string
  assetRegisterName: string
  assetRegisterId: string
  assetRegisterCif: string
  managementFirmName: string
  managementFirmCif: string
  unitNumber: string
  approvalStatus: string
}

/** @deprecated Use OwnerRegistryUIData */
export type CapitalPartnerUIData = OwnerRegistryUIData

// ---------- Service ----------
class CapitalPartnerService {
  static async getCapitalPartners(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<OwnerRegistryUIData>> {
    try {
      const baseUrl = buildApiUrl(API_ENDPOINTS.OWNER_REGISTRY.GET_ALL)
      const url = `${baseUrl}&page=${page}&size=${size}`

      const data =
        await apiClient.get<PaginatedResponse<CapitalPartnerResponse>>(url)

      // Handle different response formats
      if ((data as any).content && Array.isArray((data as any).content)) {
        // Spring Boot style pagination response
        const content = (data as any).content.map(
          mapCapitalPartnerToInvestorData
        )
        const pageInfo = (data as any).page || {}

        const result = {
          content,
          page: {
            size: pageInfo.size || size,
            number: pageInfo.number || page,
            totalElements: pageInfo.totalElements || content.length,
            totalPages:
              pageInfo.totalPages ||
              Math.ceil((pageInfo.totalElements || content.length) / size),
          },
        }

        return result
      } else if (Array.isArray(data)) {
        // Simple array response (fallback)
        const mappedData = (data as any).map(mapCapitalPartnerToInvestorData)
        return {
          content: mappedData,
          page: {
            size: mappedData.length,
            number: 0,
            totalElements: mappedData.length,
            totalPages: 1,
          },
        }
      }

      // Empty response
      return {
        content: [],
        page: {
          size: size,
          number: page,
          totalElements: 0,
          totalPages: 0,
        },
      }
    } catch (error) {
      console.error('Error in getCapitalPartners service:', error)
      throw error
    }
  }

  async getCapitalPartnerById(id: number): Promise<CapitalPartnerResponse> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY.GET_BY_ID(id.toString())
    )
    const data = await apiClient.get<CapitalPartnerResponse>(url)
    return data
  }

  async updateCapitalPartner(
    id: number,
    payload: Partial<CapitalPartnerRequest>
  ): Promise<CapitalPartnerResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OWNER_REGISTRY.UPDATE(id.toString()))
    const response = await apiClient.put(url, payload)
    return response as CapitalPartnerResponse
  }

  static async deleteCapitalPartner(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY.SOFT_DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async createCapitalPartner(payload: any): Promise<CapitalPartnerResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OWNER_REGISTRY.SAVE)
    const response = await apiClient.post(url, payload)
    return response as CapitalPartnerResponse
  }
}

// Export service instance
export const capitalPartnerService = new CapitalPartnerService()
export { CapitalPartnerService }
