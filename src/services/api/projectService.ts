import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { PaginatedResponse } from '@/types'

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

// Real Estate Asset types matching the actual API response structure
export interface assetRegisterDTO {
  id: number
  arDeveloperId: string
  arCifrera: string
  arDeveloperRegNo: string
  arName: string
  arMasterName: string
  arNameLocal?: string
  arOnboardingDate?: string
  arContactAddress?: string
  arContactTel?: string
  arPoBox?: string
  arMobile?: string
  arFax?: string
  arEmail?: string
  arLicenseNo?: string
  arLicenseExpDate?: string
  arWorldCheckFlag?: string
  arWorldCheckRemarks?: string
  arMigratedData?: string
  arremark?: string
  arRegulatorDTO?: any
  arActiveStatusDTO?: any
}

export interface StatusDTO {
  id: number
  settingKey: string
  settingValue: string
  languageTranslationId: {
    id: number
    configId: string
    configValue: string
    content?: string
    status?: string
    enabled: boolean
  }
  remarks?: string
  status?: string
  enabled: boolean
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
  mfRemarks?: string
  mfSpecialApproval?: string
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
  assetRegisterDTO?: assetRegisterDTO | null
  mfStatusDTO?: StatusDTO | null
  mfTypeDTO: StatusDTO
  mfAccountStatusDTO: StatusDTO
  mfConstructionCostCurrencyDTO: StatusDTO
  status: string
  taskStatusDTO: TaskStatusDTO | null
}

// For backward compatibility with existing UI (management-firms table uses managementFirmId/Name)
export interface ProjectData extends Record<string, unknown> {
  id: number
  name: string
  developerId: string
  managementFirmId: string
  managementFirmCif: string
  developerName: string
  managementFirmName: string
  projectStatus: string
  approvalStatus: string
  location: string
  reraNumber: string
  startDate: string
  completionDate: string
  percentComplete: string
  constructionCost: number
  currency: string
  totalUnits: number
  remarks?: string
}

export interface CreateRealEstateAssetRequest {
  mfId?: string
  mfCif?: string
  mfName: string
  mfLocation: string
  mfReraNumber: string
  mfAccoutStatusDate?: string
  mfRegistrationDate?: string
  mfStartDate: string
  mfCompletionDate: string
  mfPercentComplete?: string
  mfConstructionCost: number
  reaAccStatusDate?: string
  mfNoOfUnits: number
  mfRemarks?: string
  mfSpecialApproval?: string
  mfManagedBy: string
  mfBackupUser: string
  mfRetentionPercent?: string
  mfAdditionalRetentionPercent?: string
  mfTotalRetentionPercent?: string
  mfRetentionEffectiveDate?: string
  mfManagementExpenses?: string
  mfMarketingExpenses?: string
  mfTeamLeadName: string
  mfRelationshipManagerName: string
  mfAssestRelshipManagerName: string
  mfRealEstateBrokerExp?: number
  mfAdvertisementExp?: number
  mfLandOwnerName: string
  assetRegisterDTO: {
    id: number
  }
  mfStatusDTO: {
    id: number
  }
  mfTypeDTO: {
    id: number
  }
  mfAccountStatusDTO: {
    id: number
  }
  mfConstructionCostCurrencyDTO: {
    id: number
  }
  status?: string
  mfBlockPaymentTypeDTO?: any
}

export interface UpdateRealEstateAssetRequest
  extends Partial<CreateRealEstateAssetRequest> {
  id: number
}

export interface RealEstateAssetFilters {
  search?: string
  status?: string
  type?: string
  location?: string
  developerId?: string
}

export interface RealEstateAssetStats {
  total: number
  active: number
  closed: number
  frozen: number
  approved: number
  inReview: number
  rejected: number
  incomplete: number
}

// Real Estate Asset Service
export class RealEstateAssetService {
  private static instance: RealEstateAssetService

  private constructor() {}

  static getInstance(): RealEstateAssetService {
    if (!RealEstateAssetService.instance) {
      RealEstateAssetService.instance = new RealEstateAssetService()
    }
    return RealEstateAssetService.instance
  }

  // Get projects (management firms) with filtering and pagination
  async getProjects(
    page: number = 0,
    size: number = 20,
    filters?: RealEstateAssetFilters
  ): Promise<PaginatedResponse<RealEstateAsset>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...Object.fromEntries(
        Object.entries(filters || {}).filter(
          ([_, value]) => value !== undefined
        )
      ),
    })

    const response = await apiClient.get<
      | PaginatedResponse<RealEstateAsset>
      | RealEstateAsset[]
      | { content: RealEstateAsset[]; totalElements?: number; totalPages?: number }
    >(`${API_ENDPOINTS.MANAGEMENT_FIRMS.GET_ALL}&${params.toString()}`)

    if (Array.isArray(response)) {
      return {
        content: response,
        page: {
          size,
          number: page,
          totalElements: response.length,
          totalPages: Math.max(1, Math.ceil(response.length / size)),
        },
      }
    }
    const raw = response as Record<string, unknown>
    const content = (raw.content as RealEstateAsset[]) ?? []
    const totalElements = (raw.totalElements as number) ?? content.length
    const totalPages = (raw.totalPages as number) ?? Math.max(1, Math.ceil(totalElements / size))
    if (!raw.page && (raw.totalElements != null || content.length > 0)) {
      return {
        content,
        page: {
          size,
          number: page,
          totalElements,
          totalPages,
        },
      }
    }
    return response as PaginatedResponse<RealEstateAsset>
  }

  // Get single management firm by ID
  async getProject(id: number): Promise<RealEstateAsset> {
    const response = await apiClient.get<
      RealEstateAsset | { data?: RealEstateAsset; content?: RealEstateAsset }
    >(API_ENDPOINTS.MANAGEMENT_FIRMS.GET_BY_ID(id.toString()))
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const raw = response as Record<string, unknown>
      const entity = (raw.data ?? raw.content) as RealEstateAsset | undefined
      if (entity) return entity
    }
    return response as RealEstateAsset
  }

  // Create new project
  async createProject(
    data: CreateRealEstateAssetRequest
  ): Promise<RealEstateAsset> {
    try {
      const response = await apiClient.post<RealEstateAsset>(
        API_ENDPOINTS.MANAGEMENT_FIRMS.SAVE,
        data
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Update existing project
  async updateProject(
    id: number,
    data: UpdateRealEstateAssetRequest
  ): Promise<RealEstateAsset> {
    return apiClient.put<RealEstateAsset>(
      API_ENDPOINTS.MANAGEMENT_FIRMS.UPDATE(id.toString()),
      data
    )
  }

  // Update project details (Step 1)
  async updateProjectDetails(projectId: string, data: any): Promise<any> {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.MANAGEMENT_FIRMS.UPDATE(projectId),
        data
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Update project accounts (Step 3)
  async updateProjectAccounts(
    _projectId: string,
    accounts: any[]
  ): Promise<any> {
    try {
      // For now, we'll update each account individually
      // In the future, this could be a batch update endpoint
      const results = []
      for (const account of accounts) {
        if (account.id) {
          const response = await apiClient.put(
            API_ENDPOINTS.MANAGEMENT_FIRMS_BANK_ACCOUNT.UPDATE(account.id),
            account
          )
          results.push(response)
        }
      }

      return results
    } catch (error) {
      throw error
    }
  }

  // Update project fees (Step 4)
  async updateProjectFees(_projectId: string, fees: any[]): Promise<any> {
    try {
      const results = []
      for (const fee of fees) {
        if (fee.id) {
          const response = await apiClient.put(
            `${API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.UPDATE(fee.id)}`,
            fee
          )
          results.push(response)
        }
      }

      return results
    } catch (error) {
      throw error
    }
  }

  // Update project beneficiaries (Step 5)
  async updateProjectBeneficiaries(
    _projectId: string,
    beneficiaries: any[]
  ): Promise<any> {
    try {
      const results = []
      for (const beneficiary of beneficiaries) {
        if (beneficiary.id) {
          const response = await apiClient.put(
            `${API_ENDPOINTS.MANAGEMENT_FIRMS_BENEFICIARY.UPDATE(beneficiary.id)}`,
            beneficiary
          )
          results.push(response)
        }
      }

      return results
    } catch (error) {
      throw error
    }
  }

  // Update project payment plans (Step 5)
  async updateProjectPaymentPlans(
    _projectId: string,
    paymentPlans: any[]
  ): Promise<any> {
    try {
      const results = []
      for (const plan of paymentPlans) {
        if (plan.id) {
          const response = await apiClient.put(
            `${API_ENDPOINTS.MANAGEMENT_FIRMS_PAYMENT_PLAN.UPDATE(plan.id)}`,
            plan
          )
          results.push(response)
        }
      }

      return results
    } catch (error) {
      throw error
    }
  }

  // Update project financial data (Step 6)
  async updateProjectFinancialData(
    projectId: string,
    financialData: any
  ): Promise<any> {
    try {
      if (financialData.id) {
        const response = await apiClient.put(
          `${API_ENDPOINTS.MANAGEMENT_FIRMS_FINANCIAL_SUMMARY.UPDATE(financialData.id)}`,
          financialData
        )

        return response
      } else {
        // If no ID, create new financial summary
        return this.saveProjectFinancialSummary(financialData, projectId)
      }
    } catch (error) {
      throw error
    }
  }

  // Update project closure (Step 7)
  async updateProjectClosure(
    closureId: number,
    closureData: any,
    projectId: number
  ): Promise<any> {
    try {
      // Parse values and convert to numbers
      const parseValue = (value: string | number): number => {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
          const parsed = parseFloat(value.replace(/,/g, ''))
          return isNaN(parsed) ? 0 : parsed
        }
        return 0
      }

      // Transform closure data to API payload keys (mfc* keys only)
      const transformedData = {
        id: closureId,
        mfcTotalIncomeFund: parseValue(
          closureData.totalIncomeFund ?? 0
        ),
        mfcTotalPayment: parseValue(
          closureData.totalPayment ?? 0
        ),
        managementFirmDTO: {
          id: projectId,
        },
        deleted: false,
        enabled: true,
      }

      const response = await apiClient.put(
        `${API_ENDPOINTS.MANAGEMENT_FIRMS_CLOSURE.UPDATE(closureId.toString())}`,
        transformedData
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Delete project
  async deleteProject(id: number): Promise<void> {
    try {
      await apiClient.delete<string>(
        API_ENDPOINTS.MANAGEMENT_FIRMS.SOFT_DELETE(id.toString())
      )
    } catch (error) {
      throw error
    }
  }

  // Save project fee
  async saveProjectFee(feeData: any): Promise<any> {
    try {
      // const url = API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.SAVE
      const response = await apiClient.post(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.SAVE,
        feeData
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Update project fee
  async updateProjectFee(id: string, feeData: any): Promise<any> {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.UPDATE(id),
        feeData
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Save project financial summary
  async saveProjectFinancialSummary(
    financialData: any,
    projectId: string
  ): Promise<any> {
    try {
      // Transform frontend data to backend payload format
      const transformedData = this.transformFinancialSummaryData(
        financialData,
        projectId
      )

      const response = await apiClient.post(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FINANCIAL_SUMMARY.SAVE,
        transformedData
      )
      return response
    } catch (error) {
      throw error
    }
  }

  // Transform financial summary data to backend format
  private transformFinancialSummaryData(data: any, projectId: string): any {
    const parseValue = (value: any): number | null => {
      if (typeof value === 'string') {
        if (value === '' || value.trim() === '') return null
        const parsed = parseFloat(value.replace(/,/g, ''))
        return isNaN(parsed) ? null : parsed
      }
      return typeof value === 'number' ? value : null
    }

    const formatDate = (date: any): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()
      return new Date().toISOString()
    }

    return {
      // Estimated fields
      mffsEstRevenue: data.estimate?.revenue || '',
      mffsEstConstructionCost: parseValue(data.estimate?.constructionCost),
      mffsEstProjectMgmtExpense: parseValue(
        data.estimate?.projectManagementExpense
      ),
      mffsEstLandCost: parseValue(data.estimate?.landCost),
      mffsEstMarketingExpense: parseValue(data.estimate?.marketingExpense),
      mffsEstimatedDate: formatDate(data.estimate?.date),
      mffsEstExceptionalCapVal: data.estimate?.exceptionalCapVal || '',

      // Actual fields
      mffsActualSoldValue: parseValue(data.actual?.soldValue),
      mffsActualConstructionCost: parseValue(data.actual?.constructionCost),
      mffsActualInfraCost: parseValue(data.actual?.infraCost),
      mffsActualLandCost: parseValue(data.actual?.landCost),
      mffsActualMarketingExp: parseValue(data.actual?.marketingExpense),
      mffsActualProjectMgmtExpense: parseValue(
        data.actual?.projectManagementExpense
      ),
      mffsActualDate: formatDate(data.actual?.date),
      mffsActualexceptCapVal: data.actual?.exceptCapVal || '',

      // Current Cash Received fields (breakdown section 0)
      mffsCurrentCashReceived: parseValue(data.breakdown?.[0]?.total),
      mffsCurCashRecvdOutEscrow: parseValue(data.breakdown?.[0]?.outOfEscrow),
      mffsCurCashRecvdWithinEscrow: parseValue(
        data.breakdown?.[0]?.withinEscrow
      ),
      mffsCurCashRecvdTotal: parseValue(data.breakdown?.[0]?.total),
      mffsCurCashexceptCapVal: data.breakdown?.[0]?.exceptionalCapValue || '',

      // Current Land Cost fields (breakdown section 1)
      mffsCurrentLandCost: parseValue(data.breakdown?.[1]?.total),
      mffsCurLandCostOut: parseValue(data.breakdown?.[1]?.outOfEscrow),
      mffsCurLandCostWithin: parseValue(data.breakdown?.[1]?.withinEscrow),
      mffsCurLandTotal: parseValue(data.breakdown?.[1]?.total),
      mffsCurLandexceptCapVal: data.breakdown?.[1]?.exceptionalCapValue || '',

      // Current Construction Cost fields (breakdown section 2)
      mffsCurrentConstructionCost: parseValue(data.breakdown?.[2]?.total),
      mffsCurConsCostWithin: parseValue(data.breakdown?.[2]?.withinEscrow),
      mffsCurConsCostOut: parseValue(data.breakdown?.[2]?.outOfEscrow),
      mffsCurConsCostTotal: parseValue(data.breakdown?.[2]?.total),
      mffsCurConsExcepCapVal: data.breakdown?.[2]?.exceptionalCapValue || '',

      // Current Marketing Expense fields (breakdown section 3)
      mffsCurrentMarketingExp: parseValue(data.breakdown?.[3]?.total),
      mffsCurrentMktgExpWithin: parseValue(data.breakdown?.[3]?.withinEscrow),
      mffsCurrentMktgExpOut: parseValue(data.breakdown?.[3]?.outOfEscrow),
      mffsCurrentMktgExpTotal: parseValue(data.breakdown?.[3]?.total),
      mffsCurrentmktgExcepCapVal:
        data.breakdown?.[3]?.exceptionalCapValue || '',

      // Current Project Management Expense fields (breakdown section 4)
      mffsCurrentProjectMgmtExp: parseValue(data.breakdown?.[4]?.total),
      mffsCurProjMgmtExpWithin: parseValue(data.breakdown?.[4]?.withinEscrow),
      mffsCurProjMgmtExpOut: parseValue(data.breakdown?.[4]?.outOfEscrow),
      mffsCurProjMgmtExpTotal: parseValue(data.breakdown?.[4]?.total),
      mffsCurProjExcepCapVal: data.breakdown?.[4]?.exceptionalCapValue || '',

      // Current Mortgage fields (breakdown section 5)
      mffsCurrentMortgage: parseValue(data.breakdown?.[5]?.total),
      mffsCurrentMortgageWithin: parseValue(data.breakdown?.[5]?.withinEscrow),
      currentMortgageOut: parseValue(data.breakdown?.[5]?.outOfEscrow),
      mffsCurrentMortgageTotal: parseValue(data.breakdown?.[5]?.total),
      mffsCurMortgageExceptCapVal:
        data.breakdown?.[5]?.exceptionalCapValue || '',

      // Current VAT Payment fields (breakdown section 6)
      mffsCurrentVatPayment: parseValue(data.breakdown?.[6]?.total),
      mffsCurrentVatPaymentWithin: parseValue(
        data.breakdown?.[6]?.withinEscrow
      ),
      mffsCurrentVatPaymentOut: parseValue(data.breakdown?.[6]?.outOfEscrow),
      mffsCurrentVatPaymentTotal: parseValue(data.breakdown?.[6]?.total),
      mffsCurVatExceptCapVal: data.breakdown?.[6]?.exceptionalCapValue || '',

      // Current Oqood fields (breakdown section 7)
      mffsCurrentOqood: parseValue(data.breakdown?.[7]?.total),
      mffsCurrentOqoodWithin: parseValue(data.breakdown?.[7]?.withinEscrow),
      mffsCurrentOqoodOut: parseValue(data.breakdown?.[7]?.outOfEscrow),
      mffsCurrentOqoodTotal: parseValue(data.breakdown?.[7]?.total),
      mffsCurOqoodExceptCapVal: data.breakdown?.[7]?.exceptionalCapValue || '',

      // Current Refund fields (breakdown section 8)
      mffsCurrentRefund: parseValue(data.breakdown?.[8]?.total),
      mffsCurrentRefundWithin: parseValue(data.breakdown?.[8]?.withinEscrow),
      mffsCurrentRefundOut: parseValue(data.breakdown?.[8]?.outOfEscrow),
      mffsCurrentRefundTotal: parseValue(data.breakdown?.[8]?.total),
      mffsCurRefundExceptCapVal:
        data.breakdown?.[8]?.exceptionalCapValue || '',

      // Current Balance in Retention Account fields (breakdown section 9)
      mffsCurrentBalInRetenAcc: parseValue(data.breakdown?.[9]?.total),
      mffsCurBalInRetenAccWithin: parseValue(
        data.breakdown?.[9]?.withinEscrow
      ),
      mffsCurBalInRetenAccOut: parseValue(data.breakdown?.[9]?.outOfEscrow),
      mffsCurBalInRetenAccTotal: parseValue(data.breakdown?.[9]?.total),
      mffsCurBalInRetenExceptCapVal:
        data.breakdown?.[9]?.exceptionalCapValue || '',

      // Current Balance in Trust Account fields (breakdown section 10)
      mffsCurrentBalInTrustAcc: parseValue(data.breakdown?.[10]?.total),
      mffsCurBalInTrustAccWithin: parseValue(
        data.breakdown?.[10]?.withinEscrow
      ),
      mffsCurBalInTrustAccOut: parseValue(data.breakdown?.[10]?.outOfEscrow),
      mffsCurBalInTrustAccTotal: parseValue(data.breakdown?.[10]?.total),
      mffsCurBalInExceptCapVal:
        data.breakdown?.[10]?.exceptionalCapValue || '',

      // Current Technical Fee fields (breakdown section 12)
      mffsCurrentTechnicalFee: parseValue(data.breakdown?.[12]?.total),
      mffsCurTechnFeeWithin: parseValue(data.breakdown?.[12]?.withinEscrow),
      mffsCurTechnFeeOut: parseValue(data.breakdown?.[12]?.outOfEscrow),
      mffsCurTechnFeeTotal: parseValue(data.breakdown?.[12]?.total),
      mffsCurTechFeeExceptCapVal:
        data.breakdown?.[12]?.exceptionalCapValue || '',

      // Current Unidentified Fund fields (breakdown section 13)
      mffsCurrentUnIdentifiedFund: parseValue(data.breakdown?.[13]?.total),
      mffsCurUnIdeFundWithin: parseValue(data.breakdown?.[13]?.withinEscrow),
      mffsCurUnIdeFundOut: parseValue(data.breakdown?.[13]?.outOfEscrow),
      mffsCurUnIdeFundTotal: parseValue(data.breakdown?.[13]?.total),
      mffsCurUnIdeExceptCapVal:
        data.breakdown?.[13]?.exceptionalCapValue || '',

      // Current Loan Installment fields (breakdown section 14)
      mffsCurrentLoanInstal: parseValue(data.breakdown?.[14]?.total),
      mffsCurLoanInstalWithin: parseValue(data.breakdown?.[14]?.withinEscrow),
      mffsCurLoanInstalOut: parseValue(data.breakdown?.[14]?.outOfEscrow),
      mffsCurLoanInstalTotal: parseValue(data.breakdown?.[14]?.total),
      mffsCurLoanExceptCapVal: data.breakdown?.[14]?.exceptionalCapValue || '',

      // Current Infrastructure Cost fields (breakdown section 15)
      mffsCurrentInfraCost: parseValue(data.breakdown?.[15]?.total),
      mffsCurInfraCostWithin: parseValue(data.breakdown?.[15]?.withinEscrow),
      mffsCurInfraCostOut: parseValue(data.breakdown?.[15]?.outOfEscrow),
      mffsCurInfraCostTotal: parseValue(data.breakdown?.[15]?.total),
      mffsCurInfraExceptCapVal:
        data.breakdown?.[15]?.exceptionalCapValue || '',

      // Current Others Cost fields (breakdown section 16)
      mffsCurrentOthersCost: parseValue(data.breakdown?.[16]?.total),
      mffsCurOthersCostWithin: parseValue(data.breakdown?.[16]?.withinEscrow),
      mffsCurOthersCostOut: parseValue(data.breakdown?.[16]?.outOfEscrow),
      mffsCurOthersCostTotal: parseValue(data.breakdown?.[16]?.total),
      mffsCurOthersExceptCapVal:
        data.breakdown?.[16]?.exceptionalCapValue || '',

      // Current Transferred Cost fields (breakdown section 17)
      mffsCurrentTransferredCost: parseValue(data.breakdown?.[17]?.total),
      mffsCurTransferCostWithin: parseValue(
        data.breakdown?.[17]?.withinEscrow
      ),
      mffsCurTransferCostOut: parseValue(data.breakdown?.[17]?.outOfEscrow),
      mffsCurTransferCostTotal: parseValue(data.breakdown?.[17]?.total),
      mffsCurTransferExceptCapVal:
        data.breakdown?.[17]?.exceptionalCapValue || '',

      // Current Forfeited Cost fields (breakdown section 18)
      mffsCurrentForfeitedCost: parseValue(data.breakdown?.[18]?.total),
      mffsCurForfeitCostWithin: parseValue(data.breakdown?.[18]?.withinEscrow),
      mffsCurForfeitCostOut: parseValue(data.breakdown?.[18]?.outOfEscrow),
      mffsCurForfeitCostTotal: parseValue(data.breakdown?.[18]?.total),
      mffsCurForfeitExceptCapVal:
        data.breakdown?.[18]?.exceptionalCapValue || '',

      // Current Developer Equity Cost fields (breakdown section 19)
      mffsCurrentDeveloperEquitycost: parseValue(data.breakdown?.[19]?.total),
      mffsCurDeveEqtycostWithin: parseValue(
        data.breakdown?.[19]?.withinEscrow
      ),
      mffsCurDeveEqtycostOut: parseValue(data.breakdown?.[19]?.outOfEscrow),
      mffsCurDeveEqtycostTotal: parseValue(data.breakdown?.[19]?.total),
      mffsCurDeveExceptCapVal: data.breakdown?.[19]?.exceptionalCapValue || '',

      // Current Amount Fund fields (breakdown section 20)
      mffsCurrentAmantFund: parseValue(data.breakdown?.[20]?.total),
      mffsCurAmntFundWithin: parseValue(data.breakdown?.[20]?.withinEscrow),
      mffsCurAmntFundOut: parseValue(data.breakdown?.[20]?.outOfEscrow),
      mffsCurAmntFundTotal: parseValue(data.breakdown?.[20]?.total),
      mffsCurAmntExceptCapVal: data.breakdown?.[20]?.exceptionalCapValue || '',

      // Current Other Withdrawals fields (breakdown section 21)
      mffsCurrentOtherWithdrawls: parseValue(data.breakdown?.[21]?.total),
      mffsCurOtherWithdWithin: parseValue(data.breakdown?.[21]?.withinEscrow),
      mffsCurOtherWithdOut: parseValue(data.breakdown?.[21]?.outOfEscrow),
      mffsCurOtherWithdTotal: parseValue(data.breakdown?.[21]?.total),
      mffsCurOtherExceptCapVal:
        data.breakdown?.[21]?.exceptionalCapValue || '',

      // Current Oqood Other Fee Payment fields (breakdown section 22)
      mffsCurrentOqoodOtherFeePay: parseValue(data.breakdown?.[22]?.total),
      mffsCurOqoodOthFeeWithin: parseValue(data.breakdown?.[22]?.withinEscrow),
      mffsCurOqoodOthFeeOut: parseValue(data.breakdown?.[22]?.outOfEscrow),
      mffsCurOqoodOthFeeTotal: parseValue(data.breakdown?.[22]?.total),

      // Current VAT Deposit fields (breakdown section 23)
      mffsCurrentVatDeposit: parseValue(data.breakdown?.[23]?.total),
      mffsCurVatDepositWithin: parseValue(data.breakdown?.[23]?.withinEscrow),
      mffsCurVatDepositOut: parseValue(data.breakdown?.[23]?.outOfEscrow),
      mffsCurVatDepositTotal: parseValue(data.breakdown?.[23]?.total),
      mffsCurVatDepositCapVal: data.breakdown?.[23]?.exceptionalCapValue || '',

      // Current Balance Construction fields (breakdown section 24)
      mffsCurBalConstructionTotal: parseValue(data.breakdown?.[24]?.total),
      mffsCurBalConstructionWithin: parseValue(
        data.breakdown?.[24]?.withinEscrow
      ),
      mffsCurBalConstructionOut: parseValue(data.breakdown?.[24]?.outOfEscrow),
      mffsCurBalExcepCapVal: data.breakdown?.[24]?.exceptionalCapValue || '',

      // Additional fields - now from data.additional instead of breakdown array
      mffsCreditInterest: parseValue(data.additional?.creditInterestRetention),
      mffsPaymentForRetentionAcc: parseValue(data.additional?.paymentsRetentionAccount),
      mffsDeveloperReimburse: parseValue(data.additional?.reimbursementsDeveloper),
      mffsUnitRegFees: parseValue(data.additional?.unitRegistrationFees),
      mffsCreditInterestProfit: parseValue(data.additional?.creditInterestEscrow),
      mffsVatCappedCost: parseValue(data.additional?.vatCapped),
      mffsExceptionalCapVal: '',

      // Current Balance in Sub Construction Account fields (breakdown section 11)
      mffsCurrentBalInSubsConsAcc: parseValue(data.breakdown?.[11]?.total),
      mffsCurBalInRSubsConsWithin: parseValue(
        data.breakdown?.[11]?.withinEscrow
      ),
      mffsCurBalInSubsConsOut: parseValue(data.breakdown?.[11]?.outOfEscrow),
      mffsCurBalInSubsConsTotal: parseValue(data.breakdown?.[11]?.total),
      mffsCurBalInSubsConsCapVal:
        data.breakdown?.[11]?.exceptionalCapValue || '',

      // Other fields
      mffsOtherFeesAnPaymentExcepVal:
        data.breakdown?.[32]?.exceptionalCapValue || '',

      // Project reference
      managementFirmDTO: {
        id: parseInt(projectId),
      },

      // System fields
      deleted: false,
      enabled: true,
    }
  }

  async saveProjectBeneficiary(beneficiaryData: any): Promise<any> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.MANAGEMENT_FIRMS_BENEFICIARY.SAVE,
        beneficiaryData
      )

      return response
    } catch (error) {
      throw error
    }
  }

  async updateProjectBeneficiary(
    id: string,
    beneficiaryData: any
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.MANAGEMENT_FIRMS_BENEFICIARY.UPDATE(id),
        beneficiaryData
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Transform frontend financial data to backend payload format
  private transformFinancialData(frontendData: any, projectId?: number): any {
    const { estimate, actual, breakdown, additional } = frontendData
    
   
    

    // Helper function to parse string values to numbers
    const parseValue = (value: string | number): number | null => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        if (value === '' || value.trim() === '') return null
        const parsed = parseFloat(value.replace(/,/g, ''))
        return isNaN(parsed) ? null : parsed
      }
      return null
    }

    // Helper function to format date
    const formatDate = (date: any): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return new Date(date).toISOString()
      if (date.toISOString) return date.toISOString()
      return new Date().toISOString()
    }

    // Transform breakdown data
    const transformBreakdown = (breakdownData: any) => {
      if (!breakdownData) {
        return {}
      }

      const result: any = {}

      // Convert object to array if needed (breakdown might be an object with numeric keys)
      const breakdownArray = Array.isArray(breakdownData)
        ? breakdownData
        : Object.keys(breakdownData).map((key) => breakdownData[key])

      // Map each breakdown section to backend fields
      breakdownArray.forEach((item, index) => {
        if (!item) return

        const outOfEscrow = parseValue(item.outOfEscrow)
        const withinEscrow = parseValue(item.withinEscrow)
        const total = parseValue(item.total)
        const exceptionalCapValue = item.exceptionalCapValue || ''

        // Map to specific backend field names based on index
        switch (index) {
          case 0: // Cash Received from the Unit Holder
            result.mffsCurrentCashReceived = total
            result.mffsCurCashRecvdOutEscrow = outOfEscrow
            result.mffsCurCashRecvdWithinEscrow = withinEscrow
            result.mffsCurCashRecvdTotal = total
            result.mffsCurCashexceptCapVal = exceptionalCapValue
            break
          case 1: // Land Cost
            result.mffsCurrentLandCost = total
            result.mffsCurLandCostOut = outOfEscrow
            result.mffsCurLandCostWithin = withinEscrow
            result.mffsCurLandTotal = total
            result.mffsCurLandexceptCapVal = exceptionalCapValue
            break
          case 2: // Construction Cost
            result.mffsCurrentConstructionCost = total
            result.mffsCurConsCostWithin = withinEscrow
            result.mffsCurConsCostOut = outOfEscrow
            result.mffsCurConsCostTotal = total
            result.mffsCurConsExcepCapVal = exceptionalCapValue
            break
          case 3: // Marketing Expense
            result.mffsCurrentMarketingExp = total
            result.mffsCurrentMktgExpWithin = withinEscrow
            result.mffsCurrentMktgExpOut = outOfEscrow
            result.mffsCurrentMktgExpTotal = total
            result.mffsCurrentmktgExcepCapVal = exceptionalCapValue
            break
          case 4: // Project Management Expense
            result.mffsCurrentProjectMgmtExp = total
            result.mffsCurProjMgmtExpWithin = withinEscrow
            result.mffsCurProjMgmtExpOut = outOfEscrow
            result.mffsCurProjMgmtExpTotal = total
            result.mffsCurProjExcepCapVal = exceptionalCapValue
            break
          case 5: // Mortgage
            result.mffsCurrentMortgage = total
            result.mffsCurrentMortgageWithin = withinEscrow
            result.currentMortgageOut = outOfEscrow
            result.mffsCurrentMortgageTotal = total
            result.mffsCurMortgageExceptCapVal = exceptionalCapValue
            break
          case 6: // VAT Payment
            result.mffsCurrentVatPayment = total
            result.mffsCurrentVatPaymentWithin = withinEscrow
            result.mffsCurrentVatPaymentOut = outOfEscrow
            result.mffsCurrentVatPaymentTotal = total
            result.mffsCurVatExceptCapVal = exceptionalCapValue
            break
          case 7: // Deposit
            result.mffsCurrentOqood = total
            result.mffsCurrentOqoodWithin = withinEscrow
            result.mffsCurrentOqoodOut = outOfEscrow
            result.mffsCurrentOqoodTotal = total
            result.mffsCurOqoodExceptCapVal = exceptionalCapValue
            break
          case 8: // Refund
            result.mffsCurrentRefund = total
            result.mffsCurrentRefundWithin = withinEscrow
            result.mffsCurrentRefundOut = outOfEscrow
            result.mffsCurrentRefundTotal = total
            result.mffsCurRefundExceptCapVal = exceptionalCapValue
            break
          case 9: // Balance in Retention A/C
            result.mffsCurrentBalInRetenAcc = total
            result.mffsCurBalInRetenAccWithin = withinEscrow
            result.mffsCurBalInRetenAccOut = outOfEscrow
            result.mffsCurBalInRetenAccTotal = total
            result.mffsCurBalInRetenExceptCapVal = exceptionalCapValue
            break
          case 10: // Balance in Trust A/C
            result.mffsCurrentBalInTrustAcc = total
            result.mffsCurBalInTrustAccWithin = withinEscrow
            result.mffsCurBalInTrustAccOut = outOfEscrow
            result.mffsCurBalInTrustAccTotal = total
            result.mffsCurBalInExceptCapVal = exceptionalCapValue
            break
          case 11: // Balance in Sub Construction A/C
            result.mffsCurrentBalInSubsConsAcc = total
            result.mffsCurBalInRSubsConsWithin = withinEscrow
            result.mffsCurBalInSubsConsOut = outOfEscrow
            result.mffsCurBalInSubsConsTotal = total
            result.mffsCurBalInSubsConsCapVal = exceptionalCapValue
            break
          case 12: // Technical Fees
            result.mffsCurrentTechnicalFee = total
            result.mffsCurTechnFeeWithin = withinEscrow
            result.mffsCurTechnFeeOut = outOfEscrow
            result.mffsCurTechnFeeTotal = total
            result.mffsCurTechFeeExceptCapVal = exceptionalCapValue
            break
          case 13: // Unidentified Funds
            result.mffsCurrentUnIdentifiedFund = total
            result.mffsCurUnIdeFundWithin = withinEscrow
            result.mffsCurUnIdeFundOut = outOfEscrow
            result.mffsCurUnIdeFundTotal = total
            result.mffsCurUnIdeExceptCapVal = exceptionalCapValue
            break
          case 14: // Loan/Installments
            result.mffsCurrentLoanInstal = total
            result.mffsCurLoanInstalWithin = withinEscrow
            result.mffsCurLoanInstalOut = outOfEscrow
            result.mffsCurLoanInstalTotal = total
            result.mffsCurLoanExceptCapVal = exceptionalCapValue
            break
          case 15: // Infrastructure Cost
            result.mffsCurrentInfraCost = total
            result.mffsCurInfraCostWithin = withinEscrow
            result.mffsCurInfraCostOut = outOfEscrow
            result.mffsCurInfraCostTotal = total
            result.mffsCurInfraExceptCapVal = exceptionalCapValue
            break
          case 16: // Others
            result.mffsCurrentOthersCost = total
            result.mffsCurOthersCostWithin = withinEscrow
            result.mffsCurOthersCostOut = outOfEscrow
            result.mffsCurOthersCostTotal = total
            result.mffsCurOthersExceptCapVal = exceptionalCapValue
            break
        case 17: // Transferred
          result.mffsCurrentTransferredCost = total
          result.mffsCurTransferCostWithin = withinEscrow
          result.mffsCurTransferCostOut = outOfEscrow
          result.mffsCurTransferCostTotal = total
          result.mffsCurTransferExceptCapVal = exceptionalCapValue
          break
        case 18: // Forfeited Amount
          result.mffsCurrentForfeitedCost = total
          result.mffsCurForfeitCostWithin = withinEscrow
          result.mffsCurForfeitCostOut = outOfEscrow
          result.mffsCurForfeitCostTotal = total
          result.mffsCurForfeitExceptCapVal = exceptionalCapValue
          break
        case 19: // Developer's Equity
          result.mffsCurrentDeveloperEquitycost = total
          result.mffsCurDeveEqtycostWithin = withinEscrow
          result.mffsCurDeveEqtycostOut = outOfEscrow
          result.mffsCurDeveEqtycostTotal = total
          result.mffsCurDeveExceptCapVal = exceptionalCapValue
          break
        case 20: // Amanat Fund Allocation
          result.mffsCurrentAmantFund = total
          result.mffsCurAmntFundWithin = withinEscrow
          result.mffsCurAmntFundOut = outOfEscrow
          result.mffsCurAmntFundTotal = total
          result.mffsCurAmntExceptCapVal = exceptionalCapValue
          break
        case 21: // Other Withdrawals
          result.mffsCurrentOtherWithdrawls = total
          result.mffsCurOtherWithdWithin = withinEscrow
          result.mffsCurOtherWithdOut = outOfEscrow
          result.mffsCurOtherWithdTotal = total
          result.mffsCurOtherExceptCapVal = exceptionalCapValue
          break
        case 22: // Oqood and Other Payments
          result.mffsCurrentOqoodOtherFeePay = total
          result.mffsCurOqoodOthFeeWithin = withinEscrow
          result.mffsCurOqoodOthFeeOut = outOfEscrow
          result.mffsCurOqoodOthFeeTotal = total
          result.mffsOtherFeesAnPaymentExcepVal = exceptionalCapValue
          break
        case 23: // VAT Deposit
          result.mffsCurrentVatDeposit = total
          result.mffsCurVatDepositWithin = withinEscrow
          result.mffsCurVatDepositOut = outOfEscrow
          result.mffsCurVatDepositTotal = total
          result.mffsCurVatDepositCapVal = exceptionalCapValue
          break
        case 24: // Credit Transfer/Profit Earned for Retention A/C
          result.mffsCreditInterest = total
          break
        case 25: // Payments for Retention Account
          result.mffsPaymentForRetentionAcc = total
          break
        case 26: // Re-imbursements (Developer)
          result.mffsDeveloperReimburse = total
          break
        case 27: // Unit Registration Fee
          result.mffsUnitRegFees = total
          break
        case 28: // Credit Interest/Profit Earned for ESCROW A/C
          result.mffsCreditInterestProfit = total
          break
        case 29: // VAT Support
          result.mffsVatCappedCost = total
          break
        }
      })

      return result
    }

    // Build the complete payload
    const payload = {
      // Estimate fields
      mffsEstRevenue: estimate?.revenue || '',
      mffsEstConstructionCost: parseValue(estimate?.constructionCost),
      mffsEstProjectMgmtExpense: parseValue(
        estimate?.projectManagementExpense
      ),
      mffsEstLandCost: parseValue(estimate?.landCost),
      mffsEstMarketingExpense: parseValue(estimate?.marketingExpense),
      mffsEstimatedDate: formatDate(estimate?.date),
      mffsEstExceptionalCapVal: estimate?.exceptionalCapValue || '',

      // Actual fields
      mffsActualSoldValue: parseValue(actual?.soldValue),
      mffsActualConstructionCost: parseValue(actual?.constructionCost),
      mffsActualInfraCost: parseValue(actual?.infraCost),
      mffsActualLandCost: parseValue(actual?.landCost),
      mffsActualMarketingExp: parseValue(actual?.marketingExpense),
      mffsActualProjectMgmtExpense: parseValue(
        actual?.projectManagementExpense
      ),
      mffsActualDate: formatDate(actual?.date),
      mffsActualexceptCapVal: actual?.exceptionalCapValue || '',

      // Breakdown fields
      ...transformBreakdown(breakdown),

      // Additional fields - mapped to correct backend keys
      mffsCreditInterest: parseValue(additional?.creditInterestRetention),
      mffsPaymentForRetentionAcc: parseValue(additional?.paymentsRetentionAccount),
      mffsDeveloperReimburse: parseValue(additional?.reimbursementsDeveloper),
      mffsUnitRegFees: parseValue(additional?.unitRegistrationFees),
      mffsVatCappedCost: parseValue(additional?.vatCapped),
      mffsCreditInterestProfit: parseValue(additional?.creditInterestEscrow),

      // Project reference
      managementFirmDTO: {
        id: projectId || 0,
      },

      // Default values
      deleted: false,
      enabled: true,
    }

   
    
    return payload
  }

  // Save financial summary (first time)
  async saveFinancialSummary(data: any, projectId?: number): Promise<any> {
   
    const transformedData = this.transformFinancialData(data, projectId)
    return apiClient.post(
      API_ENDPOINTS.MANAGEMENT_FIRMS_FINANCIAL_SUMMARY.SAVE,
      transformedData
    )
  }

  // Update financial summary (edit mode)
  async updateFinancialSummary(
    id: number,
    data: any,
    projectId?: number
  ): Promise<any> {
   
    const transformedData = this.transformFinancialData(data, projectId)

    // Add the id field for PUT request
    const payloadWithId = {
      id: id,
      ...transformedData,
    }

  

    const response = await apiClient.put(
      API_ENDPOINTS.MANAGEMENT_FIRMS_FINANCIAL_SUMMARY.UPDATE(id.toString()),
      payloadWithId
    )

    return response
  }

  // Save payment plan (new payment plan without ID)
  async savePaymentPlan(
    paymentPlanData: any,
    projectId?: number
  ): Promise<any> {
    try {
      // Parse percentages and validate they don't exceed 100
      const installmentPercentage = parseFloat(
        String(paymentPlanData.installmentPercentage ?? 0)
      )
      const projectCompletionPercentage = parseFloat(
        String(paymentPlanData.projectCompletionPercentage ?? 0)
      )

      if (Number.isNaN(installmentPercentage) || Number.isNaN(projectCompletionPercentage)) {
        throw new Error('Installment and project completion percentages must be valid numbers')
      }
      if (installmentPercentage > 100) {
        throw new Error(
          `Installment percentage (${installmentPercentage}) cannot exceed 100%`
        )
      }
      if (projectCompletionPercentage > 100) {
        throw new Error(
          `Project completion percentage (${projectCompletionPercentage}) cannot exceed 100%`
        )
      }

      // Use the provided installment number (frontend already handles uniqueness)
      const finalInstallmentNumber = paymentPlanData.installmentNumber

      // Transform the data to match API payload format (mfpp* keys)
      const transformedData = {
        mfppInstallmentNumber: finalInstallmentNumber,
        mfppInstallmentPercentage: installmentPercentage,
        mfppProjectCompletionPercentage: projectCompletionPercentage,
        managementFirmDTO: {
          id: projectId || paymentPlanData.projectId,
        },
      }

      const response = await apiClient.post(
        API_ENDPOINTS.MANAGEMENT_FIRMS_PAYMENT_PLAN.SAVE,
        transformedData
      )
      return response
    } catch (error) {
      throw error
    }
  }

  // Update payment plan (existing payment plan with ID)
  async updatePaymentPlan(id: number, paymentPlanData: any): Promise<any> {
    try {
      const installmentPercentage = parseFloat(
        String(paymentPlanData.installmentPercentage ?? 0)
      )
      const projectCompletionPercentage = parseFloat(
        String(paymentPlanData.projectCompletionPercentage ?? 0)
      )

      if (Number.isNaN(installmentPercentage) || Number.isNaN(projectCompletionPercentage)) {
        throw new Error('Installment and project completion percentages must be valid numbers')
      }
      if (installmentPercentage > 100) {
        throw new Error(
          `Installment percentage (${installmentPercentage}) cannot exceed 100%`
        )
      }
      if (projectCompletionPercentage > 100) {
        throw new Error(
          `Project completion percentage (${projectCompletionPercentage}) cannot exceed 100%`
        )
      }

      // Transform the data to match API payload format (mfpp* keys)
      const transformedData = {
        id: id,
        mfppInstallmentNumber: paymentPlanData.installmentNumber,
        mfppInstallmentPercentage: installmentPercentage,
        mfppProjectCompletionPercentage: projectCompletionPercentage,
        deleted: false,
        enabled: true,
        managementFirmDTO: {
          id: paymentPlanData.projectId || id,
        },
      }

      const response = await apiClient.put(
        API_ENDPOINTS.MANAGEMENT_FIRMS_PAYMENT_PLAN.UPDATE(id.toString()),
        transformedData
      )

      return response
    } catch (error) {
      throw error
    }
  }

  // Get payment plans by project ID
  async getPaymentPlansByProjectId(projectId: number): Promise<any[]> {
    try {
      const endpoint =
        API_ENDPOINTS.MANAGEMENT_FIRMS_PAYMENT_PLAN.GET_BY_PROJECT_ID(
          projectId.toString()
        )

      const response = await apiClient.get(endpoint)
      if (Array.isArray(response)) return response
      if (response && typeof response === 'object' && 'content' in response) {
        return Array.isArray((response as any).content) ? (response as any).content : []
      }
      return []
    } catch (error) {
      return []
    }
  }

  // Delete payment plan by ID (soft delete)
  async deletePaymentPlan(id: number): Promise<void> {
    try {
      const endpoint = API_ENDPOINTS.MANAGEMENT_FIRMS_PAYMENT_PLAN.SOFT_DELETE(
        id.toString()
      )
      await apiClient.delete(endpoint)
    } catch (error) {
      throw error
    }
  }

  // Save project closure (new closure without ID)
  async saveProjectClosure(closureData: any, projectId?: number): Promise<any> {
    try {
      // Parse values and convert to numbers
      const parseValue = (value: string | number): number => {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
          const parsed = parseFloat(value.replace(/,/g, ''))
          return isNaN(parsed) ? 0 : parsed
        }
        return 0
      }

      // Transform the data to match API payload format (mfc* keys only)
      const transformedData = {
        mfcTotalIncomeFund: parseValue(
          closureData.totalIncomeFund || closureData.projectEstimatedCost || 0
        ),
        mfcTotalPayment: parseValue(
          closureData.totalPayment || closureData.actualCost || 0
        ),
        managementFirmDTO: {
          id: projectId || closureData.projectId,
        },
      }

      const response = await apiClient.post(
        API_ENDPOINTS.MANAGEMENT_FIRMS_CLOSURE.SAVE,
        transformedData
      )
      return response
    } catch (error) {
      throw error
    }
  }

  // Get project closure for review
  async getProjectClosure(projectId: string): Promise<any> {
  
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.MANAGEMENT_FIRMS_CLOSURE.GET_BY_PROJECT_ID(projectId)
      )
      return response
    } catch (error) {
      return null
    }
  }

  // Get project statistics for status cards
  async getProjectStats(): Promise<RealEstateAssetStats> {
    try {
      const response = await this.getProjects(0, 1000) // Get all projects for stats
      const projects = response.content || []

      const stats: RealEstateAssetStats = {
        total: projects.length,
        active: 0,
        closed: 0,
        frozen: 0,
        approved: 0,
        inReview: 0,
        rejected: 0,
        incomplete: 0,
      }

      projects.forEach((project) => {
        const status =
          project.mfStatusDTO?.languageTranslationId?.configValue?.toLowerCase()
        const accountStatus =
          project.mfAccountStatusDTO?.languageTranslationId?.configValue?.toLowerCase()

        if (status?.includes('active')) stats.active++
        if (status?.includes('closed')) stats.closed++
        if (status?.includes('frozen')) stats.frozen++

        if (accountStatus?.includes('approved')) stats.approved++
        if (accountStatus?.includes('review')) stats.inReview++
        if (accountStatus?.includes('rejected')) stats.rejected++
        if (accountStatus?.includes('incomplete')) stats.incomplete++
      })

      return stats
    } catch (error) {
      throw error
    }
  }

  // Project Review Data Fetching Methods
  // Get project details for review
  async getProjectDetails(projectId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.MANAGEMENT_FIRMS.GET_BY_ID(projectId)
      )
      return response
    } catch (error) {
      throw error
    }
  }

  // Get project accounts for review
  async getProjectAccounts(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.MANAGEMENT_FIRMS_BANK_ACCOUNT.GET_BY_PROJECT_ID(projectId)
      )

      // Handle different response formats
      if (Array.isArray(response)) {
        return response
      } else if (
        response &&
        typeof response === 'object' &&
        'content' in response
      ) {
        return Array.isArray((response as any).content)
          ? (response as any).content
          : []
      }
      return []
    } catch (error) {
      return []
    }
  }

  // Get project fees for review
  async getProjectFees(projectId: string): Promise<any[]> {
    try {
      // Use proper URLSearchParams for multiple filters
      const params = new URLSearchParams({
        'realEstateAssestId.equals': projectId,
        'deleted.equals': 'false',
        'enabled.equals': 'true',
      })

      const url = `${API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.GET_ALL}?${params.toString()}`
      const response = await apiClient.get(url)

      // Handle different response formats
      let baseFees: any[] = []

      if (Array.isArray(response)) {
        baseFees = response
      } else if (
        response &&
        typeof response === 'object' &&
        'content' in response
      ) {
        baseFees = Array.isArray((response as any).content)
          ? (response as any).content
          : []
      }

      // Enrich fees that are missing frequency information by fetching them individually.
      // The list API may return mffFrequencyDTO as null, while the GET_BY_ID API
      // returns a populated mffFrequencyDTO (with the id we need to prefill the form).
      const enrichedFees = await Promise.all(
        baseFees.map(async (fee) => {
          // If frequency DTO is already present, use as-is
          if (fee?.mffFrequencyDTO || !fee?.id) {
            return fee
          }

          try {
            const rawDetail = await apiClient.get(
              API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.GET_BY_ID(
                fee.id.toString()
              )
            )

            // Unwrap common response shapes: { data: entity }, { content: entity }, or raw entity
            let detail: any = rawDetail
            if (
              rawDetail &&
              typeof rawDetail === 'object' &&
              !Array.isArray(rawDetail) &&
              ('data' in (rawDetail as any) || 'content' in (rawDetail as any))
            ) {
              const obj = rawDetail as any
              detail = obj.data ?? obj.content ?? rawDetail
            }
            // If unwrapped value is not the entity (no id), use rawDetail (backend may return fee at top level)
            if (detail && typeof detail === 'object' && !detail.id && rawDetail && (rawDetail as any).id) {
              detail = rawDetail
            }

            if (detail && detail.mffFrequencyDTO) {
              return {
                ...fee,
                mffFrequencyDTO: detail.mffFrequencyDTO,
              }
            }
          } catch {
            // If the detail call fails, fall back to original fee
          }

          return fee
        })
      )

      return enrichedFees
    } catch (error) {
      return []
    }
  }

  // Get project beneficiaries for review
  async getProjectBeneficiaries(projectId: string): Promise<any[]> {
    try {
      // Backend expects managementFirmId.equals (singular)
      const params = new URLSearchParams({
        'managementFirmId.equals': projectId,
        'deleted.equals': 'false',
        'enabled.equals': 'true',
      })

      const url = `${API_ENDPOINTS.MANAGEMENT_FIRMS_BENEFICIARY.GET_ALL}?${params.toString()}`
      const response = await apiClient.get(url)

      // Handle different response formats
      if (Array.isArray(response)) {
        return response
      } else if (
        response &&
        typeof response === 'object' &&
        'content' in response
      ) {
        return Array.isArray((response as any).content)
          ? (response as any).content
          : []
      }
      return []
    } catch (error) {
      return []
    }
  }

  // Soft delete project beneficiary
  async softDeleteProjectBeneficiary(id: string): Promise<void> {
    try {
      await apiClient.delete(
        API_ENDPOINTS.MANAGEMENT_FIRMS_BENEFICIARY.SOFT_DELETE(id)
      )
    } catch (error) {
      throw error
    }
  }

  // Soft delete project fee
  async softDeleteProjectFee(id: string): Promise<void> {
    try {
      await apiClient.delete(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FEE.SOFT_DELETE(id)
      )
    } catch (error) {
      throw error
    }
  }

  // Get project payment plans for review
  async getProjectPaymentPlans(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.MANAGEMENT_FIRMS_PAYMENT_PLAN.GET_BY_PROJECT_ID(
          projectId
        )
      )

      // Handle different response formats
      if (Array.isArray(response)) {
        return response
      } else if (
        response &&
        typeof response === 'object' &&
        'content' in response
      ) {
        return Array.isArray((response as any).content)
          ? (response as any).content
          : []
      }
      return []
    } catch (error) {
      return []
    }
  }

  // Get project financial summary for review
  async getProjectFinancialSummary(projectId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.MANAGEMENT_FIRMS_FINANCIAL_SUMMARY.GET_BY_PROJECT_ID(
          projectId
        )
      )
      // Normalize: some APIs return { content: [...] }, others return array directly
      if (Array.isArray(response)) {
        return { content: response, page: { size: response.length, number: 0, totalElements: response.length, totalPages: 1 } }
      }
      return response
    } catch (error) {
      return null
    }
  }

  // Get project documents for review
  async getProjectDocuments(projectId: string): Promise<any[]> {
   
    try {
      const params = new URLSearchParams({
        'module.equals': 'BUILD_PARTNER_ASSET',
        'recordId.equals': projectId,
      })
      const response = await apiClient.get(
        `${API_ENDPOINTS.MANAGEMENT_FIRMS_DOCUMENT.GET_ALL}?${params.toString()}`
      )


      // Handle different response formats
      if (Array.isArray(response)) {
        return response
      } else if (
        response &&
        typeof response === 'object' &&
        'content' in response
      ) {
        return Array.isArray((response as any).content)
          ? (response as any).content
          : []
      }
      return []
    } catch (error) {
      return []
    }
  }
}

// Step-specific API methods for project forms
export interface ProjectStepData {
  step1?: RealEstateAsset // Project Details
  step2?: any // Account Details
  step3?: any // Fee Details
  step4?: any // Beneficiary Details
  step5?: any // Payment Plan
  step6?: any // Financial
  step7?: any // Project Closure
}

export interface ProjectStepValidationResponse {
  isValid: boolean
  errors: string[]
  source: 'client' | 'server'
}

// Extend the service with step-specific methods
export class ProjectStepService {
  private realEstateAssetService: RealEstateAssetService

  constructor() {
    this.realEstateAssetService = RealEstateAssetService.getInstance()
  }
  // Get project step data
  async getProjectStepData(projectId: string, step: number): Promise<any> {
    switch (step) {
      case 1:
        return this.realEstateAssetService.getProject(parseInt(projectId))
      case 2:
        // TODO: Implement account-specific API when available
        return Promise.resolve(null)
      case 3:
        // TODO: Implement fees-specific API when available
        return Promise.resolve(null)
      case 4:
        // TODO: Implement beneficiary-specific API when available
        return Promise.resolve(null)
      case 5:
        // TODO: Implement payment plan-specific API when available
        return Promise.resolve(null)
      case 6:
        // TODO: Implement financial-specific API when available
        return Promise.resolve(null)
      case 7:
        // TODO: Implement closure-specific API when available
        return Promise.resolve(null)
      default:
        throw new Error(`Invalid step: ${step}`)
    }
  }

  // Save project step data
  async saveProjectStep(
    projectId: string,
    step: number,
    data: any
  ): Promise<any> {
    switch (step) {
      case 1:
        return this.realEstateAssetService.createProject(data)
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        return this.realEstateAssetService.updateProject(
          parseInt(projectId),
          data
        )
      default:
        throw new Error(`Invalid step: ${step}`)
    }
  }

  // Validate project step data
  async validateProjectStep(
    _step: number,
    _data: any
  ): Promise<ProjectStepValidationResponse> {
    // TODO: Implement actual validation API when available
    // For now, return mock validation
    return Promise.resolve({
      isValid: true,
      errors: [],
      source: 'client',
    })
  }
}

// Export singleton instance
export const realEstateAssetService = RealEstateAssetService.getInstance()
export const projectStepService = new ProjectStepService()

// Utility function to map Management Firm API response to UI format (MF + Asset Register)
export function mapRealEstateAssetToProjectData(
  asset: RealEstateAsset
): ProjectData {
  const mapApiStatus = (taskStatusDTO: TaskStatusDTO | null): string => {
    if (!taskStatusDTO) {
      return 'INITIATED'
    }
    return taskStatusDTO.code || 'INITIATED'
  }

  const ar = asset.assetRegisterDTO
  const mfStatus =
    asset.mfStatusDTO?.languageTranslationId?.configValue ||
    asset.mfStatusDTO?.settingValue ||
    'N/A'

  const result: ProjectData = {
    id: asset.id,
    name: asset.mfName ?? '',
    developerId: ar?.arDeveloperId ?? '',
    managementFirmId: ar?.arDeveloperId ?? '',
    managementFirmCif: ar?.arCifrera ?? '',
    developerName: ar?.arName ?? '',
    managementFirmName: ar?.arName ?? '',
    projectStatus: mfStatus,
    approvalStatus: mapApiStatus(asset.taskStatusDTO),
    location: asset.mfLocation ?? '',
    reraNumber: asset.mfReraNumber ?? '',
    startDate: asset.mfStartDate ?? '',
    completionDate: asset.mfCompletionDate ?? '',
    percentComplete: asset.mfPercentComplete ?? '',
    constructionCost: asset.mfConstructionCost ?? 0,
    currency:
      asset.mfConstructionCostCurrencyDTO?.languageTranslationId
        ?.configValue || 'N/A',
    totalUnits: asset.mfNoOfUnits ?? 0,
  }

  if (asset.mfRemarks) {
    result.remarks = asset.mfRemarks
  }

  return result
}
