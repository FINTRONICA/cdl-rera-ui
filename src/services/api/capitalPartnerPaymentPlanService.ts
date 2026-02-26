import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'

// ---------- Request DTO ----------
export interface CapitalPartnerPaymentPlanRequest {
  ownppInstallmentNumber?: number
  ownppInstallmentDate?: string
  ownppBookingAmount?: number
  ownerRegistryDTO?: {
    id: number
  }
  deleted?: boolean
  enabled?: boolean
}

// ---------- Response DTO ----------
export interface CapitalPartnerPaymentPlanResponse {
  id: number
  ownppInstallmentNumber: number
  ownppInstallmentDate: string
  ownppBookingAmount: number
  ownerRegistryDTO: any
  deleted: boolean
  enabled: boolean
}

// ---------- Service ----------
class CapitalPartnerPaymentPlanService {
  async getCapitalPartnerPaymentPlanById(
    id: number
  ): Promise<CapitalPartnerPaymentPlanResponse> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_PAYMENT_PLAN.GET_BY_ID(id.toString())
    )
    const data = await apiClient.get<CapitalPartnerPaymentPlanResponse>(url)
    return data
  }

  async updateCapitalPartnerPaymentPlan(
    id: number,
    payload: Partial<CapitalPartnerPaymentPlanRequest>
  ): Promise<CapitalPartnerPaymentPlanResponse> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_PAYMENT_PLAN.UPDATE(id.toString())
    )
    const response = await apiClient.put(url, payload)
    return response as CapitalPartnerPaymentPlanResponse
  }

  async deleteCapitalPartnerPaymentPlan(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_PAYMENT_PLAN.DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async softDeleteCapitalPartnerPaymentPlan(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_PAYMENT_PLAN.SOFT_DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async createCapitalPartnerPaymentPlan(
    payload: any
  ): Promise<CapitalPartnerPaymentPlanResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OWNER_REGISTRY_PAYMENT_PLAN.SAVE)
    const response = await apiClient.post(url, payload)
    return response as CapitalPartnerPaymentPlanResponse
  }
}

// Export service instance
export const capitalPartnerPaymentPlanService =
  new CapitalPartnerPaymentPlanService()
export { CapitalPartnerPaymentPlanService }
