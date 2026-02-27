import { Dayjs } from 'dayjs'

export interface DocumentItem {
  id: string
  name: string
  size: number
  type: string
  uploadDate: Date
  status: 'uploading' | 'completed' | 'error' | 'failed'
  progress?: number
  file?: File
  url?: string
  classification?: string
}

// API response interface for documents
export interface ApiDocumentResponse {
  id: number
  rea: string | null
  documentName: string
  content: string | null
  location: string
  module: string
  recordId: number | string
  storageType: string
  uploadDate: string
  documentSize: string
  validityDate: string | null
  version: number
  eventDetail: string | null
  documentType?: {
    id: number
    settingKey: string
    settingValue: string
    remarks: string | null
    enabled: boolean
    deleted: boolean | null
  } | null
  documentTypeDTO?: {
    id: number
    settingKey: string
    settingValue: string
    languageTranslationId: {
      id: number
      configId: string
      configValue: string
      content: string | null
      status: string | null
      enabled: boolean
      deleted: boolean | null
    } | null
    remarks: string | null
    status: string | null
    enabled: boolean
    deleted: boolean | null
  } | null
  enabled: boolean
  deleted: boolean | null
}

// Paginated response for document list
export interface PaginatedDocumentResponse {
  content: ApiDocumentResponse[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export interface BuildPartnerData {
  id: number
  arDeveloperId: string
  arCifrera: string | null
  arDeveloperRegNo: string
  arName: string | null
  arMasterName: string | null
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
  arWorldCheckFlag: boolean | null
  arWorldCheckRemarks: string | null
  arMigratedData: boolean | null
  arRemark: string | null
  arRegulatorDTO: unknown | null
  arActiveStatusDTO?: unknown | null
  arProjectName?: string | null
  arCompanyNumber?: string | null
  arMasterCommunity?: string | null
  arMasterDeveloper?: string | null
}

export interface ProjectDetailsData {
  sectionId: string
  developerId: string
  developerName: string
  masterDeveloperName: string
  projectName: string
  projectLocation: string
  projectAccountCif: string
  projectStatus: string
  projectAccountStatusDate: Dayjs | null
  projectRegistrationDate: Dayjs | null
  projectStartDate: Dayjs | null
  projectCompletionDate: Dayjs | null
  retention: string
  additionalRetention: string
  totalRetention: string
  retentionEffectiveStartDate: Dayjs | null
  projectManagementExpenses: string
  marketingExpenses: string
  realEstateBrokerExpense: string
  advertisingExpense: string
  landOwnerName: string
  projectCompletionPercentage: string
  currency: string
  actualConstructionCost: string
  noOfUnits: string
  remarks: string
  specialApproval: string
  paymentType: string
  managedBy: string
  backupRef: string
  relationshipManager: string
  assistantRelationshipManager: string
  teamLeaderName: string
}

export interface AccountData {
  trustAccountNumber: string
  ibanNumber: string
  dateOpened: Dayjs | null
  accountTitle: string
  currency: string
}

export interface ContactData extends Record<string, unknown> {
  id?: number | string
  name?: string
  address?: string
  email?: string
  pobox?: string
  countrycode?: string
  mobileno?: string
  telephoneno?: string
  fax?: string
  assetRegisterDTO?: { id: number }
  assetRegisterDTO?: { id: number }
  arcFirstName?: string
  arcLastName?: string
  arcContactEmail?: string
  arcContactAddressLine1?: string
  arcContactAddressLine2?: string
  arcContactPoBox?: string
  arcCountryMobCode?: string
  arcContactTelNo?: string
  arcContactMobNo?: string
  arcContactFaxNo?: string
}

export interface FeeData extends Record<string, unknown> {
  id?: number | string
  feeType: string
  frequency: string
  debitAmount: string
  feeToBeCollected: string
  nextRecoveryDate: Dayjs | null
  feePercentage: string
  amount: string
  vatPercentage: string
  assetRegisterDTO?: { id: number }
  assetRegisterDTO?: { id: number }
}

export interface BeneficiaryData extends Record<string, unknown> {
  id: string
  transferType: string
  name: string
  bankName: string
  swiftCode: string
  routingCode: string
  account: string
  assetRegisterDTO?: { id: number }
  assetRegisterDTO?: { id: number }
  bpbTransferTypeDTO?: {
    id: number
    settingKey: string
    settingValue: string
    languageTranslationId: {
      id: number
      configId: string
      configValue: string
      content: string | null
      appLanguageCode: {
        id: number
        languageCode: string
        nameKey: string
        nameNativeValue: string
        deleted: boolean
        enabled: boolean
        rtl: boolean
      }
      applicationModuleDTO: any
      status: any
      enabled: boolean
      deleted: boolean
    }
    remarks: string | null
    status: any
    enabled: boolean
    deleted: boolean
  }
}

export interface PaymentPlanData {
  installmentNumber: number
  installmentPercentage: string
  projectCompletionPercentage: string
}

export interface FinancialData {
  projectEstimatedCost: string
  actualCost: string
  projectBudget: string
}

export interface ProjectData extends ProjectDetailsData {
  // Step 1: Asset Registry / Developer Details (ar*)
  arDeveloperId: string
  arCifrera: string
  arDeveloperRegNo: string
  arName: string
  arMasterName: string
  arNameLocal: string
  arOnboardingDate: Dayjs | null
  arContactAddress: string
  arContactTel: string
  arPoBox: string
  arMobile: string
  arFax: string
  arEmail: string
  arLicenseNo: string
  arLicenseExpDate: Dayjs | null
  arWorldCheckFlag: boolean
  arWorldCheckRemarks: string
  arMigratedData: boolean
  arRemark: string
  arRegulatorDTO: { id: number }
  arProjectName?: string
  arCompanyNumber?: string
  arMasterCommunity?: string
  arMasterDeveloper?: string

  // Step 2: Documents (Optional)
  documents: DocumentItem[]

  // Step 3: Account Details
  contactData: ContactData[]
  accounts: AccountData[]

  // Step 4: Fee Details
  fees: FeeData[]

  // Step 5: Beneficiary Details
  beneficiaries: BeneficiaryData[]

  // Step 6: Payment Plan
  paymentPlan: PaymentPlanData[]

  // Step 7: Financial (extensive financial data)
  financialData: FinancialData
}
