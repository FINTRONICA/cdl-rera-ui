'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  FormProvider,
  useForm,
  type Resolver,
  type ResolverResult,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BudgetStep1Schema,
  BudgetStep2Schema,
  type BudgetStep1Data,
  type BudgetStep2Data,
} from '@/lib/validation/budgetSchemas'

import Step1, { type Step1Ref } from './steps/Step1'
import Step2, { type Step2Ref } from './steps/Step2'
import Step3 from './steps/Step3'
import DocumentUploadFactory from '../../DocumentUpload/DocumentUploadFactory'
import { DocumentItem } from '../../DeveloperStepper/developerTypes'

import { useBudgetManagementLabelsWithCache as useBudgetManagementFirmLabelsApi } from '@/hooks/budget/useBudgetManagementLabelsWithCache'
import { useAppStore } from '@/store'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'
import { useIsDarkMode } from '@/hooks/useIsDarkMode'
import { useCreateWorkflowRequest } from '@/hooks/workflow'

type BudgetFormData = BudgetStep1Data &
  BudgetStep2Data & {
    documents?: DocumentItem[]
  }

const BUDGET_FIRM_STEP_STORAGE_KEY = 'budget_management_firm_max_step'
const BASE_PATH = '/budgets/budge-firm'

const stepConfigs = [
  { key: 'details', configId: BUDGET_MANAGEMENT_FIRM_LABELS.STEPS.DETAILS },
  { key: 'documents', configId: BUDGET_MANAGEMENT_FIRM_LABELS.STEPS.DOCUMENTS },
  { key: 'items', configId: BUDGET_MANAGEMENT_FIRM_LABELS.STEPS.BUDGET_ITEMS },
  { key: 'review', configId: BUDGET_MANAGEMENT_FIRM_LABELS.STEPS.REVIEW },
]

// Fallback step labels
const fallbackSteps = [
  'Budget Details',
  'Documents',
  'Budget Items',
  'Review',
]

interface BudgetManagementFirmStepperWrapperProps {
  initialBudgetId?: number | null
  initialStep?: number
  isViewMode?: boolean
}

export default function BudgetManagementFirmStepperWrapper({
  initialBudgetId = null,
  initialStep = 0,
  isViewMode = false,
}: BudgetManagementFirmStepperWrapperProps = {}) {
  const router = useRouter()
  const params = useParams()
  const isDarkMode = useIsDarkMode()

  const { getLabel } = useBudgetManagementFirmLabelsApi()
  const currentLanguage = useAppStore((state) => state.language)

  const [activeStep, setActiveStep] = useState(initialStep)
  const [isSaving, setIsSaving] = useState(false)
  const [budgetId, setBudgetId] = useState<number | null>(initialBudgetId)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const steps = useMemo(
    () =>
      stepConfigs.map((config, index) =>
        getLabel(
          config.configId,
          currentLanguage ?? 'EN',
          fallbackSteps[index] ?? 'Step'
        )
      ),
    [getLabel, currentLanguage]
  )

  const isEditMode = Boolean(budgetId)
  const step1Ref = useRef<Step1Ref>(null)
  const step2Ref = useRef<Step2Ref>(null)

  const createWorkflowRequest = useCreateWorkflowRequest()

  const getMaxAllowedStepIndex = useCallback(
    (id: number | null): number => {
      if (id == null) return 0
      const stored =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem(
            `${BUDGET_FIRM_STEP_STORAGE_KEY}_${id}`
          )
          : null
      const step1Based = Math.min(
        steps.length,
        parseInt(stored || '2', 10)
      )
      return Math.max(0, step1Based - 1)
    },
    [steps.length]
  )

  const setMaxAllowedStep = useCallback(
    (id: number, step1Based: number) => {
      if (typeof window === 'undefined') return
      window.sessionStorage.setItem(
        `${BUDGET_FIRM_STEP_STORAGE_KEY}_${id}`,
        String(step1Based)
      )
    },
    []
  )

  const activeStepRef = useRef(activeStep)
  useEffect(() => {
    activeStepRef.current = activeStep
  }, [activeStep])

  const dynamicResolver: Resolver<BudgetFormData> = useCallback(
    async (
      values: BudgetFormData,
      context: unknown,
      options: Parameters<Resolver<BudgetFormData>>[2]
    ) => {
      const step = activeStepRef.current
      switch (step) {
        case 0:
          return (
            zodResolver(
              BudgetStep1Schema
            ) as unknown as Resolver<BudgetFormData>
          )(values, context, options)
        case 2:
          return (
            zodResolver(
              BudgetStep2Schema
            ) as unknown as Resolver<BudgetFormData>
          )(values, context, options)
        default:
          return {
            values,
            errors: {},
          } as ResolverResult<BudgetFormData>
      }
    },
    []
  )

  const updateURL = useCallback(
    (step: number, id?: number | null) => {
      if (id != null && step >= 0) {
        const queryParam = isViewMode ? '?mode=view' : '?editing=true'
        router.push(`${BASE_PATH}/${id}/step/${step + 1}${queryParam}`)
      } else if (step === 0) {
        router.push(`${BASE_PATH}/new`)
      }
    },
    [router, isViewMode]
  )

  useEffect(() => {
    const idParam = params?.id as string | undefined
    const stepNumberParam = params?.stepNumber as string | undefined
    const id = idParam ? parseInt(idParam, 10) : null
    if (!Number.isNaN(id as number) && id != null) {
      setBudgetId(id)
      if (
        typeof window !== 'undefined' &&
        initialBudgetId != null &&
        id === initialBudgetId
      ) {
        window.sessionStorage.setItem(
          `${BUDGET_FIRM_STEP_STORAGE_KEY}_${id}`,
          String(steps.length)
        )
      }
    } else {
      setBudgetId(null)
    }

    const maxAllowed = getMaxAllowedStepIndex(id ?? null)
    let stepIndex: number
    if (stepNumberParam) {
      const parsed = parseInt(stepNumberParam, 10)
      if (
        !Number.isNaN(parsed) &&
        parsed >= 1 &&
        parsed <= steps.length
      ) {
        stepIndex = parsed - 1
        if (
          !isViewMode &&
          id != null &&
          !Number.isNaN(id) &&
          stepIndex > maxAllowed
        ) {
          stepIndex = maxAllowed
          const queryParam = isViewMode ? '?mode=view' : '?editing=true'
          router.replace(
            `${BASE_PATH}/${id}/step/${stepIndex + 1}${queryParam}`
          )
        }
      } else {
        stepIndex = initialStep
      }
    } else {
      stepIndex = initialStep
    }
    setActiveStep(stepIndex)
  }, [
    params?.id,
    params?.stepNumber,
    initialStep,
    initialBudgetId,
    steps.length,
    getMaxAllowedStepIndex,
    isViewMode,
    router,
  ])

  const methods = useForm<BudgetFormData>({
    resolver: dynamicResolver,
    mode: 'onChange',
    defaultValues: {
      // Step 1: Budget Basic Info
      assetRegisterId: '',
      managementFirmId: '',
      budgetId: '',
      budgetName: '',
      budgetPeriodCode: '',
      propertyGroupId: '',
      propertyManagerEmail: '',
      masterCommunityName: '',
      masterCommunityNameLocale: '',
      isActive: true,

      // Step 2: Budget Items
      budgetCategoryId: '',
      budgetItems: [],

      // Additional fields
      documents: [],
    },
  })

  const handleAsyncStep = async (stepRef: {
    handleSaveAndNext: () => Promise<void>
  }) => {
    try {
      setIsSaving(true)
      await stepRef.handleSaveAndNext()
      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save data'
      setErrorMessage(errorMessage)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const navigateToNextStep = () => {
    const nextStep = activeStep + 1
    const id = budgetId
    if (nextStep < steps.length && id != null) {
      if (activeStep === 1) setMaxAllowedStep(id, 3)
      if (activeStep === 2) setMaxAllowedStep(id, 4)
      setActiveStep(nextStep)
      updateURL(nextStep, id)
    }
  }

  const handleNext = async () => {
    if (isViewMode) {
      navigateToNextStep()
      return
    }

    if (activeStep === 0 && step1Ref.current) {
      const success = await handleAsyncStep(step1Ref.current)
      if (success) {
        navigateToNextStep()
      }
      return
    }

    if (activeStep === 1) {
      navigateToNextStep()
      return
    }

    if (activeStep === 2 && step2Ref.current) {
      const success = await handleAsyncStep(step2Ref.current)
      if (success) {
        navigateToNextStep()
      }
      return
    }

    if (activeStep === 3) {
      navigateToNextStep()
      return
    }

    navigateToNextStep()
  }

  const handleBack = () => {
    const prevStep = activeStep - 1
    if (prevStep >= 0) {
      setActiveStep(prevStep)
      updateURL(prevStep, budgetId)
    }
  }

  const handleReset = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setActiveStep(0)
    setBudgetId(null)
    setIsSaving(false)
    methods.reset()
    router.push(BASE_PATH)
  }

  const onSubmit = () => { }

  const handleStep1SaveAndNext = (data: { id: number }) => {
    if (data?.id) {
      setBudgetId(data.id)
      setMaxAllowedStep(data.id, 2)
      const nextStep = activeStep + 1
      if (nextStep < steps.length) {
        setActiveStep(nextStep)
        updateURL(nextStep, data.id)
      }
    }
  }

  const handleStep2SaveAndNext = () => {
    const nextStep = activeStep + 1
    if (nextStep < steps.length) {
      setActiveStep(nextStep)
      updateURL(nextStep, budgetId)
    }
  }


  const handleDocumentsChange = useCallback(
    (documents: DocumentItem[]) => {
      methods.setValue('documents', documents)
    },
    [methods]
  )

  const handleSubmit = async () => {
    try {
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsSaving(true)

      if (!budgetId) {
        setErrorMessage(
          'Budget ID not found. Please complete Step 1 first.'
        )
        setIsSaving(false)
        return
      }

      const payload = methods.getValues() as unknown as Record<string, unknown>
      await createWorkflowRequest.mutateAsync({
        referenceId: String(budgetId),
        referenceType: 'BUDGET',
        moduleName: 'BUDGET',
        actionKey: 'CREATE',
        amount: 0,
        currency: 'USD',
        payloadJson: payload,
      })

      setSuccessMessage(
        'Budget submitted successfully! Workflow request created.'
      )

      setTimeout(() => {
        router.push(BASE_PATH)
      }, 1500)
    } catch (error) {
      const errorData = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const errorMessage =
        errorData?.response?.data?.message ||
        errorData?.message ||
        'Failed to submit workflow request. Please try again.'
      setErrorMessage(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Step1
            ref={step1Ref}
            onSaveAndNext={handleStep1SaveAndNext}
            isEditMode={isEditMode}
            budgetId={budgetId}
            isViewMode={isViewMode}
          />
        )
      case 1:
        return (
          <DocumentUploadFactory
            type="BUDGET"
            entityId={budgetId?.toString() || ''}
            isOptional={true}
            onDocumentsChange={handleDocumentsChange}
            formFieldName="documents"
            isReadOnly={isViewMode}
          />
        )
      case 2:
        return (
          <Step2
            ref={step2Ref}
            budgetId={budgetId}
            onSaveAndNext={handleStep2SaveAndNext}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
          />
        )
      case 3:
        return (
          <Step3
            budgetId={budgetId}
            isViewMode={isViewMode}
            onEditStep={(stepNumber) => {
              // Navigate to the specified step with editing=true
              if (budgetId) {
                const step = stepNumber + 1 // Step numbers are 0-indexed in component, but 1-indexed in URL
                router.push(`${BASE_PATH}/${budgetId}/step/${step}?editing=true`)
              }
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Box
          sx={{
            width: '100%',
            backgroundColor: isDarkMode ? '#101828' : 'rgba(255, 255, 255, 0.75)',
            borderRadius: '16px',
            paddingTop: '16px',
            border: isDarkMode ? '1px solid rgba(51, 65, 85, 1)' : '1px solid rgba(226, 232, 240, 1)',
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '12px',
                      lineHeight: '100%',
                      letterSpacing: '0.36px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      textTransform: 'uppercase',
                      color: isDarkMode ? '#CBD5E1' : '#4A5565',
                    }}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box
            key={`step-${activeStep}-${budgetId}`}
            sx={{
              my: 4,
              boxShadow: 'none',
              backgroundColor: isDarkMode ? '#101828' : 'rgba(255, 255, 255, 0.75)',
            }}
          >
            {getStepContent(activeStep)}

            <Box
              display="flex"
              justifyContent="space-between"
              sx={{
                mt: 3,
                mx: 6,
                mb: 2,
                backgroundColor: isDarkMode ? '#101828' : 'rgba(255, 255, 255, 0.75)',
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={handleReset}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: 0,
                  color: isDarkMode ? '#93C5FD' : '#155DFC',
                  borderColor: isDarkMode ? '#334155' : '#CAD5E2',
                  '&:hover': {
                    borderColor: isDarkMode ? '#475569' : '#93C5FD',
                    backgroundColor: isDarkMode
                      ? 'rgba(51, 65, 85, 0.3)'
                      : 'rgba(219, 234, 254, 0.3)',
                  },
                }}
              >
                Cancel
              </Button>
              <Box>
                {activeStep !== 0 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outlined"
                    sx={{
                      width: '114px',
                      height: '36px',
                      borderRadius: '6px',
                      backgroundColor: isDarkMode
                        ? 'rgba(30, 58, 138, 0.5)'
                        : '#DBEAFE',
                      color: isDarkMode ? '#93C5FD' : '#155DFC',
                      border: 'none',
                      mr: 2,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      '&:hover': {
                        backgroundColor: isDarkMode
                          ? 'rgba(30, 58, 138, 0.7)'
                          : '#BFDBFE',
                      },
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={
                    activeStep === steps.length - 1
                      ? isViewMode
                        ? () => router.push(BASE_PATH)
                        : handleSubmit
                      : handleNext
                  }
                  variant="contained"
                  disabled={isSaving}
                  sx={{
                    width: isSaving ? '140px' : '114px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? '#2563EB' : '#2563EB',
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    '&.Mui-disabled': {
                      backgroundColor: isDarkMode ? '#1E3A5F' : '#93C5FD',
                      color: '#FFFFFF',
                    },
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#1D4ED8' : '#1E40AF',
                    },
                  }}
                >
                  {isSaving
                    ? 'Saving...'
                    : isViewMode
                      ? activeStep === steps.length - 1
                        ? 'Done'
                        : 'Next'
                      : activeStep === steps.length - 1
                        ? 'Complete'
                        : 'Save & Next'}
                </Button>
              </Box>
            </Box>

            {/* Error and Success Notifications */}
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
      </form>
    </FormProvider>
  )
}
