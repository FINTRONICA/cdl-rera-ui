export interface LanguageTranslation {
    id: number
    configId: string
    configValue: string
    content: string | null
    status: string | null
    enabled: boolean
    deleted: boolean | null
  }
  
  export interface DocumentTypeDTO {
    id: number
    settingKey: string
    settingValue: string
    languageTranslationId: LanguageTranslation
    remarks: string | null
    status: string | null
    enabled: boolean
    deleted: boolean | null
  }
  
  export interface CountryOptionDTO {
    id: number
    settingKey: string
    settingValue: string
    languageTranslationId: LanguageTranslation
    remarks: string | null
    status: string | null
    enabled: boolean
    deleted: boolean
  }
  
  export interface BudgetDTO {
    id: number
    settingKey: string
    settingValue: string
    languageTranslationId: LanguageTranslation
    remarks: string | null
    status: string | null
    enabled: boolean
    deleted: boolean | null
  }

  export interface AssetRegisterDTO {
    id: number
    arDeveloperId?: string
    arCifrera?: string
    arDeveloperRegNo?: string
    arName?: string
    arMasterName?: string
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
    arMigratedData?: boolean
    arRemark?: string
    arProjectName?: string
    arCompanyNumber?: string
    arMasterCommunity?: string
    arMasterDeveloper?: string
    deleted?: boolean
    enabled?: boolean
  }

  export interface ManagementFirmDTO {
    id: number
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
    mfAccStatusDate?: string
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
    assetRegisterDTO?: AssetRegisterDTO
  deleted?: boolean
  enabled?: boolean
  }

  /**
   * Budget Category API response (matches GET /budget-category/:id and list response).
   * Aligns with BUDGET_CATEGORY endpoints.
   */
  export interface BudgetCategoryApiResponse {
    id: number
    serviceChargeGroupId: number
    serviceChargeGroupName: string
    serviceChargeGroupNameLocale: string | null
    usageLocale: string | null
    serviceName: string
    serviceCode: string
    provisionalBudgetCode: string
    chargeTypeId: number | null
    chargeType: string
    usage: string | null
    budgetPeriodFrom: string | null
    budgetPeriodTo: string | null
    budgetPeriodTitle: string | null
    categoryCode: string
    categoryName: string
    categoryNameLocale: string | null
    categorySubCode: string
    categorySubName: string
    categorySubToSubCode: string
    categorySubToSubName: string
    vatAmount: number | null
    enabled: boolean
    deleted: boolean
    budgetDTO: unknown | null
    budgetItemDTOS: unknown[]
  }

  /**
   * UI-safe budget category shape (nullable API fields normalized to defaults).
   */
  export interface BudgetCategoryMappedData {
    id: number
    serviceChargeGroupId: number
    serviceChargeGroupName: string
    serviceChargeGroupNameLocale: string
    usageLocale: string
    serviceName: string
    serviceCode: string
    provisionalBudgetCode: string
    chargeTypeId: number
    chargeType: string
    usage: string
    budgetPeriodFrom: string
    budgetPeriodTo: string
    budgetPeriodTitle: string
    categoryCode: string
    categoryName: string
    categoryNameLocale: string
    categorySubCode: string
    categorySubName: string
    categorySubToSubCode: string
    categorySubToSubName: string
    vatAmount: number
    enabled: boolean
    deleted: boolean
  }

  /**
   * Map budget category API response to UI data (null-safe).
   */
  export function mapBudgetCategoryApiToUIData(
    api: BudgetCategoryApiResponse
  ): BudgetCategoryMappedData {
    return {
      id: api.id,
      serviceChargeGroupId: api.serviceChargeGroupId ?? 0,
      serviceChargeGroupName: api.serviceChargeGroupName ?? '',
      serviceChargeGroupNameLocale: api.serviceChargeGroupNameLocale ?? '',
      usageLocale: api.usageLocale ?? '',
      serviceName: api.serviceName ?? '',
      serviceCode: api.serviceCode ?? '',
      provisionalBudgetCode: api.provisionalBudgetCode ?? '',
      chargeTypeId: api.chargeTypeId ?? 0,
      chargeType: api.chargeType ?? '',
      usage: api.usage ?? '',
      budgetPeriodFrom: api.budgetPeriodFrom ?? '',
      budgetPeriodTo: api.budgetPeriodTo ?? '',
      budgetPeriodTitle: api.budgetPeriodTitle ?? '',
      categoryCode: api.categoryCode ?? '',
      categoryName: api.categoryName ?? '',
      categoryNameLocale: api.categoryNameLocale ?? '',
      categorySubCode: api.categorySubCode ?? '',
      categorySubName: api.categorySubName ?? '',
      categorySubToSubCode: api.categorySubToSubCode ?? '',
      categorySubToSubName: api.categorySubToSubName ?? '',
      vatAmount: api.vatAmount ?? 0,
      enabled: api.enabled ?? true,
      deleted: api.deleted ?? false,
    }
  }

  export interface BudgetResponse {
    id: number
    budgetId: string
    budgetName: string
    isActive: boolean
    budgetPeriodCode: string
    propertyGroupId: number
    propertyManagerEmail: string
    masterCommunityName: string
    masterCommunityNameLocale: string
    createdBy: string
    enabled: boolean
    deleted: boolean
    assetRegisterDTO: AssetRegisterDTO
    managementFirmDTO: ManagementFirmDTO
    budgetCategoriesDTOS: BudgetCategoryApiResponse[]
  }

  export interface BudgetRequest {
    id?: number
    budgetId: string
    budgetName: string
    isActive: boolean
    budgetPeriodCode: string
    propertyGroupId: number
    propertyManagerEmail: string
    masterCommunityName: string
    masterCommunityNameLocale: string
    createdBy: string
    enabled: boolean
    deleted: boolean
    assetRegisterDTO: { id: number }
    managementFirmDTO: { id: number }
    budgetCategoriesDTOS: Array<{ id: number }>
  }

  export interface BudgetItemResponse {
    id: number
    subCategoryCode: string
    subCategoryName: string
    subCategoryNameLocale: string
    serviceCode: string
    provisionalServiceCode: string
    serviceName: string
    serviceNameLocale: string
    totalBudget: number
    availableBudget: number
    utilizedBudget: number
    enabled: boolean
    deleted: boolean
    budgetCategoryDTO?: {
        id: number
        enabled?: boolean
    }
    budgetDTO?: {
        id: number
    } | null
  }

  export interface BudgetItemRequest {
    id?: number
    subCategoryCode: string
    subCategoryName: string
    subCategoryNameLocale: string
    serviceCode: string
    provisionalServiceCode: string
    serviceName: string
    serviceNameLocale: string
    totalBudget: number
    availableBudget: number
    utilizedBudget: number
    enabled: boolean
    deleted: boolean
    budgetCategoryDTO?: {
        id: number
        enabled?: boolean
    }
    budgetDTO?: {
        id: number
    } | null
  }

  // Mapping function for Budget Response to UI Data
  export function mapBudget(response: BudgetResponse): any {
    return {
      id: response.id,
      budgetId: response.budgetId,
      budgetName: response.budgetName,
      isActive: response.isActive,
      budgetPeriodCode: response.budgetPeriodCode,
      propertyGroupId: response.propertyGroupId,
      propertyManagerEmail: response.propertyManagerEmail,
      masterCommunityName: response.masterCommunityName,
      masterCommunityNameLocale: response.masterCommunityNameLocale,
      createdBy: response.createdBy,
      enabled: response.enabled,
      deleted: response.deleted,
      assetRegisterDTO: response.assetRegisterDTO,
      managementFirmDTO: response.managementFirmDTO,
      budgetCategoriesDTOS: response.budgetCategoriesDTOS || [],
      // UI display fields
      managementFirmGroupName: response.managementFirmDTO?.mfName || '-',
      managementCompanyName: response.managementFirmDTO?.mfName || '-',
      budgetPeriodTitle: response.budgetPeriodCode || '-',
      budgetPeriodRange: `${response.budgetPeriodCode || ''}`,
      serviceChargeGroupName: response.budgetCategoriesDTOS?.[0]?.serviceChargeGroupName ?? '-',
      totalCostDisplay: response.budgetCategoriesDTOS?.reduce((sum, cat) => sum + (cat.vatAmount ?? 0), 0) ?? 0,
    } as any
  }

