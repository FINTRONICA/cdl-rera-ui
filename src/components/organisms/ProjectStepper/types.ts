import { Dayjs } from 'dayjs'

export interface ProjectDetailsData {
  // API fields matching the JSON payload exactly
  mfId: string
  mfCif: string
  mfName: string
  mfLocation: string
  mfReraNumber: string
  mfAccoutStatusDate: Dayjs | null
  mfRegistrationDate: Dayjs | null
  mfStartDate: Dayjs | null
  mfCompletionDate: Dayjs | null
  mfRetentionPercent: string
  mfPercentComplete: string
  mfConstructionCost: number
  reaAccStatusDate: Dayjs | null
  mfNoOfUnits: number
  mfRemarks: string
  mfSpecialApproval: string
  mfManagedBy: string
  mfBackupUser: string
  mfAdditionalRetentionPercent: string
  mfTotalRetentionPercent: string
  mfRetentionEffectiveDate: Dayjs | null
  mfManagementExpenses: string
  mfMarketingExpenses: string
  mfTeamLeadName: string
  mfRelationshipManagerName: string
  mfAssestRelshipManagerName: string
  mfRealEstateBrokerExp: number
  mfAdvertisementExp: number
  mfLandOwnerName: string

  // New fields from table specifications
  unitReferenceNumber?: string
  unitNumber?: string
  unitStatus?: string
  towerBuildingName?: string
  unitPlotSize?: string
  propertyId?: string
  unitIban?: string
  unitRegistrationFee?: string
  nameOfAgent?: string
  agentNationalId?: string
  grossSalePrice?: string
  salePrice?: string
  vatApplicable?: boolean
  deedNumber?: string
  agreementNumber?: string
  agreementDate?: Dayjs | null
  salePurchaseAgreement?: boolean
  projectPaymentPlan?: boolean
  paymentPlanSelection?: string
  worldCheck?: string
  amountPaidToDeveloperWithinEscrow?: string
  amountPaidToDeveloperOutOfEscrow?: string
  totalAmountPaid?: string
  reservationBookingForm?: boolean
  unitAreaSize?: string
  forfeitAmount?: string
  refundAmount?: string
  transferredAmount?: string
  additionalRemarks?: string

  // DTO objects matching API structure exactly
  assetRegisterDTO: {
    id: number
    arCifrera?: string
    arName?: string
    arMasterName?: string
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
  mfBlockPaymentTypeDTO: {
    id: number
  }

  // Additional fields
  status: string | null
}

export interface AccountData {
  id?: number | null
  trustAccountNumber: string
  ibanNumber: string
  dateOpened: Dayjs | null
  accountTitle: string
  currency: string
}

export interface FeeData {
  feeType: string
  frequency: string
  debitAmount: string
  feeToBeCollected: string
  nextRecoveryDate: Dayjs | null
  feePercentage: string
  amount: string
  vatPercentage: string
  currency: string
  debitAccount: string
}

export interface BeneficiaryData {
  id: string
  expenseType: string
  transferType: string
  name: string
  bankName: string
  swiftCode: string
  routingCode: string
  account: string
}

export interface PaymentPlanData {
  id?: number // Add ID for existing payment plans
  installmentNumber: number
  installmentPercentage: string
  projectCompletionPercentage: string
}

export interface BreakdownItem {
  outOfEscrow: string
  withinEscrow: string
  total: string
  exceptionalCapValue: string
}

export interface FinancialData {
  estimate: {
    revenue: string
    constructionCost: string
    projectManagementExpense: string
    landCost: string
    marketingExpense: string
    date: Dayjs | null
  }
  actual: {
    soldValue: string
    constructionCost: string
    infraCost: string
    landCost: string
    projectManagementExpense: string
    marketingExpense: string
    date: Dayjs | null
  }
  breakdown: BreakdownItem[]
  additional: {
    creditInterestRetention: string
    paymentsRetentionAccount: string
    reimbursementsDeveloper: string
    unitRegistrationFees: string
    creditInterestEscrow: string
    vatCapped: string
  }
}

export interface ProjectData extends ProjectDetailsData {
  // Step 2: Documents (NEW)
  documents?: DocumentItem[]

  // Step 3: Account Details
  accounts: AccountData[]

  // Step 4: Fee Details
  fees: FeeData[]

  // Step 5: Beneficiary Details
  beneficiaries: BeneficiaryData[]

  // Step 6: Payment Plan
  paymentPlan: PaymentPlanData[]

  // Step 7: Financial (extensive financial data)
  financialData: FinancialData

  // Step 8: Project Closure
  closureData: {
    totalIncomeFund: string
    totalPayment: string
  }
}

// Import DocumentItem type
import { DocumentItem } from '../DeveloperStepper/developerTypes'
