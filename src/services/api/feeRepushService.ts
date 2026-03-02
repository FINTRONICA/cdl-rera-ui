import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { PaginatedResponse } from '@/types'

// Fee Repush (Real Estate Asset Fee History) types - Updated to match actual API response
export interface FeeRepushRecord {
  id: number
  mffhAmount: number | null
  mffhTotalAmount: number | null
  mffhVatPercentage: number | null
  mffhTransactionDate: string | null
  mffhSuccess: boolean | null
  mffhStatus: boolean | null
  reahfRemark: string | null
  mffhFeeResponse: string | null
  mffhResponseStatus: string | null
  mffhSpecialField1: string | null
  mffhSpecialField2: string | null
  mffhSpecialField3: string | null
  mffhSpecialField4: string | null
  mffhSpecialField5: string | null
  mffhFeeRequestBody: string | null
  realEstateAssestFeeDTO: any | null
  managementFirmDTO: {
    id?: number
    mfId?: string
    mfCif?: string
    mfName?: string
    mfNameLocal?: string
    mfLocation?: string
    mfReraNumber?: string
    mfStartDate?: string
    mfCompletionDate?: string
    mfPercentComplete?: string
    mfConstructionCost?: number
    reaAccStatusDate?: string
    mfRegistrationDate?: string
    mfNoOfUnits?: number
    mfRemarks?: string
    mfSpecialApproval?: string
    mfManagedBy?: string
    mfBackupUser?: string
    mfRetentionPercent?: string
    mfAdditionalRetentionPercent?: string
    mfTotalRetentionPercent?: string
    mfRetentionEffectiveDate?: string
    mfManagementExpenses?: string
    mfMarketingExpenses?: string
    mfAccoutStatusDate?: string
    mfTeamLeadName?: string
    mfRelationshipManagerName?: string
    mfAssestRelshipManagerName?: string
    mfRealEstateBrokerExp?: number
    mfAdvertisementExp?: number
    mfLandOwnerName?: string
    assetRegisterDTO?: any
    mfStatusDTO?: any
    mfTypeDTO?: any
    mfAccountStatusDTO?: any
    mfConstructionCostCurrencyDTO?: any
    status?: any
    mfBlockPaymentTypeDTO?: any
    deleted?: boolean
    taskStatusDTO?: any
  } | null
  deleted: boolean | null
}

export interface FeeRepushFilters {
  managementFirmName?: string
  feeType?: string
  amount?: number
  minAmount?: number
  maxAmount?: number
  transactionDate?: string
  fromDate?: string
  toDate?: string
  approvalStatus?: string
  paymentType?: string
  paymentRefNo?: string
  tasRefNo?: string
  failureReason?: string
  isActive?: boolean
  currency?: string
}

// Fee Repush Request interface
export interface FeeRepushRequest {
  remarks?: string
  forceRepush?: boolean
}

// Fee Repush Response interface (extends the standard record)
export interface FeeRepushResponse extends FeeRepushRecord {
  repushTimestamp?: string
  repushStatus?: 'SUCCESS' | 'FAILED' | 'PENDING'
  repushMessage?: string
}

export interface FeeRepushUIData {
  id: string
  managementFirmName: string
  feeType: string
  amount: string
  transactionDate: string
  approvalStatus: string
  paymentType: string
  paymentRefNo: string
  tasRefNo: string
  narration: string
  description: string
  remark: string
  failureReason: string
  retryCount: string
  createdDate: string
  updatedDate: string
  createdBy: string
  updatedBy: string
  currency: string
  totalAmount: string
  isActive: string
  // Additional fields for expandable content
  feaHistoryId?: string
  specialField1?: string
  specialField2?: string
}

export interface CreateFeeRepushRequest {
  feaHistoryProjectName: string
  feaHistoryFeeType: string
  feaHistoryAmount: number
  feaHistoryTransactionDate: string
  feaHistoryApprovalStatus: string
  feaHistoryPaymentType: string
  feaHistoryNarration?: string
  feaHistoryDescription?: string
  feaHistoryCurrency?: string
}

export interface UpdateFeeRepushRequest {
  feaHistoryProjectName?: string
  feaHistoryFeeType?: string
  feaHistoryAmount?: number
  feaHistoryTransactionDate?: string
  feaHistoryApprovalStatus?: string
  feaHistoryPaymentType?: string
  feaHistoryNarration?: string
  feaHistoryDescription?: string
  feaHistoryCurrency?: string
  feaHistoryFailureReason?: string
  feaHistoryRetryCount?: number
  feaHistoryIsActive?: boolean
}

export const mapFeeRepushToUIData = (
  apiData: FeeRepushRecord
): FeeRepushUIData => {
  const formatAmount = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.00'
    return value.toFixed(2)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  // Determine status based on API response fields
  const getStatus = (): string => {
    if (apiData.mffhResponseStatus) {
      return apiData.mffhResponseStatus
    }
    if (apiData.mffhSuccess === true) {
      return 'SUCCESS'
    }
    if (apiData.mffhSuccess === false) {
      return 'FAILED'
    }
    if (apiData.mffhStatus === true) {
      return 'ACTIVE'
    }
    if (apiData.mffhStatus === false) {
      return 'INACTIVE'
    }
    return 'UNKNOWN'
  }

  // Determine payment type from available data
  const getPaymentType = (): string => {
    // For now, we'll return a default value since payment type isn't in the API response
    // This could be enhanced based on business logic or additional API data
    return 'Bank Transfer'
  }

  return {
    id: String(apiData.id),
    managementFirmName: apiData.managementFirmDTO?.mfName || '—',
    feeType: 'Fee Processing', // Default since feeType not in API response
    amount: apiData.mffhAmount ? formatAmount(apiData.mffhAmount) : '—',
    transactionDate: formatDate(apiData.mffhTransactionDate),
    approvalStatus: getStatus(),
    paymentType: getPaymentType(),
    paymentRefNo: '—', // Not available in current API response
    tasRefNo: '—', // Not available in current API response
    narration: apiData.reahfRemark || '—',
    description: apiData.mffhFeeResponse || '—',
    remark: apiData.reahfRemark || '—',
    failureReason:
      apiData.mffhSuccess === false
        ? apiData.reahfRemark || 'Payment Failed'
        : '—',
    retryCount: '0', // Not available in current API response
    createdDate: formatDateTime(apiData.mffhTransactionDate), // Using transaction date as created date
    updatedDate: formatDateTime(apiData.mffhTransactionDate), // Using transaction date as updated date
    createdBy: '—', // Not available in current API response
    updatedBy: '—', // Not available in current API response
    currency: 'AED', // Default currency
    totalAmount: apiData.mffhTotalAmount
      ? formatAmount(apiData.mffhTotalAmount)
      : '—',
    isActive:
      apiData.mffhStatus !== null ? (apiData.mffhStatus ? 'Yes' : 'No') : '—',
    feaHistoryId: String(apiData.id),
    specialField1: apiData.mffhSpecialField1 || '—',
    specialField2: apiData.mffhSpecialField2 || '—',
  }
}

export class FeeRepushService {
  async createFeeRepush(
    data: Partial<FeeRepushRecord>
  ): Promise<FeeRepushRecord> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS_FEE_HISTORY.SAVE)
      const result = await apiClient.post<FeeRepushRecord>(url, data)
      return result
    } catch (error) {
      throw error
    }
  }

  async updateFeeRepush(
    id: string,
    updates: Partial<FeeRepushRecord>
  ): Promise<FeeRepushRecord> {
    try {
      const url = buildApiUrl(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FEE_HISTORY.UPDATE(id)
      )
      const result = await apiClient.put<FeeRepushRecord>(url, updates)
      return result
    } catch (error) {
      throw error
    }
  }

  async deleteFeeRepush(id: string): Promise<void> {
    try {
      const url = buildApiUrl(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FEE_HISTORY.DELETE(id)
      )
      await apiClient.delete(url)
    } catch (error) {
      throw error
    }
  }

  async getFeeRepushRecords(
    page = 0,
    size = 20,
    filters?: FeeRepushFilters
  ): Promise<PaginatedResponse<FeeRepushRecord>> {
    const apiFilters: Record<string, any> = {}
    if (filters) {
      // Map filters to actual API field names
      if (filters.managementFirmName) {
        // Since project name is nested in managementFirmDTO.mfName, we might need a different approach
        // For now, we'll skip project name filtering until we know the correct API parameter
      }
      if (filters.minAmount !== undefined)
        apiFilters['mffhAmount.greaterThanOrEqual'] = String(filters.minAmount)
      if (filters.maxAmount !== undefined)
        apiFilters['mffhAmount.lessThanOrEqual'] = String(filters.maxAmount)
      if (filters.fromDate)
        apiFilters['mffhTransactionDate.greaterThanOrEqual'] = filters.fromDate
      if (filters.toDate)
        apiFilters['mffhTransactionDate.lessThanOrEqual'] = filters.toDate
      if (filters.isActive !== undefined)
        apiFilters['mffhStatus.equals'] = String(filters.isActive)

      // Add success/failure status filtering
      if (filters.approvalStatus) {
        if (filters.approvalStatus.toLowerCase() === 'success') {
          apiFilters['mffhSuccess.equals'] = 'true'
        } else if (filters.approvalStatus.toLowerCase() === 'failed') {
          apiFilters['mffhSuccess.equals'] = 'false'
        } else if (filters.approvalStatus.toLowerCase() === 'active') {
          apiFilters['mffhStatus.equals'] = 'true'
        } else if (filters.approvalStatus.toLowerCase() === 'inactive') {
          apiFilters['mffhStatus.equals'] = 'false'
        }
      }
    }

    // Add pagination parameters
    apiFilters['page'] = String(page)
    apiFilters['size'] = String(size)

    const queryString = new URLSearchParams(apiFilters).toString()
    const url = `${buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS_FEE_HISTORY.GET_ALL)}?${queryString}`


    try {
      const paginatedResult = await apiClient.get<PaginatedResponse<FeeRepushRecord>>(url)

      // Ensure the response has the expected paginated structure
      if (!paginatedResult || typeof paginatedResult !== 'object') {
        throw new Error('API returned invalid paginated response')
      }

      if (!Array.isArray(paginatedResult.content)) {
        throw new Error('API paginated response content is not an array')
      }

      if (!paginatedResult.page || typeof paginatedResult.page !== 'object') {
        throw new Error('API paginated response missing page information')
      }


      return paginatedResult
    } catch (error) {
      throw error
    }
  }

  async getFeeRepushRecord(id: string): Promise<FeeRepushRecord> {
    try {
      const result = await apiClient.get<FeeRepushRecord>(
        buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS_FEE_HISTORY.GET_BY_ID(id))
      )
      return result
    } catch (error) {
      throw error
    }
  }

  // UI helper to transform API response to UI-friendly format
  transformToUIData(
    apiResponse: PaginatedResponse<FeeRepushRecord>
  ): PaginatedResponse<FeeRepushUIData> {
    return {
      content: apiResponse.content.map((item) => mapFeeRepushToUIData(item)),
      page: apiResponse.page,
    }
  }

  async getFeeRepushUIData(
    page = 0,
    size = 20,
    filters?: FeeRepushFilters
  ): Promise<PaginatedResponse<FeeRepushUIData>> {

    const apiResponse = await this.getFeeRepushRecords(page, size, filters)


    const transformedData = this.transformToUIData(apiResponse)


    return transformedData
  }

  // Retry fee payment functionality (legacy method using UPDATE endpoint)
  async retryFeePayment(id: string): Promise<FeeRepushRecord> {
    try {
      // Update the record to mark as pending retry
      const updatedRecord = await this.updateFeeRepush(id, {
        mffhResponseStatus: 'PENDING_RETRY',
        mffhSuccess: null, // Reset success status
        reahfRemark: 'Payment retry initiated',
      })


      return updatedRecord
    } catch (error) {
      throw error
    }
  }

  // Fee repush functionality using dedicated endpoint
  // Usage examples:
  // - Basic repush: await feeRepushService.feeRepush('123')
  // - With custom remarks: await feeRepushService.feeRepush('123', { remarks: 'Manual retry' })
  // - Force repush: await feeRepushService.feeRepush('123', { forceRepush: true })
  async feeRepush(id: string, request?: FeeRepushRequest): Promise<FeeRepushResponse> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.MANAGEMENT_FIRMS_FEE_HISTORY.FEE_REPUSH(id))
      const requestBody: FeeRepushRequest = {
        remarks: request?.remarks || 'Fee repush initiated via dedicated endpoint',
        forceRepush: request?.forceRepush || false,
        ...request
      }
      const result = await apiClient.put<FeeRepushResponse>(url, requestBody)
      return result
    } catch (error) {
      console.error('Fee repush failed:', error)
      throw error
    }
  }
}

export const feeRepushService = new FeeRepushService()
