import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'

// ---------- Request DTO ----------
export interface CapitalPartnerUnitPurchaseRequest {
  // cpuPurchaseDate?: string
  // cpupSaleRate?: number
  // cpuPurchasePrice?: number
  // ownupUnitRegistrationFee?: number
  // ownupAgentName?: string
  // ownupAgentId?: string
  // ownupGrossSaleprice?: number
  // ownupVatApplicable?: boolean
  // ownupDeedNo?: string
  // ownupAgreementNo?: string
  // ownupAgreementDate?: string
  // ownupSalePurchaseAgreement?: boolean
  // ownupWorldCheck?: boolean
  // ownupAmtPaidToDevInEscorw?: number
  // ownupAmtPaidToDevOutEscorw?: number
  // ownupTotalAmountPaid?: number
  // cpupUnitIban?: string
  // cpupOqood?: boolean
  // ownupOqoodPaid?: boolean
  // ownupOqoodAmountPaid?: number
  // ownupUnitAreaSize?: number
  // ownupForfeitAmount?: number
  // ownupDldAmount?: number
  // ownupRefundAmount?: number
  // ownupRemarks?: string
  // ownupTransferredAmount?: number
  // cpupUnitNoOtherFormat?: string
  // ownupSalePrice?: number
  // ownupProjectPaymentPlan?: boolean
  // ownupReservationBookingForm?: boolean
  // ownupModificationFeeNeeded?: boolean
  // cpupCreditCurrencyDTO?: any
  // cpuPurchasePriceCurrencyDTO?: any
  // capitalPartnerUnitDTO?: {
  //   id: number
  //   ownerRegistryDTOS?: Array<{ id: number }>
  // }
  // deleted?: boolean
  ownuPurchaseDate?: string
  ownupSaleRate?: number
  ownuPurchasePrice?: number
  ownupUnitRegistrationFee?: number
  ownupAgentName?: string
  ownupAgentId?: string
  ownupGrossSaleprice?: number
  ownupVatApplicable?: boolean
  ownupDeedNo?: string
  ownupAgreementNo?: string
  ownupAgreementDate?: string
  ownupSalePurchaseAgreement?: boolean
  ownupWorldCheck?: boolean
  ownupAmtPaidToDevInEscorw?: number
  ownupAmtPaidToDevOutEscorw?: number
  ownupTotalAmountPaid?: number
  ownupUnitIban?: string
  ownupOqood?: boolean
  ownupOqoodPaid?: boolean
  ownupOqoodAmountPaid?: number
  ownupUnitAreaSize?: number
  ownupForfeitAmount?: number
  ownupDldAmount?: number
  ownupRefundAmount?: number
  ownupRemarks?: string
  ownupTransferredAmount?: number
  ownupUnitNoOtherFormat?: string
  ownupSalePrice?: number
  ownupProjectPaymentPlan?: boolean
  ownupReservationBookingForm?: boolean
  ownupModificationFeeNeeded?: boolean
  ownupCreditCurrencyDTO?: any
  ownuPurchasePriceCurrencyDTO?: any
  ownerRegistryUnitDTO?: {
    id: number
    ownerRegistryDTOS?: Array<{ id: number }>
  }
  deleted?: boolean
}

// ---------- Response DTO ----------
export interface CapitalPartnerUnitPurchaseResponse {
  id: number
  // cpuPurchaseDate?: string
  // cpupSaleRate?: number
  // cpuPurchasePrice?: number
  // ownupUnitRegistrationFee?: number
  // ownupAgentName?: string
  // ownupAgentId?: string
  // ownupGrossSaleprice?: number
  // ownupVatApplicable?: boolean
  // ownupDeedNo?: string
  // ownupAgreementNo?: string
  // ownupAgreementDate?: string
  // ownupSalePurchaseAgreement?: boolean
  // ownupWorldCheck?: boolean
  // ownupAmtPaidToDevInEscorw?: number
  // ownupAmtPaidToDevOutEscorw?: number
  // ownupTotalAmountPaid?: number
  // cpupUnitIban?: string
  // cpupOqood?: boolean
  // ownupOqoodPaid?: boolean
  // ownupOqoodAmountPaid?: number
  // ownupUnitAreaSize?: number
  // ownupForfeitAmount?: number
  // ownupDldAmount?: number
  // ownupRefundAmount?: number
  // ownupRemarks?: string
  // ownupTransferredAmount?: number
  // cpupUnitNoOtherFormat?: string
  // ownupSalePrice?: number
  // ownupProjectPaymentPlan?: boolean
  // ownupReservationBookingForm?: boolean
  // ownupModificationFeeNeeded?: boolean
  // cpupCreditCurrencyDTO?: any
  // cpuPurchasePriceCurrencyDTO?: any
  // capitalPartnerUnitDTO?: {
  //   id: number
  //   ownerRegistryDTOS?: Array<{ id: number }>
  // }
  ownuPurchaseDate?: string
  ownupSaleRate?: number
  ownuPurchasePrice?: number
  ownupUnitRegistrationFee?: number
  ownupAgentName?: string
  ownupAgentId?: string
  ownupGrossSaleprice?: number
  ownupVatApplicable?: boolean
  ownupDeedNo?: string
  ownupAgreementNo?: string
  ownupAgreementDate?: string
  ownupSalePurchaseAgreement?: boolean
  ownupWorldCheck?: boolean
  ownupAmtPaidToDevInEscorw?: number
  ownupAmtPaidToDevOutEscorw?: number
  ownupTotalAmountPaid?: number
  ownupUnitIban?: string
  ownupOqood?: boolean
  ownupOqoodPaid?: boolean
  ownupOqoodAmountPaid?: number
  ownupUnitAreaSize?: number
  ownupForfeitAmount?: number
  ownupDldAmount?: number
  ownupRefundAmount?: number
  ownupRemarks?: string
  ownupTransferredAmount?: number
  ownupUnitNoOtherFormat?: string
  ownupSalePrice?: number
  ownupProjectPaymentPlan?: boolean
  ownupReservationBookingForm?: boolean
  ownupModificationFeeNeeded?: boolean
  ownupCreditCurrencyDTO?: any
  ownuPurchasePriceCurrencyDTO?: any
  ownerRegistryUnitDTO?: {
    id: number
    ownerRegistryDTOS?: Array<{ id: number }>
  }
  deleted: boolean
  createdAt?: string
  updatedAt?: string
}

// ---------- Service ----------
class CapitalPartnerUnitPurchaseService {
  async getCapitalPartnerUnitPurchaseById(
    id: number
  ): Promise<CapitalPartnerUnitPurchaseResponse> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_UNIT_PURCHASE.GET_BY_ID(id.toString())
    )
    const data = await apiClient.get<CapitalPartnerUnitPurchaseResponse>(url)
    return data
  }

  async updateCapitalPartnerUnitPurchase(
    id: number,
    payload: Partial<CapitalPartnerUnitPurchaseRequest>
  ): Promise<CapitalPartnerUnitPurchaseResponse> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_UNIT_PURCHASE.UPDATE(id.toString())
    )
    const response = await apiClient.put(url, payload)
    return response as CapitalPartnerUnitPurchaseResponse
  }

  async deleteCapitalPartnerUnitPurchase(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.OWNER_REGISTRY_UNIT_PURCHASE.DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async createCapitalPartnerUnitPurchase(
    payload: any
  ): Promise<CapitalPartnerUnitPurchaseResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OWNER_REGISTRY_UNIT_PURCHASE.SAVE)
    const response = await apiClient.post(url, payload)
    return response as CapitalPartnerUnitPurchaseResponse
  }
}

// Export service instance
export const capitalPartnerUnitPurchaseService =
  new CapitalPartnerUnitPurchaseService()
export { CapitalPartnerUnitPurchaseService }
