'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  Alert,
  Snackbar,
  useTheme,
  alpha,
} from '@mui/material'
import Stepper from '@mui/material/Stepper'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  useProjectStepManager,
  useProjectStepStatus,
  useSaveProjectFinancialSummary,
  useSaveProjectClosure,
  useProjectFinancialSummary,
} from '@/hooks/useProjects'
import { convertDatePickerToZonedDateTime } from '@/utils'
import { BankAccountService } from '@/services/api/bankAccountService'
import { realEstateAssetService } from '@/services/api/projectService'
import dayjs from 'dayjs'

import Step1 from './steps/Step1'
import Step2 from './steps/Step2'
import Step3 from './steps/Step3'
import Step4 from './steps/Step4'
import Step5 from './steps/Step5'
import dynamic from 'next/dynamic'
import Step7 from './steps/Step7'
import Step8 from './steps/Step8'

// Lazy load Step6 (Financial/Proforma) - largest component with heavy rendering (~100+ form fields)
// Only loads when step 6 is accessed, reducing initial bundle size
const Step6 = dynamic(() => import('./steps/Step6'), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <GlobalLoading />
    </Box>
  ),
})
import DocumentUploadFactory from '../DocumentUpload/DocumentUploadFactory'
import { DocumentItem } from '../DeveloperStepper/developerTypes'
import { useCreateDeveloperWorkflowRequest } from '@/hooks/workflow'

import { ProjectData } from './types'
import {
  STEPS,
  SKIP_VALIDATION_STEPS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACCOUNT_TYPES,
} from './constants'
import {
  stepperLabelSx,
  loadingContainerSx,
  errorContainerSx,
  formSectionSx,
  buttonContainerSx,
  backButtonSx,
  nextButtonSx,
} from './styles'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalLoading } from '@/components/atoms'
import {
  validateCurrentStep,
  stepRequiresValidation,
} from './utils/stepValidation'
import { getChangedAccounts } from './utils/accountDiff'
import { transformFinancialData } from './utils/financialDataTransform'

export default function StepperWrapper({
  projectId,
  initialStep = 0,
  isViewMode = false,
}: {
  projectId?: string
  initialStep?: number
  isViewMode?: boolean
} = {}) {
  const theme = useTheme()
  const [activeStep, setActiveStep] = useState(initialStep)

  // Sync activeStep with initialStep when it changes (e.g., on page reload with step in URL)
  useEffect(() => {
    if (initialStep !== undefined && initialStep !== activeStep) {
      setActiveStep(initialStep)
    }
  }, [initialStep])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [shouldResetForm, setShouldResetForm] = useState(true)
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [financialSummaryId, setFinancialSummaryId] = useState<number | null>(
    null
  )
  const [projectClosureId, setProjectClosureId] = useState<number | null>(null)

  const router = useRouter()

  const getModeParam = useCallback(() => {
    if (isViewMode) return '?mode=view'
    if (isEditingMode) return '?editing=true'
    return ''
  }, [isViewMode, isEditingMode])

  useEffect(() => {}, [isEditingMode])

  const stepManager = useProjectStepManager()
  const saveFinancialSummary = useSaveProjectFinancialSummary()
  const saveProjectClosure = useSaveProjectClosure()

  const { data: stepStatus, isLoading: isLoadingStepStatus } =
    useProjectStepStatus(projectId || '')
  const createProjectWorkflowRequest = useCreateDeveloperWorkflowRequest()

  const steps = [
    'Management Firm Assest Details',
    'Documents',
    'Account',
    'Fee Details',
    'Beneficiary Details',
    'Payment Plan',
    'Financial',
    'Project Closure',
    'Review',
  ]

  if (typeof window !== 'undefined' && !projectId) {
    try {
      localStorage.removeItem('form_projectStepper_1.0')
      localStorage.removeItem('projectStepper_draft')
    } catch (error) {}
  }

  const methods = useForm<ProjectData>({
    defaultValues: {} as ProjectData,
    mode: 'onChange',
  })

  // Removed useAutoSave/useFormPersistence: data loads directly from APIs

  useEffect(() => {
    if (projectId && (shouldResetForm || activeStep >= 0) && !isAddingContact) {
      if (stepStatus) {
        const currentStepData =
          stepStatus.stepData[
            `step${activeStep + 1}` as keyof typeof stepStatus.stepData
          ]

        if (currentStepData) {
          try {
            let processedData = { ...currentStepData }

            const stepData = currentStepData as any

            if (activeStep === 0) {
              if (
                stepData.mfStartDate &&
                typeof stepData.mfStartDate === 'string'
              ) {
                ;(processedData as any).mfStartDate = dayjs(
                  stepData.mfStartDate
                )
              }
              if (
                stepData.mfCompletionDate &&
                typeof stepData.mfCompletionDate === 'string'
              ) {
                ;(processedData as any).mfCompletionDate = dayjs(
                  stepData.mfCompletionDate
                )
              }
              if (
                stepData.mfRetentionEffectiveDate &&
                typeof stepData.mfRetentionEffectiveDate === 'string'
              ) {
                ;(processedData as any).mfRetentionEffectiveDate = dayjs(
                  stepData.mfRetentionEffectiveDate
                )
              }
              if (
                stepData.mfAccoutStatusDate &&
                typeof stepData.mfAccoutStatusDate === 'string'
              ) {
                ;(processedData as any).mfAccoutStatusDate = dayjs(
                  stepData.mfAccoutStatusDate
                )
              }
              if (
                stepData.mfRegistrationDate &&
                typeof stepData.mfRegistrationDate === 'string'
              ) {
                ;(processedData as any).mfRegistrationDate = dayjs(
                  stepData.mfRegistrationDate
                )
              }

              if (
                stepData.assetRegisterDTO &&
                typeof stepData.assetRegisterDTO === 'object'
              ) {
                // Extract only necessary fields from assetRegisterDTO
                ;(processedData as any).assetRegisterDTO = {
                  id: stepData.assetRegisterDTO.id,
                  arCifrera: stepData.assetRegisterDTO.arCifrera,
                  arName: stepData.assetRegisterDTO.arName,
                  arMasterName: stepData.assetRegisterDTO.arMasterName,
                }

                if (stepData.assetRegisterDTO.arCifrera) {
                  ;(processedData as any).mfCif =
                    stepData.assetRegisterDTO.arCifrera
                }
              }
              // Extract only the id from mfStatusDTO
              if (
                stepData.mfStatusDTO &&
                typeof stepData.mfStatusDTO === 'object'
              ) {
                ;(processedData as any).mfStatusDTO = {
                  id: stepData.mfStatusDTO.id,
                }
              }
              // Extract only the id from mfTypeDTO
              if (
                stepData.mfTypeDTO &&
                typeof stepData.mfTypeDTO === 'object'
              ) {
                ;(processedData as any).mfTypeDTO = {
                  id: stepData.mfTypeDTO.id,
                }
              }
              // Extract only the id from mfAccountStatusDTO
              if (
                stepData.mfAccountStatusDTO &&
                typeof stepData.mfAccountStatusDTO === 'object'
              ) {
                ;(processedData as any).mfAccountStatusDTO = {
                  id: stepData.mfAccountStatusDTO.id,
                }
              }
              // Extract only the id from mfConstructionCostCurrencyDTO
              if (
                stepData.mfConstructionCostCurrencyDTO &&
                typeof stepData.mfConstructionCostCurrencyDTO === 'object'
              ) {
                ;(processedData as any).mfConstructionCostCurrencyDTO = {
                  id: stepData.mfConstructionCostCurrencyDTO.id,
                }
              }
              // Extract only the id from mfBlockPaymentTypeDTO (Restricted Payment Type)
              if (
                stepData.mfBlockPaymentTypeDTO &&
                typeof stepData.mfBlockPaymentTypeDTO === 'object'
              ) {
                ;(processedData as any).mfBlockPaymentTypeDTO = {
                  id: stepData.mfBlockPaymentTypeDTO.id,
                }
              }
            }

            if (activeStep === 2) {
              if (
                (stepData as any).accounts &&
                Array.isArray((stepData as any).accounts)
              ) {
                const normalizeAccountType = (
                  type: string | null | undefined
                ) => {
                  if (!type) {
                    return ''
                  }

                  const formatted = String(type).trim().toUpperCase()

                  switch (formatted) {
                    case 'TRUST':
                    case 'TRUST ACCOUNT':
                      return 'TRUST'
                    case 'RETENTION':
                    case 'RETENTION ACCOUNT':
                      return 'RETENTION'
                    case 'SUBCONSTRUCTION':
                    case 'SUB CONSTRUCTION':
                    case 'SUB-CONSTRUCTION':
                    case 'SUB CONSTRUCTION ACCOUNT':
                    case 'SUB-CONSTRUCTION ACCOUNT':
                      return 'SUBCONSTRUCTION'
                    case 'CORPORATE':
                    case 'CORPORATE ACCOUNT':
                      return 'CORPORATE'
                    default:
                      return formatted
                  }
                }

                const accountsByType = (stepData as any).accounts.reduce(
                  (acc: Record<string, any>, account: any) => {
                    const key = normalizeAccountType(account?.accountType)

                    if (key) {
                      acc[key] = account
                    }

                    return acc
                  },
                  {}
                )

                ;(processedData as any).accounts = ACCOUNT_TYPES.map((type) => {
                  const account = accountsByType[type] || {}

                  return {
                    ...account,
                    id: account.id ?? null,
                    trustAccountNumber:
                      account.accountNumber ||
                      account.trustAccountNumber ||
                      '',
                    currency: account.currencyCode || account.currency || '',
                    accountType: type,
                    dateOpened: account.dateOpened
                      ? dayjs(account.dateOpened)
                      : null,
                  }
                })
              }
            }

            if (activeStep === 3) {
              if (
                (stepData as any).fees &&
                Array.isArray((stepData as any).fees)
              ) {
                const processedFees = (stepData as any).fees.map(
                  (fee: any) => ({
                    id: fee.id?.toString() || '',
                    FeeType:
                      fee.mffCategoryDTO?.languageTranslationId?.configValue ||
                      fee.mffCategoryDTO?.settingValue ||
                      fee.feeType ||
                      fee.FeeType ||
                      '',
                    Frequency:
                      fee.mffFrequencyDTO?.languageTranslationId
                        ?.configValue ||
                      fee.mffFrequencyDTO?.settingValue ||
                      fee.frequency ||
                      fee.Frequency ||
                      'N/A',
                    DebitAmount:
                      fee.mffDebitAmount?.toString() ||
                      fee.debitAmount ||
                      fee.DebitAmount ||
                      '',
                    Feetobecollected:
                      fee.mffCollectionDate ||
                      fee.feeToBeCollected ||
                      fee.Feetobecollected ||
                      '',
                    NextRecoveryDate: fee.mffNextRecoveryDate
                      ? dayjs(fee.mffNextRecoveryDate).format('YYYY-MM-DD')
                      : fee.nextRecoveryDate
                        ? dayjs(fee.nextRecoveryDate).format('YYYY-MM-DD')
                        : fee.NextRecoveryDate || '',
                    FeePercentage:
                      fee.mffFeePercentage?.toString() ||
                      fee.feePercentage ||
                      fee.FeePercentage ||
                      '',
                    Amount:
                      fee.mffTotalAmount?.toString() ||
                      fee.amount ||
                      fee.Amount ||
                      '',
                    VATPercentage:
                      fee.mffVatPercentage?.toString() ||
                      fee.vatPercentage ||
                      fee.VATPercentage ||
                      '',

                    feeType:
                      fee.mffCategoryDTO?.languageTranslationId?.configValue ||
                      fee.mffCategoryDTO?.settingValue ||
                      fee.feeType ||
                      '',
                    frequency:
                      fee.mffFrequencyDTO?.languageTranslationId
                        ?.configValue ||
                      fee.mffFrequencyDTO?.settingValue ||
                      fee.frequency ||
                      'N/A',
                    debitAmount:
                      fee.mffDebitAmount?.toString() || fee.debitAmount || '',
                    feeToBeCollected:
                      fee.mffCollectionDate || fee.feeToBeCollected || '',
                    nextRecoveryDate: fee.mffNextRecoveryDate
                      ? dayjs(fee.mffNextRecoveryDate)
                      : fee.nextRecoveryDate
                        ? dayjs(fee.nextRecoveryDate)
                        : null,
                    feePercentage:
                      fee.mffFeePercentage?.toString() ||
                      fee.feePercentage ||
                      '',
                    amount: fee.mffTotalAmount?.toString() || fee.amount || '',
                    vatPercentage:
                      fee.mffVatPercentage?.toString() ||
                      fee.vatPercentage ||
                      '',
                    currency:
                      fee.mffCurrencyDTO?.languageTranslationId?.configValue ||
                      fee.mffCurrencyDTO?.settingValue ||
                      fee.currency ||
                      '',
                  })
                )

                ;(processedData as any).fees = processedFees
              }
            }

            if (activeStep === 4) {
              if (
                (stepData as any).beneficiaries &&
                Array.isArray((stepData as any).beneficiaries)
              ) {
                const processedBeneficiaries = (
                  stepData as any
                ).beneficiaries.map((beneficiary: any) => {
                  const transferVal =
                    beneficiary.mfbTransferTypeDTO?.languageTranslationId
                      ?.configValue ||
                    beneficiary.mfbTranferTypeDTO?.languageTranslationId
                      ?.configValue ||
                    beneficiary.reabTranferTypeDTO?.languageTranslationId
                      ?.configValue ||
                    ''
                  return {
                    id: beneficiary.id?.toString() || '',
                    mfBeneficiaryId:
                      beneficiary.mfbBeneficiaryId ||
                      beneficiary.mfBeneficiaryId ||
                      beneficiary.reabBeneficiaryId ||
                      beneficiary.beneficiaryId ||
                      '',
                    mfBeneficiaryType:
                      beneficiary.mfBeneficiaryType ||
                      beneficiary.reabType ||
                      beneficiary.beneficiaryType ||
                      transferVal ||
                      '',
                    mfName:
                      beneficiary.mfbName ||
                      beneficiary.mfName ||
                      beneficiary.reabName ||
                      beneficiary.name ||
                      '',
                    mfBankName:
                      beneficiary.mfbBank ||
                      beneficiary.mfBankName ||
                      beneficiary.reabBank ||
                      beneficiary.bankName ||
                      '',
                    mfSwiftCode:
                      beneficiary.mfbSwift ||
                      beneficiary.mfSwiftCode ||
                      beneficiary.reabSwift ||
                      beneficiary.swiftCode ||
                      '',
                    mfRoutingCode:
                      beneficiary.mfbRoutingCode ||
                      beneficiary.mfRoutingCode ||
                      beneficiary.reabRoutingCode ||
                      beneficiary.routingCode ||
                      '',
                    mfAccountNumber:
                      beneficiary.mfbBeneAccount ||
                      beneficiary.mfAccountNumber ||
                      beneficiary.reabBeneAccount ||
                      beneficiary.accountNumber ||
                      '',

                    beneficiaryId:
                      beneficiary.mfbBeneficiaryId ||
                      beneficiary.mfBeneficiaryId ||
                      beneficiary.reabBeneficiaryId ||
                      beneficiary.beneficiaryId ||
                      '',
                    beneficiaryType:
                      beneficiary.mfBeneficiaryType ||
                      beneficiary.reabType ||
                      beneficiary.beneficiaryType ||
                      transferVal ||
                      '',
                    name:
                      beneficiary.mfbName ||
                      beneficiary.mfName ||
                      beneficiary.reabName ||
                      beneficiary.name ||
                      '',
                    bankName:
                      beneficiary.mfbBank ||
                      beneficiary.mfBankName ||
                      beneficiary.reabBank ||
                      beneficiary.bankName ||
                      '',
                    swiftCode:
                      beneficiary.mfbSwift ||
                      beneficiary.mfSwiftCode ||
                      beneficiary.reabSwift ||
                      beneficiary.swiftCode ||
                      '',
                    routingCode:
                      beneficiary.mfbRoutingCode ||
                      beneficiary.mfRoutingCode ||
                      beneficiary.reabRoutingCode ||
                      beneficiary.routingCode ||
                      '',
                    accountNumber:
                      beneficiary.mfbBeneAccount ||
                      beneficiary.mfAccountNumber ||
                      beneficiary.reabBeneAccount ||
                      beneficiary.accountNumber ||
                      '',
                  }
                })
                ;(processedData as any).beneficiaries = processedBeneficiaries
              }
            }

            if (activeStep === 5) {
              if (
                (stepData as any).paymentPlan &&
                Array.isArray((stepData as any).paymentPlan)
              ) {
                ;(processedData as any).paymentPlan = (
                  stepData as any
                ).paymentPlan
              }
            }

            if (activeStep === 6) {
              setShouldResetForm(false)
              return
            }

            methods.reset(processedData)
            setShouldResetForm(false)
            return
          } catch (error) {
            throw error
          }
        }
      }

      const fetchStepDataFromAPI = async () => {
        try {
          let apiData = null
          switch (activeStep) {
            case 0:
              apiData =
                await realEstateAssetService.getProjectDetails(projectId)
              break
            case 1:
              setShouldResetForm(false)
              return
            case 2:
              apiData =
                await realEstateAssetService.getProjectAccounts(projectId)
              break
            case 3:
              apiData = await realEstateAssetService.getProjectFees(projectId)
              break
            case 4:
              apiData =
                await realEstateAssetService.getProjectBeneficiaries(projectId)
              break
            case 5:
              apiData =
                await realEstateAssetService.getProjectPaymentPlans(projectId)
              break
            case 6:
              // Financial data is handled by dedicated useEffect (loadFinancialData)
              // to avoid duplicate API calls and ensure proper data transformation
              setShouldResetForm(false)
              return
            case 7:
              apiData =
                await realEstateAssetService.getProjectClosure(projectId)
              break
            case 8:
              setShouldResetForm(false)
              return
            default:
              setShouldResetForm(false)
              return
          }

          if (apiData) {
            let processedData = apiData

            if (activeStep === 0) {
              processedData = {
                ...apiData,
                mfStartDate: apiData.mfStartDate
                  ? dayjs(apiData.mfStartDate)
                  : null,
                mfCompletionDate: apiData.mfCompletionDate
                  ? dayjs(apiData.mfCompletionDate)
                  : null,
                mfRetentionEffectiveDate: apiData.mfRetentionEffectiveDate
                  ? dayjs(apiData.mfRetentionEffectiveDate)
                  : null,
                mfAccoutStatusDate: apiData.mfAccoutStatusDate
                  ? dayjs(apiData.mfAccoutStatusDate)
                  : null,
                mfRegistrationDate: apiData.mfRegistrationDate
                  ? dayjs(apiData.mfRegistrationDate)
                  : null,
                // Extract only necessary fields from nested DTOs
                assetRegisterDTO: apiData.assetRegisterDTO
                  ? {
                      id: apiData.assetRegisterDTO.id,
                      arCifrera: apiData.assetRegisterDTO.arCifrera,
                      arName: apiData.assetRegisterDTO.arName,
                      arMasterName: apiData.assetRegisterDTO.arMasterName,
                    }
                  : undefined,
                mfStatusDTO: apiData.mfStatusDTO
                  ? { id: apiData.mfStatusDTO.id }
                  : undefined,
                mfTypeDTO: apiData.mfTypeDTO
                  ? { id: apiData.mfTypeDTO.id }
                  : undefined,
                mfAccountStatusDTO: apiData.mfAccountStatusDTO
                  ? { id: apiData.mfAccountStatusDTO.id }
                  : undefined,
                mfConstructionCostCurrencyDTO:
                  apiData.mfConstructionCostCurrencyDTO
                    ? { id: apiData.mfConstructionCostCurrencyDTO.id }
                    : undefined,
                mfBlockPaymentTypeDTO: apiData.mfBlockPaymentTypeDTO
                  ? { id: apiData.mfBlockPaymentTypeDTO.id }
                  : undefined,
              }
            } else if (activeStep === 2) {
              const accountsArray =
                apiData?.content || (Array.isArray(apiData) ? apiData : [])
              const normalizeAccountType = (
                type: string | null | undefined
              ) => {
                if (!type) {
                  return ''
                }

                const formatted = String(type).trim().toUpperCase()

                switch (formatted) {
                  case 'TRUST':
                  case 'TRUST ACCOUNT':
                    return 'TRUST'
                  case 'RETENTION':
                  case 'RETENTION ACCOUNT':
                    return 'RETENTION'
                  case 'SUBCONSTRUCTION':
                  case 'SUB CONSTRUCTION':
                  case 'SUB-CONSTRUCTION':
                  case 'SUB CONSTRUCTION ACCOUNT':
                  case 'SUB-CONSTRUCTION ACCOUNT':
                    return 'SUBCONSTRUCTION'
                  case 'CORPORATE':
                  case 'CORPORATE ACCOUNT':
                    return 'CORPORATE'
                  default:
                    return formatted
                }
              }

              const accountsByType = accountsArray.reduce(
                (acc: Record<string, any>, account: any) => {
                  const key = normalizeAccountType(account?.accountType)

                  if (key) {
                    acc[key] = account
                  }

                  return acc
                },
                {}
              )

              processedData = {
                accounts: ACCOUNT_TYPES.map((type) => {
                  const account = accountsByType[type] || {}

                  return {
                    id: account.id ?? null,
                    trustAccountNumber:
                      account.accountNumber || account.trustAccountNumber || '',
                    ibanNumber: account.ibanNumber || '',
                    dateOpened: account.dateOpened
                      ? dayjs(account.dateOpened)
                      : null,
                    accountTitle: account.accountTitle || '',
                    currency: account.currencyCode || account.currency || '',
                    accountType: type,
                    isValidated: account.isValidated || false,
                    enabled: account.enabled || false,
                  }
                }),
              }
            } else if (activeStep === 3) {
              const feesArray =
                apiData?.content || (Array.isArray(apiData) ? apiData : [])

              const processedFees = feesArray.map((fee: any) => ({
                id: fee.id?.toString() || '',
                FeeType:
                  fee.mffCategoryDTO?.languageTranslationId?.configValue ||
                  fee.mffCategoryDTO?.settingValue ||
                  '',
                Frequency:
                  fee.mffFrequencyDTO?.languageTranslationId?.configValue ||
                  fee.mffFrequencyDTO?.settingValue ||
                  'N/A',
                DebitAmount: fee.mffDebitAmount?.toString() || '',
                Feetobecollected: fee.mffCollectionDate || '',
                NextRecoveryDate: fee.mffNextRecoveryDate
                  ? dayjs(fee.mffNextRecoveryDate).format('YYYY-MM-DD')
                  : '',
                FeePercentage: fee.mffFeePercentage?.toString() || '',
                Amount: fee.mffTotalAmount?.toString() || '',
                VATPercentage: fee.mffVatPercentage?.toString() || '',

                feeType:
                  fee.mffCategoryDTO?.languageTranslationId?.configValue ||
                  fee.mffCategoryDTO?.settingValue ||
                  '',
                frequency:
                  fee.mffFrequencyDTO?.languageTranslationId?.configValue ||
                  fee.mffFrequencyDTO?.settingValue ||
                  'N/A',
                debitAmount: fee.mffDebitAmount?.toString() || '',
                feeToBeCollected: fee.mffCollectionDate || '',
                nextRecoveryDate: fee.mffNextRecoveryDate
                  ? dayjs(fee.mffNextRecoveryDate)
                  : null,
                feePercentage: fee.mffFeePercentage?.toString() || '',
                amount: fee.mffTotalAmount?.toString() || '',
                vatPercentage: fee.mffVatPercentage?.toString() || '',
                currency:
                  fee.mffCurrencyDTO?.languageTranslationId?.configValue ||
                  fee.mffCurrencyDTO?.settingValue ||
                  '',
              }))

              processedData = {
                fees: processedFees,
              }
            } else if (activeStep === 4) {
              const beneficiariesArray =
                apiData?.content || (Array.isArray(apiData) ? apiData : [])
              const transferVal = (b: any) =>
                b.mfbTransferTypeDTO?.languageTranslationId?.configValue ||
                b.mfbTranferTypeDTO?.languageTranslationId?.configValue ||
                b.reabTranferTypeDTO?.languageTranslationId?.configValue ||
                ''
              processedData = {
                beneficiaries: beneficiariesArray.map((beneficiary: any) => ({
                  id: beneficiary.id?.toString() || '',
                  mfBeneficiaryId:
                    beneficiary.mfbBeneficiaryId ||
                    beneficiary.mfBeneficiaryId ||
                    beneficiary.reabBeneficiaryId ||
                    '',
                  mfBeneficiaryType:
                    beneficiary.mfBeneficiaryType || transferVal(beneficiary) || '',
                  mfName:
                    beneficiary.mfbName ||
                    beneficiary.mfName ||
                    beneficiary.reabName ||
                    '',
                  mfBankName:
                    beneficiary.mfbBank ||
                    beneficiary.mfBankName ||
                    beneficiary.reabBank ||
                    '',
                  mfSwiftCode:
                    beneficiary.mfbSwift ||
                    beneficiary.mfSwiftCode ||
                    beneficiary.reabSwift ||
                    '',
                  mfRoutingCode:
                    beneficiary.mfbRoutingCode ||
                    beneficiary.mfRoutingCode ||
                    beneficiary.reabRoutingCode ||
                    '',
                  mfAccountNumber:
                    beneficiary.mfbBeneAccount ||
                    beneficiary.mfAccountNumber ||
                    beneficiary.reabBeneAccount ||
                    '',

                  beneficiaryId:
                    beneficiary.mfbBeneficiaryId ||
                    beneficiary.mfBeneficiaryId ||
                    beneficiary.reabBeneficiaryId ||
                    '',
                  beneficiaryType:
                    beneficiary.mfBeneficiaryType || transferVal(beneficiary) || '',
                  name:
                    beneficiary.mfbName ||
                    beneficiary.mfName ||
                    beneficiary.reabName ||
                    '',
                  bankName:
                    beneficiary.mfbBank ||
                    beneficiary.mfBankName ||
                    beneficiary.reabBank ||
                    '',
                  swiftCode:
                    beneficiary.mfbSwift ||
                    beneficiary.mfSwiftCode ||
                    beneficiary.reabSwift ||
                    '',
                  routingCode:
                    beneficiary.mfbRoutingCode ||
                    beneficiary.mfRoutingCode ||
                    beneficiary.reabRoutingCode ||
                    '',
                  accountNumber:
                    beneficiary.mfbBeneAccount ||
                    beneficiary.mfAccountNumber ||
                    beneficiary.reabBeneAccount ||
                    '',
                })),
              }
            } else if (activeStep === 5) {
              const paymentPlansArray =
                apiData?.content || (Array.isArray(apiData) ? apiData : [])
              processedData = {
                paymentPlan: paymentPlansArray.map((plan: any) => ({
                  id: plan.id?.toString() || '',
                  installmentNumber: plan.mfppInstallmentNumber ?? 0,
                  installmentPercentage: plan.mfppInstallmentPercentage?.toString() ?? '0',
                  projectCompletionPercentage: plan.mfppProjectCompletionPercentage?.toString() ?? '0',
                })),
              }
            } else if (activeStep === 7) {
              const closureData = apiData?.content?.[0] || apiData

              if (closureData?.id) {
                setProjectClosureId(closureData.id)
              }

              processedData = {
                closureData: {
                  totalIncomeFund:
                    closureData?.mfcTotalIncomeFund?.toString() ?? '',
                  totalPayment:
                    closureData?.mfcTotalPayment?.toString() ?? '',
                },
              }
            }

            methods.reset(processedData)
          }

          setShouldResetForm(false)
        } catch (error) {
          setShouldResetForm(false)
        }
      }

      fetchStepDataFromAPI()
    } else {
    }
  }, [
    stepStatus,
    shouldResetForm,
    isAddingContact,
    activeStep,
    methods,
    projectId,
  ])

  useEffect(() => {
    setShouldResetForm(true)
  }, [activeStep])

  useEffect(() => {
    if (activeStep === 3 && projectId && !isAddingContact) {
      const loadFeesData = async () => {
        try {
          const apiData = await realEstateAssetService.getProjectFees(projectId)

          const feesArray =
            (apiData as any)?.content || (Array.isArray(apiData) ? apiData : [])

          if (feesArray.length > 0) {
            const processedFees = feesArray.map((fee: any) => ({
              id: fee.id?.toString() || '',
              FeeType:
                fee.mffCategoryDTO?.languageTranslationId?.configValue ||
                fee.mffCategoryDTO?.settingValue ||
                '',
              Frequency:
                fee.mffFrequencyDTO?.languageTranslationId?.configValue ||
                fee.mffFrequencyDTO?.settingValue ||
                'N/A',
              DebitAmount: fee.mffDebitAmount?.toString() || '',
              Feetobecollected: fee.mffCollectionDate || '',
              NextRecoveryDate: fee.mffNextRecoveryDate
                ? dayjs(fee.mffNextRecoveryDate).format('YYYY-MM-DD')
                : '',
              FeePercentage: fee.mffFeePercentage?.toString() || '',
              Amount: fee.mffTotalAmount?.toString() || '',
              VATPercentage: fee.mffVatPercentage?.toString() || '',

              feeType:
                fee.mffCategoryDTO?.languageTranslationId?.configValue ||
                fee.mffCategoryDTO?.settingValue ||
                '',
              frequency:
                fee.mffFrequencyDTO?.languageTranslationId?.configValue ||
                fee.mffFrequencyDTO?.settingValue ||
                'N/A',
              debitAmount: fee.mffDebitAmount?.toString() || '',
              feeToBeCollected: fee.mffCollectionDate || '',
              nextRecoveryDate: fee.mffNextRecoveryDate
                ? dayjs(fee.mffNextRecoveryDate)
                : null,
              feePercentage: fee.mffFeePercentage?.toString() || '',
              amount: fee.mffTotalAmount?.toString() || '',
              vatPercentage: fee.mffVatPercentage?.toString() || '',
              currency:
                fee.mffCurrencyDTO?.languageTranslationId?.configValue ||
                fee.mffCurrencyDTO?.settingValue ||
                '',
            }))

            methods.setValue('fees', processedFees)
          }
        } catch (error) {
          throw error
        }
      }

      loadFeesData()
    }
  }, [activeStep, projectId, isAddingContact, methods])

  useEffect(() => {
    if (activeStep === 4 && projectId && !isAddingContact) {
      const loadBeneficiariesData = async () => {
        try {
          const apiData =
            await realEstateAssetService.getProjectBeneficiaries(projectId)

          const beneficiariesArray =
            (apiData as any)?.content || (Array.isArray(apiData) ? apiData : [])

          if (beneficiariesArray.length > 0) {
            const transferVal = (b: any) =>
              b.mfbTransferTypeDTO?.languageTranslationId?.configValue ||
              b.mfbTranferTypeDTO?.languageTranslationId?.configValue ||
              b.reabTranferTypeDTO?.languageTranslationId?.configValue ||
              ''
            const processedBeneficiaries = beneficiariesArray.map(
              (beneficiary: any) => ({
                id: beneficiary.id?.toString() || '',
                mfBeneficiaryId:
                  beneficiary.mfbBeneficiaryId ||
                  beneficiary.mfBeneficiaryId ||
                  beneficiary.reabBeneficiaryId ||
                  '',
                mfBeneficiaryType:
                  beneficiary.mfBeneficiaryType || transferVal(beneficiary) || '',
                mfName:
                  beneficiary.mfbName ||
                  beneficiary.mfName ||
                  beneficiary.reabName ||
                  '',
                mfBankName:
                  beneficiary.mfbBank ||
                  beneficiary.mfBankName ||
                  beneficiary.reabBank ||
                  '',
                mfSwiftCode:
                  beneficiary.mfbSwift ||
                  beneficiary.mfSwiftCode ||
                  beneficiary.reabSwift ||
                  '',
                mfRoutingCode:
                  beneficiary.mfbRoutingCode ||
                  beneficiary.mfRoutingCode ||
                  beneficiary.reabRoutingCode ||
                  '',
                mfAccountNumber:
                  beneficiary.mfbBeneAccount ||
                  beneficiary.mfAccountNumber ||
                  beneficiary.reabBeneAccount ||
                  '',

                beneficiaryId:
                  beneficiary.mfbBeneficiaryId ||
                  beneficiary.mfBeneficiaryId ||
                  beneficiary.reabBeneficiaryId ||
                  '',
                beneficiaryType:
                  beneficiary.mfBeneficiaryType || transferVal(beneficiary) || '',
                name:
                  beneficiary.mfbName ||
                  beneficiary.mfName ||
                  beneficiary.reabName ||
                  '',
                bankName:
                  beneficiary.mfbBank ||
                  beneficiary.mfBankName ||
                  beneficiary.reabBank ||
                  '',
                swiftCode:
                  beneficiary.mfbSwift ||
                  beneficiary.mfSwiftCode ||
                  beneficiary.reabSwift ||
                  '',
                routingCode:
                  beneficiary.mfbRoutingCode ||
                  beneficiary.mfRoutingCode ||
                  beneficiary.reabRoutingCode ||
                  '',
                accountNumber:
                  beneficiary.mfbBeneAccount ||
                  beneficiary.mfAccountNumber ||
                  beneficiary.reabBeneAccount ||
                  '',
              })
            )

            methods.setValue('beneficiaries', processedBeneficiaries)
          }
        } catch (error) {
          throw error
        }
      }

      loadBeneficiariesData()
    }
  }, [activeStep, projectId, isAddingContact, methods])

  useEffect(() => {
    if (activeStep === 5 && projectId && !isAddingContact) {
      const loadPaymentPlansData = async () => {
        try {
          const apiData =
            await realEstateAssetService.getProjectPaymentPlans(projectId)

          if (apiData && apiData.length > 0) {
            const processedPaymentPlans = apiData.map((plan: any) => ({
              id: plan.id?.toString() || '',
              installmentNumber: plan.mfppInstallmentNumber ?? 0,
              installmentPercentage: plan.mfppInstallmentPercentage?.toString() ?? '',
              projectCompletionPercentage: plan.mfppProjectCompletionPercentage?.toString() ?? '',
            }))

            methods.setValue('paymentPlan', processedPaymentPlans)
          }
        } catch (error) {
          throw error
        }
      }

      loadPaymentPlansData()
    }
  }, [activeStep, projectId, isAddingContact, methods])

  // Optimized: Use React Query hook with caching for financial data
  const {
    data: financialSummaryApiData,
  } = useProjectFinancialSummary(
    activeStep === 6 && projectId ? projectId : undefined
  )

  // Memoize transformed financial data to prevent recalculation on every render
  const transformedFinancialData = React.useMemo(() => {
    if (!financialSummaryApiData) return null
    const financialData = financialSummaryApiData?.content?.[0] || financialSummaryApiData
    return transformFinancialData(financialData)
  }, [financialSummaryApiData])

  // Load financial data into form when available
  useEffect(() => {
    if (
      activeStep === 6 &&
      projectId &&
      !isAddingContact &&
      transformedFinancialData &&
      financialSummaryApiData
    ) {
      // Extract ID if available
      const financialData = financialSummaryApiData?.content?.[0] || financialSummaryApiData
      if (financialData?.id) {
        setFinancialSummaryId(financialData.id)
      } else {
        console.warn(
          ' Financial data has no ID - financialSummaryId will remain null'
        )
      }

      setShouldResetForm(false)

      // Use transformed data directly
      methods.reset({
        ...methods.getValues(),
        estimate: transformedFinancialData.estimate,
        actual: transformedFinancialData.actual,
        breakdown: transformedFinancialData.breakdown,
        additional: transformedFinancialData.additional,
      } as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeStep,
    projectId,
    isAddingContact,
    transformedFinancialData,
    financialSummaryApiData,
    // Note: methods is intentionally excluded to prevent unnecessary re-renders
    // methods.reset is stable and doesn't need to be in deps
  ])

  useEffect(() => {
    if (activeStep === 0 && projectId && !isAddingContact) {
      const loadProjectDetails = async () => {
        try {
          const apiData =
            await realEstateAssetService.getProjectDetails(projectId)

          if (apiData) {
            const processedProjectData = {
              ...apiData,
              mfStartDate: apiData.mfStartDate
                ? dayjs(apiData.mfStartDate)
                : null,
              mfCompletionDate: apiData.mfCompletionDate
                ? dayjs(apiData.mfCompletionDate)
                : null,
              mfRetentionEffectiveDate: apiData.mfRetentionEffectiveDate
                ? dayjs(apiData.mfRetentionEffectiveDate)
                : null,
              mfAccoutStatusDate: apiData.mfAccoutStatusDate
                ? dayjs(apiData.mfAccoutStatusDate)
                : null,
              mfRegistrationDate: apiData.mfRegistrationDate
                ? dayjs(apiData.mfRegistrationDate)
                : null,
            }

            methods.reset(processedProjectData)
          }
        } catch (error) {
          throw error
        }
      }

      loadProjectDetails()
    }
  }, [activeStep, projectId, isAddingContact, methods])

  useEffect(() => {
    if (activeStep === 7 && projectId && !isAddingContact) {
      const loadClosureData = async () => {
        try {
          const apiData =
            await realEstateAssetService.getProjectClosure(projectId)

          if (apiData) {
            const closureData = apiData?.content?.[0] || apiData

            if (closureData?.id) {
              setProjectClosureId(closureData.id)
            }

            const processedClosureData = {
              totalIncomeFund:
                closureData.mfcTotalIncomeFund?.toString() ?? '',
              totalPayment:
                closureData.mfcTotalPayment?.toString() ?? '',
            }

            methods.setValue(
              'closureData.totalIncomeFund' as any,
              processedClosureData.totalIncomeFund,
              { shouldValidate: false }
            )
            methods.setValue(
              'closureData.totalPayment' as any,
              processedClosureData.totalPayment,
              { shouldValidate: false }
            )
          }
        } catch (error) {
          throw error
        }
      }

      loadClosureData()
    }
  }, [activeStep, projectId, isAddingContact, methods])

  useEffect(() => {
    if (activeStep === 2 && projectId && !isAddingContact) {
      const loadAccountsData = async () => {
        try {
          const apiData =
            await realEstateAssetService.getProjectAccounts(projectId)

          const accountsArray =
            (apiData as any)?.content || (Array.isArray(apiData) ? apiData : [])

          ;(window as any).originalStep2Accounts = []

          if (accountsArray.length > 0) {
            const normalizeAccountType = (type: string | null | undefined) => {
              if (!type) {
                return ''
              }

              const formatted = String(type).trim().toUpperCase()

              switch (formatted) {
                case 'TRUST':
                case 'TRUST ACCOUNT':
                  return 'TRUST'
                case 'RETENTION':
                case 'RETENTION ACCOUNT':
                  return 'RETENTION'
                case 'SUBCONSTRUCTION':
                case 'SUB CONSTRUCTION':
                case 'SUB-CONSTRUCTION':
                case 'SUB CONSTRUCTION ACCOUNT':
                case 'SUB-CONSTRUCTION ACCOUNT':
                  return 'SUBCONSTRUCTION'
                case 'CORPORATE':
                case 'CORPORATE ACCOUNT':
                  return 'CORPORATE'
                default:
                  return formatted
              }
            }

            const accountsByType = accountsArray.reduce(
              (acc: Record<string, any>, account: any) => {
                const key = normalizeAccountType(account?.accountType)

                if (key) {
                  acc[key] = account
                }

                return acc
              },
              {}
            )

            const processedAccounts = ACCOUNT_TYPES.map((type) => {
              const account = accountsByType[type] || {}
              const dateOpened = account.dateOpened
                ? dayjs(account.dateOpened)
                : null

              return {
                id: account.id ?? null,
                trustAccountNumber:
                  account.accountNumber || account.trustAccountNumber || '',
                ibanNumber: account.ibanNumber || '',
                dateOpened,
                accountTitle: account.accountTitle || '',
                currency: account.currencyCode || account.currency || '',
                accountType: type,
                isValidated: account.isValidated || false,
                enabled: account.enabled || false,
              }
            })

            const normalizedOriginalAccounts = processedAccounts.map(
              (account: any) => ({
                id: account.id ?? null,
                accountType: account.accountType || '',
                accountNumber: account.trustAccountNumber || '',
                ibanNumber: account.ibanNumber || '',
                accountTitle: account.accountTitle || '',
                currencyCode: account.currency || '',
                dateOpened: account.dateOpened
                  ? account.dateOpened.format('YYYY-MM-DD')
                  : '',
              })
            )

            ;(window as any).originalStep2Accounts = normalizedOriginalAccounts

            methods.setValue('accounts', processedAccounts)
          } else {
            methods.setValue('accounts', [])
          }
        } catch (error) {
          throw error
        }
      }

      loadAccountsData()
    }
  }, [activeStep, projectId, isAddingContact, methods])

  useEffect(() => {
    if (!projectId) {
      setIsEditingMode(false)
    } else {
      setIsEditingMode(true)
    }
  }, [projectId, isEditingMode])

  // Memoized wrapper component for Step6 to optimize re-renders
  const Step6Wrapper = React.memo(
    ({
      methods,
      isViewMode,
    }: {
      methods: ReturnType<typeof useForm<ProjectData>>
      isViewMode: boolean
    }) => {
      const watchedFinancialData = useWatch({
        control: methods.control,
        name: 'financialData',
      })

      return (
        <Step6
          financialData={watchedFinancialData}
          onFinancialDataChange={(financialData) =>
            methods.setValue('financialData', financialData)
          }
          isViewMode={isViewMode}
        />
      )
    }
  )
  Step6Wrapper.displayName = 'Step6Wrapper'

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1 isViewMode={isViewMode} projectId={projectId} />
      case 1:
        return (
          <DocumentUploadFactory
            type="BUILD_PARTNER_ASSET"
            entityId={projectId || 'temp_project_id'}
            isReadOnly={isViewMode}
            isOptional={true}
            onDocumentsChange={(documents: DocumentItem[]) => {
              methods.setValue('documents', documents)
            }}
            formFieldName="documents"
          />
        )
      case 2:
        const watchedAccounts = methods.watch('accounts')
        return (
          <Step2
            accounts={watchedAccounts}
            onAccountsChange={(accounts) => {
              setIsAddingContact(true)
              methods.setValue('accounts', accounts)
              setTimeout(() => setIsAddingContact(false), 100)
            }}
            projectId={projectId || ''}
            isViewMode={isViewMode}
          />
        )
      case 3:
        const watchedFees = methods.watch('fees')
        const buildPartnerIdForFees = methods
          .watch('assetRegisterDTO.id')
          ?.toString()

        return (
          <Step3
            fees={watchedFees}
            onFeesChange={(fees) => {
              setIsAddingContact(true)
              methods.setValue('fees', fees)
              setTimeout(() => setIsAddingContact(false), 100)
            }}
            projectId={projectId || ''}
            buildPartnerId={buildPartnerIdForFees}
            isViewMode={isViewMode}
          />
        )
      case 4:
        const buildPartnerIdForBeneficiaries = methods
          .watch('assetRegisterDTO.id')
          ?.toString()
        const watchedBeneficiaries = methods.watch('beneficiaries')

        return (
          <Step4
            beneficiaries={watchedBeneficiaries}
            onBeneficiariesChange={(beneficiaries) =>
              methods.setValue('beneficiaries', beneficiaries)
            }
            projectId={projectId || ''}
            buildPartnerId={buildPartnerIdForBeneficiaries}
            isViewMode={isViewMode}
          />
        )
      case 5:
        const watchedPaymentPlan = methods.watch('paymentPlan') || []

        return (
          <Step5
            paymentPlan={watchedPaymentPlan}
            onPaymentPlanChange={(paymentPlan) =>
              methods.setValue('paymentPlan', paymentPlan)
            }
            projectId={projectId || ''}
            isViewMode={isViewMode}
          />
        )
      case 6:
        // Use useWatch hook to prevent unnecessary re-renders
        // Only re-render when financialData actually changes
        return <Step6Wrapper methods={methods} isViewMode={isViewMode} />
      case 7:
        return (
          <Step7
            projectId={projectId || 'temp_project_id'}
            isViewMode={isViewMode}
          />
        )
      case 8:
        return (
          <Step8
            projectData={methods.getValues()}
            onEditStep={handleEditStep}
            projectId={projectId || ''}
            isViewMode={isViewMode}
          />
        )
      default:
        return null
    }
  }

  const transformDetailsData = (formData: ProjectData) => ({
    ...(projectId && { id: projectId }),
    mfId: formData.mfId,
    mfCif: formData.mfCif,
    mfName: formData.mfName,
    mfLocation: formData.mfLocation,
    mfReraNumber: formData.mfReraNumber,
    mfStartDate: formData.mfStartDate
      ? convertDatePickerToZonedDateTime(
          formData.mfStartDate.format('YYYY-MM-DD')
        )
      : null,
    mfCompletionDate: formData.mfCompletionDate
      ? convertDatePickerToZonedDateTime(
          formData.mfCompletionDate.format('YYYY-MM-DD')
        )
      : null,
    mfRegistrationDate: formData.mfRegistrationDate
      ? convertDatePickerToZonedDateTime(
          formData.mfRegistrationDate.format('YYYY-MM-DD')
        )
      : null,
    mfAccoutStatusDate: formData.mfAccoutStatusDate
      ? convertDatePickerToZonedDateTime(
          formData.mfAccoutStatusDate.format('YYYY-MM-DD')
        )
      : null,
    mfConstructionCost:
      typeof formData.mfConstructionCost === 'number'
        ? formData.mfConstructionCost
        : parseFloat(String(formData.mfConstructionCost || '0')),
    mfNoOfUnits:
      typeof formData.mfNoOfUnits === 'number'
        ? formData.mfNoOfUnits
        : parseInt(String(formData.mfNoOfUnits || '0')),
    mfRemarks: formData.mfRemarks,
    mfSpecialApproval: formData.mfSpecialApproval,
    mfManagedBy: formData.mfManagedBy,
    mfBackupUser: formData.mfBackupUser,
    mfTeamLeadName: formData.mfTeamLeadName,
    mfRelationshipManagerName: formData.mfRelationshipManagerName,
    mfAssestRelshipManagerName: formData.mfAssestRelshipManagerName,
    mfLandOwnerName: formData.mfLandOwnerName,
    mfRetentionPercent: formData.mfRetentionPercent,
    mfAdditionalRetentionPercent: formData.mfAdditionalRetentionPercent,
    mfTotalRetentionPercent: formData.mfTotalRetentionPercent,
    mfRetentionEffectiveDate: formData.mfRetentionEffectiveDate
      ? convertDatePickerToZonedDateTime(
          formData.mfRetentionEffectiveDate.format('YYYY-MM-DD')
        )
      : null,
    mfManagementExpenses: formData.mfManagementExpenses,
    mfMarketingExpenses: formData.mfMarketingExpenses,
    mfRealEstateBrokerExp:
      typeof formData.mfRealEstateBrokerExp === 'number'
        ? formData.mfRealEstateBrokerExp
        : parseFloat(String(formData.mfRealEstateBrokerExp || '0')),
    mfAdvertisementExp:
      typeof formData.mfAdvertisementExp === 'number'
        ? formData.mfAdvertisementExp
        : parseFloat(String(formData.mfAdvertisementExp || '0')),
    mfPercentComplete: formData.mfPercentComplete,
    mfConstructionCostCurrencyDTO: {
      id:
        parseInt(
          formData.mfConstructionCostCurrencyDTO?.id?.toString() || '32'
        ) || 32,
    },
    assetRegisterDTO: {
      id: parseInt(formData.assetRegisterDTO?.id?.toString() || '501') || 501,
    },
    mfStatusDTO: {
      id: parseInt(formData.mfStatusDTO?.id?.toString() || '53') || 53,
    },
    mfTypeDTO: {
      id: parseInt(formData.mfTypeDTO?.id?.toString() || '51') || 51,
    },
    mfAccountStatusDTO: {
      id: parseInt(formData.mfAccountStatusDTO?.id?.toString() || '55') || 55,
    },
    mfBlockPaymentTypeDTO: formData.mfBlockPaymentTypeDTO?.id
      ? {
          id: parseInt(formData.mfBlockPaymentTypeDTO.id.toString()),
        }
      : null,
    status: formData.status || 'ACTIVE',
    enabled: true,
    deleted: false,
  })

  const handleViewNext = useCallback(() => {
    if (activeStep < steps.length - 1) {
      const nextStep = activeStep + 1
      setActiveStep(nextStep)

      if (projectId) {
        const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}&mode=view`
        router.push(targetUrl)
      }
    } else {
      router.push('/management-firms')
    }
  }, [activeStep, steps.length, projectId, router])

  const handleViewBack = useCallback(() => {
    if (activeStep > 0) {
      const prevStep = activeStep - 1
      setActiveStep(prevStep)

      if (projectId) {
        const targetUrl = `/management-firms/${projectId}?step=${prevStep + 1}&mode=view`
        router.push(targetUrl)
      }
    }
  }, [activeStep, projectId, router])

  const handleSaveAndNext = useCallback(async () => {
    if (isViewMode) {
      handleViewNext()
      return
    }

    try {
      setErrorMessage(null)
      setSuccessMessage(null)

      // Check for unsaved changes in Step 5 (Payment Plan)
      if (activeStep === 5) {
        const step5State = (window as any).step5ValidationState || {}
        if (step5State.hasUnsavedChanges) {
          setErrorMessage(
            'You have unsaved installment data. Please save all rows (click the ✓ icon) or cancel editing (click the ✗ icon) before proceeding.'
          )
          setTimeout(() => setErrorMessage(null), 5000)
          return
        }
      }

      if (stepRequiresValidation(activeStep)) {
        const { isValid } = await validateCurrentStep(methods, activeStep)

        if (!isValid) {
          setErrorMessage(
            'Please fix the validation errors highlighted in the form below.'
          )
          setTimeout(() => setErrorMessage(null), 3000)
          return
        }
      }

      const currentFormData = methods.getValues()

      if (SKIP_VALIDATION_STEPS.includes(activeStep as 1 | 3 | 4)) {
        const nextStep = activeStep + 1
        setActiveStep(nextStep)

        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (activeStep >= steps.length - 1) {
        try {
          const projectIdFromStatus =
            stepStatus?.stepData?.step1?.id?.toString()
          const step1Data = stepStatus?.stepData?.step1

          if (!projectIdFromStatus || !step1Data) {
            setErrorMessage(
              'No Management Firm data available - check stepStatus'
            )
            return
          }

          await createProjectWorkflowRequest.mutateAsync({
            referenceId: projectIdFromStatus,
            payloadData: step1Data as unknown as Record<string, unknown>,
            referenceType: 'MANAGEMENT_FIRMS',
            moduleName: 'MANAGEMENT_FIRMS',
            actionKey: 'CREATE',
          })

          setSuccessMessage(
            'Management Firm registration submitted successfully! Workflow request created.'
          )
          router.push('/management-firms')
          return
        } catch (error) {
          setErrorMessage(
            'Failed to submit workflow request. Please try again.'
          )
          return
        }
      }

      if (activeStep === 1) {
        const nextStep = activeStep + 1
        setActiveStep(nextStep)

        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (activeStep === 3) {
        const nextStep = activeStep + 1
        setActiveStep(nextStep)

        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (activeStep === 4) {
        const nextStep = activeStep + 1
        setActiveStep(nextStep)

        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (SKIP_VALIDATION_STEPS.includes(activeStep as 1 | 3 | 4)) {
        const nextStep = activeStep + 1
        setActiveStep(nextStep)

        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (activeStep === 2) {
        try {
          const validatedAccounts = (window as any).step2ValidatedAccounts || []
          const accountsArray = Array.isArray(validatedAccounts)
            ? validatedAccounts
            : []
          const accountsToSave = accountsArray.filter(
            (account: any) => account && account.isValidated
          )

          if (accountsToSave.length === 0) {
            setErrorMessage(ERROR_MESSAGES.NO_VALIDATED_ACCOUNTS)
            return
          }

          const originalAccounts = (window as any).originalStep2Accounts || []
          const changedAccounts = getChangedAccounts(
            accountsToSave,
            originalAccounts
          )

          if (changedAccounts.length === 0) {
            setSuccessMessage('No account changes detected.')
            const nextStep = activeStep + 1
            setActiveStep(nextStep)

            if (projectId) {
              const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
              router.push(targetUrl)
            }
            return
          }

          const accountsToProcess = changedAccounts.map((account: any) => ({
            ...account,

            dateOpened: account.dateOpened
              ? convertDatePickerToZonedDateTime(account.dateOpened)
              : account.dateOpened,
          }))

          const saveResults = []
          const errors = []

          for (let i = 0; i < accountsToProcess.length; i++) {
            const account = accountsToProcess[i]
            try {
              let result
              if (isEditingMode && account.id) {
                result = await BankAccountService.updateBankAccount(account)
              } else {
                result = await BankAccountService.saveBankAccount(account)
              }
              saveResults.push(result)
            } catch (error) {
              errors.push({
                accountIndex: i + 1,
                account: account,
                error: error,
              })
            }
          }

          if (errors.length > 0) {
            return
          }

          setSuccessMessage(SUCCESS_MESSAGES.ACCOUNTS_SAVED)

          const currentAccountsSnapshot = methods.getValues('accounts') || []
          const normalizedSnapshot = currentAccountsSnapshot.map(
            (account: any) => ({
              id: account.id ?? null,
              accountType: account.accountType || '',
              accountNumber: account.trustAccountNumber || '',
              ibanNumber: account.ibanNumber || '',
              accountTitle: account.accountTitle || '',
              currencyCode: account.currency || '',
              dateOpened: account.dateOpened
                ? account.dateOpened.format?.('YYYY-MM-DD') ||
                  new Date(account.dateOpened).toISOString().split('T')[0]
                : '',
            })
          )

          ;(window as any).originalStep2Accounts = normalizedSnapshot

          const nextStep = activeStep + 1
          setActiveStep(nextStep)

          if (projectId) {
            const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
            router.push(targetUrl)
          }
          return
        } catch (error) {
          setErrorMessage(ERROR_MESSAGES.ACCOUNT_SAVE_FAILED)
          return
        }
      }

      if (activeStep === 5) {
        // Check payment plan validation before proceeding
        const step5Validation = (window as any).step5ValidationState
        if (step5Validation && !step5Validation.isValid) {
          setErrorMessage(
            'Payment plan percentages exceed 100%. Please adjust the values before proceeding.'
          )
          setTimeout(() => setErrorMessage(null), 5000)
          return
        }

        const nextStep = activeStep + 1
        setActiveStep(nextStep)
        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (activeStep === 6) {
        const financialData = {
          estimate: (currentFormData as any).estimate || {},
          actual: (currentFormData as any).actual || {},
          breakdown: (currentFormData as any).breakdown || {},
          additional: (currentFormData as any).additional || {},
        }

        if (isEditingMode && financialSummaryId) {
          await saveFinancialSummary.mutateAsync({
            financialData: financialData,
            projectId: financialSummaryId.toString(),
            isEdit: true,
            realProjectId: projectId,
          } as any)
        } else {
          await stepManager.saveStep(6, financialData, projectId, false)
        }
        setSuccessMessage('Financial Summary saved successfully')
        const nextStep = 7
        setActiveStep(nextStep)
        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      if (activeStep === 7) {
        const closureData = currentFormData.closureData

        if (isEditingMode && projectClosureId) {
          await saveProjectClosure.mutateAsync({
            data: closureData,
            projectId: projectClosureId.toString(),
            isEdit: true,
            realProjectId: projectId,
          } as any)
        } else {
          await stepManager.saveStep(7, closureData, projectId, false)
        }

        setSuccessMessage('Asset Closure saved successfully')
        const nextStep = 8
        setActiveStep(nextStep)
        if (projectId) {
          const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`
          router.push(targetUrl)
        }
        return
      }

      const stepSpecificData = transformDetailsData(currentFormData)

      if (stepRequiresValidation(activeStep)) {
        const { isValid } = await validateCurrentStep(methods, activeStep)
        if (!isValid) {
          return
        }
      }

      const saveResponse = await stepManager.saveStep(
        activeStep + 1,
        stepSpecificData,
        projectId,
        isEditingMode
      )

      setSuccessMessage(SUCCESS_MESSAGES.STEP_SAVED)

      if (activeStep < STEPS.length - 1) {
        if (activeStep === 0) {
          const savedProjectId =
            (saveResponse as any)?.data?.id || (saveResponse as any)?.id

          const targetProjectId = isEditingMode
            ? projectId
            : savedProjectId || projectId

          if (targetProjectId) {
            const targetUrl = `/management-firms/${targetProjectId}?step=2${getModeParam()}`

            setActiveStep(1)
            router.push(targetUrl)
          } else {
            setActiveStep((prev) => prev + 1)
          }
        } else {
          const nextStep = activeStep + 1

          setActiveStep(nextStep)

          if (projectId) {
            const targetUrl = `/management-firms/${projectId}?step=${nextStep + 1}${getModeParam()}`

            router.push(targetUrl)
          }
        }
      } else {
        try {
          const projectIdFromStatus =
            stepStatus?.stepData?.step1?.id?.toString()
          const step1Data = stepStatus?.stepData?.step1

          if (!projectIdFromStatus || !step1Data) {
            setErrorMessage(
                'No Management Firm data available - check stepStatus'
            )
            return
          }

          await createProjectWorkflowRequest.mutateAsync({
            referenceId: projectIdFromStatus,
            payloadData: step1Data as unknown as Record<string, unknown>,
            referenceType: 'MANAGEMENT_FIRMS',
            moduleName: 'MANAGEMENT_FIRMS',
            actionKey: 'CREATE',
          })

          setSuccessMessage(
            'Management Firm registration submitted successfully! Workflow request created.'
          )
          router.push('/management-firms')
        } catch (error) {
          setErrorMessage(
            'Failed to submit workflow request. Please try again.'
          )
        }
        router.push('/management-firms')
        setSuccessMessage(SUCCESS_MESSAGES.ALL_STEPS_COMPLETED)
      }
    } catch (error: unknown) {
      const errorData = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const errorMessage =
        errorData?.response?.data?.message ||
        errorData?.message ||
        ERROR_MESSAGES.SAVE_FAILED
      setErrorMessage(errorMessage)
    }
  }, [activeStep, methods, stepManager, projectId, router, isEditingMode])

  const handleBack = useCallback(() => {
    if (isViewMode) {
      handleViewBack()
      return
    }

    if (activeStep > 0) {
      const previousStep = activeStep - 1
      setActiveStep(previousStep)

      if (projectId) {
        const targetUrl = `/management-firms/${projectId}?step=${previousStep + 1}${getModeParam()}`
        router.push(targetUrl)
      }
    }
  }, [activeStep, projectId, router, isViewMode, handleViewBack, getModeParam])

  const handleReset = useCallback(() => {
    router.push('/management-firms')
  }, [router])

  const handleEditStep = useCallback(
    (stepNumber: number) => {
      setActiveStep(stepNumber)
      setIsEditingMode(true)
      setShouldResetForm(true)
      setSuccessMessage(`Now editing step ${stepNumber + 1} data`)

      if (projectId) {
        const targetUrl = `/management-firms/${projectId}?step=${stepNumber + 1}${getModeParam()}`
        router.push(targetUrl)
      }
    },
    [setShouldResetForm, projectId, router, stepStatus, getModeParam]
  )

  const onSubmit = (_data: ProjectData) => {}

  if (isLoadingStepStatus && projectId) {
    return (
      <Box sx={loadingContainerSx}>
        <GlobalLoading fullHeight />
      </Box>
    )
  }

  try {
    return (
      <ErrorBoundary>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit((data: ProjectData) =>
              onSubmit(data)
            )}
          >
            <Box
              sx={{
                width: '100%',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? '#111827' 
                  : alpha('#FFFFFF', 0.75),
                borderRadius: '16px',
                paddingTop: '16px',
                border: theme.palette.mode === 'dark' 
                  ? `1px solid ${alpha('#FFFFFF', 0.2)}` 
                  : '1px solid #FFFFFF',
              }}
            >
              <Stepper activeStep={activeStep} alternativeLabel>
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>
                      <Typography variant="caption" sx={stepperLabelSx}>
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={formSectionSx}>
                {getStepContent(activeStep)}

                <Box
                  display="flex"
                  justifyContent="space-between"
                  sx={buttonContainerSx}
                >
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    sx={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: 0,
                      color: theme.palette.mode === 'dark' 
                        ? theme.palette.text.primary 
                        : theme.palette.text.primary,
                      borderColor: theme.palette.mode === 'dark' 
                        ? alpha('#FFFFFF', 0.3) 
                        : theme.palette.divider,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? alpha('#FFFFFF', 0.5) 
                          : theme.palette.divider,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha('#FFFFFF', 0.1) 
                          : alpha('#000000', 0.04),
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Box>
                    {activeStep !== 0 && (
                      <Button
                        onClick={handleBack}
                        variant="outlined"
                        sx={[
                          typeof backButtonSx === 'function' ? backButtonSx(theme) : backButtonSx,
                          { mr: 2 },
                        ]}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveAndNext}
                      variant="contained"
                      disabled={
                        !isViewMode &&
                        (stepManager.isLoading ||
                          createProjectWorkflowRequest.isPending)
                      }
                      sx={typeof nextButtonSx === 'function' ? nextButtonSx(theme) : nextButtonSx}
                    >
                      {isViewMode
                        ? activeStep === steps.length - 1
                          ? 'Finish'
                          : 'Next'
                        : stepManager.isLoading ||
                            createProjectWorkflowRequest.isPending
                          ? activeStep === steps.length - 1
                            ? 'Submitting...'
                            : 'Saving...'
                          : activeStep === steps.length - 1
                            ? 'Complete'
                            : 'Save & Next'}
                    </Button>
                  </Box>

                  <Snackbar
                    open={!!errorMessage}
                    autoHideDuration={6000}
                    onClose={() => setErrorMessage(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  >
                    <Alert
                      onClose={() => setErrorMessage(null)}
                      severity="error"
                      sx={{ width: '100%' }}
                    >
                      {errorMessage}
                    </Alert>
                  </Snackbar>

                  <Snackbar
                    open={!!successMessage}
                    autoHideDuration={3000}
                    onClose={() => setSuccessMessage(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  >
                    <Alert
                      onClose={() => setSuccessMessage(null)}
                      severity="success"
                      sx={{ width: '100%' }}
                    >
                      {successMessage}
                    </Alert>
                  </Snackbar>
                </Box>
              </Box>
            </Box>
          </form>
        </FormProvider>
      </ErrorBoundary>
    )
  } catch (error) {
    return (
      <Box sx={errorContainerSx}>
        <Typography color="error">
          Error rendering form:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </Typography>
      </Box>
    )
  }
}
