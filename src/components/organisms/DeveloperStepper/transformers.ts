import { useMemo } from 'react'
import { convertDatePickerToZonedDateTime } from '@/utils'
import { ProjectData } from './developerTypes'
import { safeParseInt } from './utils'


export const useStepDataTransformers = () => {
  return useMemo(() => ({
    1: (formData: ProjectData) => ({
      arDeveloperId: formData.arDeveloperId,
      arCifrera: formData.arCifrera,
      arDeveloperRegNo: formData.arDeveloperRegNo,
      arName: formData.arName,
      arMasterName: formData.arMasterName,
      arNameLocal: formData.arNameLocal,
      arOnboardingDate: formData.arOnboardingDate
        ? typeof formData.arOnboardingDate === 'string'
          ? formData.arOnboardingDate
          : convertDatePickerToZonedDateTime(formData.arOnboardingDate.format('YYYY-MM-DD'))
        : null,
      arContactAddress: formData.arContactAddress,
      arContactTel: formData.arContactTel,
      arPoBox: formData.arPoBox,
      arMobile: formData.arMobile,
      arFax: formData.arFax,
      arEmail: formData.arEmail,
      arLicenseNo: formData.arLicenseNo,
      arLicenseExpDate: formData.arLicenseExpDate
        ? typeof formData.arLicenseExpDate === 'string'
          ? formData.arLicenseExpDate
          : convertDatePickerToZonedDateTime(formData.arLicenseExpDate.format('YYYY-MM-DD'))
        : null,
      arWorldCheckFlag: formData.arWorldCheckFlag,
      arWorldCheckRemarks: formData.arWorldCheckRemarks,
      arMigratedData: formData.arMigratedData,
      arRemark: formData.arRemark,
      arRegulatorId: formData.arRegulatorDTO?.id || (formData as any).arRegulatorId,
      arRegulatorDTO: {
        id: safeParseInt(formData.arRegulatorDTO?.id),
      },
      arProjectName: formData.arProjectName,
      arCompanyNumber: formData.arCompanyNumber,
      arMasterCommunity: formData.arMasterCommunity,
      arMasterDeveloper: formData.arMasterDeveloper,
    }),
    2: (formData: ProjectData) => {
      const contact = formData.contactData?.[0]
      if (!contact) {
        throw new Error('Contact data is required for step 2')
      }
      const name = (contact as any).arcFirstName != null
        ? `${(contact as any).arcFirstName || ''} ${(contact as any).arcLastName || ''}`.trim()
        : contact.name || ''
      const address = (contact as any).arcContactAddressLine1 != null
        ? `${(contact as any).arcContactAddressLine1 || ''} ${(contact as any).arcContactAddressLine2 || ''}`.trim()
        : contact.address || ''
      return {
        arcFirstName: (contact as any).arcFirstName ?? contact.name?.split(' ')[0] ?? '',
        arcLastName: (contact as any).arcLastName ?? contact.name?.split(' ').slice(1).join(' ') ?? '',
        arcContactEmail: (contact as any).arcContactEmail ?? contact.email ?? '',
        arcContactAddressLine1: (contact as any).arcContactAddressLine1 ?? address ?? '',
        arcContactAddressLine2: (contact as any).arcContactAddressLine2 ?? '',
        arcContactPoBox: (contact as any).arcContactPoBox ?? contact.pobox ?? '',
        arcCountryMobCode: (contact as any).arcCountryMobCode ?? contact.countrycode ?? '',
        arcContactTelNo: (contact as any).arcContactTelNo ?? contact.telephoneno ?? '',
        arcContactMobNo: (contact as any).arcContactMobNo ?? contact.mobileno ?? '',
        arcContactFaxNo: (contact as any).arcContactFaxNo ?? contact.fax ?? '',
        assetRegisterDTO: formData.arDeveloperId ? { id: parseInt(formData.arDeveloperId) } : undefined,
      }
    },
    3: (formData: ProjectData) => ({
      feeStructure: {
        setupFee: parseFloat(formData.fees?.[0]?.amount || '0'),
        transactionFee: parseFloat(formData.fees?.[0]?.feePercentage || '0'),
        monthlyFee: parseFloat(formData.fees?.[0]?.debitAmount || '0'),
      },
      collectionMethod: formData.paymentType || 'manual',
      paymentTerms: formData.fees?.[0]?.frequency || '',
    }),
    4: (formData: ProjectData) => ({
      bpbBeneficiaryId: formData.beneficiaries?.[0]?.id || '',
      bpbBeneficiaryType: formData.beneficiaries?.[0]?.transferType || 'RTGS',
      bpbName: formData.beneficiaries?.[0]?.name || '',
      bpbBankName: formData.beneficiaries?.[0]?.bankName || '',
      bpbSwiftCode: formData.beneficiaries?.[0]?.swiftCode || '',
      bpbRoutingCode: formData.beneficiaries?.[0]?.routingCode || '',
      bpbAccountNumber: formData.beneficiaries?.[0]?.account || '',
      enabled: true,
    }),
    5: (formData: ProjectData) => ({
      reviewData: formData,
      termsAccepted: true,
    }),
  }), [])
}


export const transformStepData = (
  step: number, 
  formData: ProjectData, 
  transformers: ReturnType<typeof useStepDataTransformers>
) => {
  const transformer = transformers[step as keyof typeof transformers]
  if (!transformer) {
    throw new Error(`Invalid step: ${step}`)
  }
  return transformer(formData)
}
