import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { formatDate } from '@/utils'
import { ContactData, FeeData, BeneficiaryData } from './developerTypes'
import { DATE_FIELDS, BOOLEAN_FIELDS } from './constants'


export const createDateConverter = (dateField: string) => (data: any): Dayjs | null => {
  const dateValue = data[dateField]
  return dateValue && typeof dateValue === 'string' ? dayjs(dateValue) : null
}


export const createBooleanConverter = (field: string) => (data: any): boolean => {
  const value = data[field]
  if (typeof value === 'string') return value === 'true'
  if (typeof value === 'boolean') return value
  return false
}


export const safeParseInt = (value: string | number | undefined, fallback = 0): number => {
  if (typeof value === 'number') return value
  return parseInt(value?.toString() || '0', 10) || fallback
}


export const processDateFields = (data: any): any => {
  const processed = { ...data }
  DATE_FIELDS.forEach(field => {
    processed[field] = createDateConverter(field)(data)
  })
  return processed
}


export const processBooleanFields = (data: any): any => {
  const processed = { ...data }
  BOOLEAN_FIELDS.forEach(field => {
    processed[field] = createBooleanConverter(field)(data)
  })
  return processed
}


export const processContactData = (contactStepData: any): ContactData[] => {
  if (!contactStepData) return []
  
  // Handle API response structure with content array
  const contentArray = contactStepData.content || contactStepData
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    return []
  }
  
  const mapContactItem = (contact: any): ContactData => {
    const firstName = contact.arcFirstName ?? contact.bpcFirstName ?? ''
    const lastName = contact.arcLastName ?? contact.bpcLastName ?? ''
    const address1 = contact.arcContactAddressLine1 ?? contact.bpcContactAddressLine1 ?? ''
    const address2 = contact.arcContactAddressLine2 ?? contact.bpcContactAddressLine2 ?? ''
    return {
      ...contact,
      name: `${firstName} ${lastName}`.trim() || 'N/A',
      address: `${address1} ${address2}`.trim() || 'N/A',
      email: contact.arcContactEmail ?? contact.bpcContactEmail ?? 'N/A',
      pobox: contact.arcContactPoBox ?? contact.bpcContactPoBox ?? 'N/A',
      countrycode: contact.arcCountryMobCode ?? contact.bpcCountryMobCode ?? 'N/A',
      mobileno: contact.arcContactMobNo ?? contact.bpcContactMobNo ?? 'N/A',
      telephoneno: contact.arcContactTelNo ?? contact.bpcContactTelNo ?? 'N/A',
      fax: contact.arcContactFaxNo ?? contact.bpcContactFaxNo ?? 'N/A',
      arcFirstName: firstName,
      arcLastName: lastName,
      arcContactAddressLine1: address1,
      arcContactAddressLine2: address2,
      arcContactEmail: contact.arcContactEmail ?? contact.bpcContactEmail,
      arcContactPoBox: contact.arcContactPoBox ?? contact.bpcContactPoBox,
      arcCountryMobCode: contact.arcCountryMobCode ?? contact.bpcCountryMobCode,
      arcContactMobNo: contact.arcContactMobNo ?? contact.bpcContactMobNo,
      arcContactTelNo: contact.arcContactTelNo ?? contact.bpcContactTelNo,
      arcContactFaxNo: contact.arcContactFaxNo ?? contact.bpcContactFaxNo,
      ...(contact.assetRegisterDTO && { assetRegisterDTO: contact.assetRegisterDTO }),
      ...(typeof contact.isActive === 'string' && {
        isActive: contact.isActive === 'true',
      }),
    }
  }

  return contentArray.map(mapContactItem)
}


export const processFeeData = (feesStepData: any): FeeData[] => {
  if (!feesStepData) return []
  
  // Handle API response structure with content array
  const contentArray = feesStepData.content || feesStepData
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    return []
  }
  
  const mapFeeItem = (fee: any): FeeData => ({
    ...fee,
    FeeType: fee.bpFeeCategoryDTO?.languageTranslationId?.configValue || 'N/A',
    Frequency: fee.bpFeeFrequencyDTO?.languageTranslationId?.configValue || 'N/A',
    DebitAmount: fee.debitAmount?.toString() || 'N/A',
    Feetobecollected: fee.feeCollectionDate 
      ? formatDate(fee.feeCollectionDate, 'DD/MM/YYYY') 
      : 'N/A',
    NextRecoveryDate: fee.feeNextRecoveryDate 
      ? formatDate(fee.feeNextRecoveryDate, 'DD/MM/YYYY') 
      : 'N/A',
    FeePercentage: fee.feePercentage?.toString() || 'N/A',
    Amount: fee.totalAmount?.toString() || 'N/A',
    VATPercentage: fee.vatPercentage?.toString() || 'N/A',
    ...(typeof fee.enabled === 'string' && {
      isActive: fee.enabled === 'true',
    }),
  })

  return contentArray.map(mapFeeItem)
}


export const processBeneficiaryData = (beneficiaryStepData: any): BeneficiaryData[] => {
  if (!beneficiaryStepData) return []
  
  // Handle API response structure with content array
  const contentArray = beneficiaryStepData.content || beneficiaryStepData
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    return []
  }
  
  const mapBeneficiaryItem = (beneficiary: any): BeneficiaryData => ({
    id: beneficiary.id?.toString() || '',
    transferType: beneficiary.bpbBeneficiaryType || '',
    name: beneficiary.bpbName || '',
    bankName: beneficiary.bpbBankName || '',
    swiftCode: beneficiary.bpbSwiftCode || '',
    routingCode: beneficiary.bpbRoutingCode || '',
    account: beneficiary.bpbAccountNumber || '',
    assetRegisterDTO: beneficiary.assetRegisterDTO,
    assetRegisterDTO: beneficiary.assetRegisterDTO,
    ...(typeof beneficiary.enabled === 'boolean' && {
      enabled: beneficiary.enabled,
    }),
  })

  return contentArray.map(mapBeneficiaryItem)
}


export const processStepData = (activeStep: number, stepStatus: any): any => {

  const currentStepData = stepStatus.stepData[`step${activeStep + 1}`]
  if (!currentStepData) return {}

  let processedData: any = {}


  if (activeStep === 0) {
    processedData = processDateFields(currentStepData)
    processedData = processBooleanFields(processedData)
    

    Object.keys(currentStepData).forEach(key => {
      if (!processedData[key]) {
        processedData[key] = currentStepData[key]
      }
    })
  }


  const stepDataProcessors = {
    contactData: () => processContactData(stepStatus.stepData.step2),
    fees: () => processFeeData(stepStatus.stepData.step3),
    beneficiaries: () => processBeneficiaryData(stepStatus.stepData.step4),
  }

  Object.entries(stepDataProcessors).forEach(([key, processor]) => {
    const result = processor()
    processedData[key] = result
  })

  return processedData
}
