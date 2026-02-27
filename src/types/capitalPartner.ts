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

export interface InvestorTypeDTO {
  id: number
  settingKey: string
  settingValue: string
  languageTranslationId: LanguageTranslation
  remarks: string | null
  status: string | null
  enabled: boolean
  deleted: boolean | null
}

export interface CapitalPartnerResponse {
  // id: number
  // capitalPartnerId: string
  // capitalPartnerName: string
  // capitalPartnerMiddleName: string
  // capitalPartnerLastName: string
  // capitalPartnerOwnershipPercentage: number | null
  // capitalPartnerIdNo: string
  // capitalPartnerTelephoneNo: string
  // capitalPartnerMobileNo: string
  // capitalPartnerEmail: string
  // capitalPartnerOwnerNumber: number
  // isCurrent: boolean
  // idExpiaryDate: string
  // ownerRegistryLocaleName: string
  // documentTypeDTO: DocumentTypeDTO
  // countryOptionDTO: CountryOptionDTO
  // ownerRegistryTypeDTO: InvestorTypeDTO
  // capitalPartnerBankInfoDTOS: any | null
  // ownerRegistryUnitDTO: any | null
  // deleted: boolean
  // enabled: boolean
  // taskStatusDTO: any | null
  id: number
  ownerRegistryId: string
  ownerRegistryName: string
  ownerRegistryMiddleName: string
  ownerRegistryLastName: string
  ownerRegistryOwnershipPercentage: number | null
  ownerRegistryIdNo: string
  ownerRegistryTelephoneNo: string
  ownerRegistryMobileNo: string
  ownerRegistryEmail: string
  ownerRegistryOwnerNumber: number
  isCurrent: boolean
  /** API typo: idExpiaryDate; optional when GET omits it */
  idExpiaryDate?: string | null
  ownerRegistryLocaleName: string
  documentTypeDTO: DocumentTypeDTO
  countryOptionDTO: CountryOptionDTO
  /** API may return ownerRegistryTypeDTO (id only) or full investorTypeDTO */
  ownerRegistryTypeDTO?: { id: number; settingValue?: string; configValue?: string }
  investorTypeDTO?: InvestorTypeDTO
  ownerRegistryBankInfoDTOS: any | null
  ownerRegistryUnitDTO: any | null
  deleted: boolean
  enabled: boolean
  taskStatusDTO: any | null

}

export interface PaymentPlanResponse {
  id?: number
  ownppInstallmentNumber: number
  ownppInstallmentDate: string
  ownppBookingAmount: number
  ownerRegistryDTO: {
    id: number
  }
  deleted: boolean
  enabled: boolean
}

// export interface PaymentPlanResponse {
//   id?: number
//   ownppInstallmentNumber: number
//   ownppInstallmentDate: string
//   ownppBookingAmount: number
//   ownerRegistryDTO: {
//     id: number
//   }
//   deleted: boolean
//   enabled: boolean
// }
export interface PayModeDTO {
  id: number
  settingKey: string
  settingValue: string
  languageTranslationDTO: LanguageTranslation | null
  remarks: string | null
  status: string | null
  enabled: boolean
  deleted: boolean | null
}

export interface BankDetailsResponse {
  id: number
  cpbiPayeeName: string
  cpbiPayeeAddress: string
  cpbiBankName: string
  cpbiBankAddress: string
  cpbiBicCode: string
  cpbiBeneRoutingCode: string
  cpbiAccountNumber: string
  ownerRegistryDTO: CapitalPartnerResponse
  payModeDTO: PayModeDTO
  deleted: boolean

  // id: number
  // ownbiPayeeName: string
  // ownbiPayeeAddress: string
  // ownbiBankName: string
  // ownbiBankAddress: string
  // ownbiBicCode: string
  // ownbiBeneRoutingCode: string
  // ownbiAccountNumber: string
  // ownerRegistryDTO: CapitalPartnerResponse
  // payModeDTO: PayModeDTO
  // deleted: boolean
}

export interface UnitStatusDTO {
  id: number
  settingKey: string
  settingValue: string
  languageTranslationDTO: LanguageTranslation | null
  remarks: string | null
  status: string | null
  enabled: boolean
  deleted: boolean | null
}

export interface PropertyIdDTO {
  id: number
  settingKey: string
  settingValue: string
  languageTranslationId: LanguageTranslation | null
  remarks: string | null
  status: string | null
  enabled: boolean
  deleted: boolean
}

export interface managementFirmAssetDTO {
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
  assetRegisterDTO: any | null
  mfStatusDTO: any | null
  mfTypeDTO: any | null
  mfAccountStatusDTO: any | null
  mfConstructionCostCurrencyDTO: any | null
  status: any | null
  mfBlockPaymentTypeDTO: any | null
  deleted: boolean
  taskStatusDTO: any | null
}

export interface CapitalPartnerUnitResponse {
  id: number
  unitRefId: string
  altUnitRefId: string | null
  name: string | null
  isResale: boolean
  resaleDate: string | null
  unitSysId: string | null
  otherFormatUnitNo: string | null
  virtualAccNo: string
  towerName: string
  unitPlotSize: string
  floor: string
  noofBedroom: string
  isModified: boolean
  partnerUnitDTO: any | null
  capitalPartnerUnitTypeDTO: any | null
  managementFirmDTO: managementFirmAssetDTO
  unitStatusDTO: UnitStatusDTO
  propertyIdDTO: PropertyIdDTO
  paymentPlanTypeDTO: any | null
  capitalPartnerUnitBookingDTO: any | null
  childCapitalPartnerUnitDTO: any | null
  ownerRegistryDTOS: any | null
  deleted: boolean
}

export interface CapitalPartnerUnitBookingResponse {
  id: number
  cpubAmountPaid: number | null
  cpubAreaSize: number
  cpubForFeitAmount: number
  cpubDldAmount: number
  cpubRefundAmount: number
  cpubTransferredAmount: number
  cpubRemarks: string
  ownerRegistryUnitDTOS: CapitalPartnerUnitResponse | null
  deleted: boolean
}

export interface CapitalPartnerUnitPurchaseResponse {
  id?: number
  // cpuPurchaseDate: string | null
  // cpupSaleRate: number | null
  // cpuPurchasePrice: number | null
  // ownupUnitRegistrationFee: number | null
  // ownupAgentName: string
  // ownupAgentId: string
  // ownupGrossSaleprice: number
  // ownupVatApplicable: boolean
  // ownupDeedNo: string
  // ownupAgreementNo: string
  // ownupAgreementDate: string
  // ownupSalePurchaseAgreement: boolean
  // ownupWorldCheck: boolean
  // ownupAmtPaidToDevInEscorw: number
  // ownupAmtPaidToDevOutEscorw: number
  // ownupTotalAmountPaid: number
  // cpupUnitIban: string
  // cpupOqood: string | null
  // ownupOqoodPaid: boolean
  // ownupOqoodAmountPaid: string
  // ownupUnitAreaSize: string
  // ownupForfeitAmount: string
  // ownupDldAmount: string
  // ownupRefundAmount: string
  // ownupRemarks: string
  // ownupTransferredAmount: string
  // cpupUnitNoOtherFormat: string
  // ownupSalePrice: number
  // ownupProjectPaymentPlan: boolean
  // ownupReservationBookingForm: boolean
  // ownupModificationFeeNeeded: boolean
  // cpupCreditCurrencyDTO: any | null
  // cpuPurchasePriceCurrencyDTO: any | null
  // ownerRegistryUnitDTO: CapitalPartnerUnitResponse
  // deleted: boolean
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
