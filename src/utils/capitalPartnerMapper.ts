// import { CapitalPartnerRequest } from '../services/api/capitalPartnerService'

// Interface for Step1 form data
export interface Step1FormData {
  investorType: string
  investorId: string
  investorFirstName: string
  investorMiddleName: string
  investorLastName: string
  arabicName: string
  ownership: string
  investorIdType: string
  idNumber: string
  idExpiaryDate: any // Dayjs object
  nationality: string
  accountContact: string
  mobileNumber: string
  email: string
}

// Interface for dropdown option data
export interface DropdownOption {
  id: number
  displayName: string
  settingValue: string
  settingKey?: string
  languageTranslationId?: any
  remarks?: string
  status?: string
  enabled?: boolean
  deleted?: boolean
}

/**
 * Maps Step1 form data to Capital Partner API payload
 */
export function mapStep1ToCapitalPartnerPayload(
  formData: Step1FormData,
  investorTypes: DropdownOption[] = [],
  idTypes: DropdownOption[] = [],
  countries: DropdownOption[] = []
): any {
  // Find the selected options from dropdowns
  const selectedInvestorType = investorTypes.find(
    (type) => type.settingValue === formData.investorType
  )
  const selectedIdType = idTypes.find(
    (type) => type.settingValue === formData.investorIdType
  )
  const selectedCountry = countries.find(
    (country) => country.settingValue === formData.nationality
  )

  // Format the expiry date to ISO string if it exists
  const formatExpiryDate = (date: any): string | undefined => {
    if (!date) return undefined
    try {
      // If it's a Dayjs object
      if (date && typeof date.toISOString === 'function') {
        return date.toISOString()
      }
      // If it's already a string
      if (typeof date === 'string') {
        return new Date(date).toISOString()
      }
      // If it's a Date object
      if (date instanceof Date) {
        return date.toISOString()
      }
    } catch (error) {
      console.warn('Error formatting expiry date:', error)
    }
    return undefined
  }

  // Create the OptionDTO structure with only non-null values
  // Helper kept for future extension; not used currently after payload simplification

  // Build the payload (OWNER_REGISTRY API keys)
  const payload: any = {}

  if (formData.investorId) payload.ownerRegistryId = formData.investorId
  if (formData.investorFirstName) payload.ownerRegistryName = formData.investorFirstName
  if (formData.investorMiddleName) payload.ownerRegistryMiddleName = formData.investorMiddleName
  if (formData.investorLastName) payload.ownerRegistryLastName = formData.investorLastName
  if (formData.ownership) payload.ownerRegistryOwnershipPercentage = parseFloat(formData.ownership)
  if (formData.idNumber) payload.ownerRegistryIdNo = formData.idNumber
  if (formData.accountContact) payload.ownerRegistryTelephoneNo = formData.accountContact
  if (formData.mobileNumber) payload.ownerRegistryMobileNo = formData.mobileNumber
  if (formData.email) payload.ownerRegistryEmail = formData.email
  if (formData.arabicName) payload.ownerRegistryLocaleName = formData.arabicName

  const expiryDate = formatExpiryDate(formData.idExpiaryDate)
  if (expiryDate) payload.idExpiaryDate = expiryDate

  if (selectedIdType) payload.documentTypeDTO = { id: selectedIdType.id }
  if (selectedCountry) payload.countryOptionDTO = { id: selectedCountry.id }
  if (selectedInvestorType) {
    payload.ownerRegistryTypeDTO = { id: selectedInvestorType.id }
    payload.investorTypeDTO = { id: selectedInvestorType.id }
  }

  payload.ownerRegistryOwnerNumber = 1073741824
  payload.isCurrent = true
  payload.deleted = false

  return payload
}

/**
 * Validates Step1 form data before mapping
 */
// Step 1 validation is now handled exclusively by Zod schema in
// `src/lib/validation/capitalPartnerSchemas.ts` and enforced in
// `InvestorStepper/steps/Step1.tsx`.
