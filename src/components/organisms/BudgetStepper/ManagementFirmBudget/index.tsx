'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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

type BudgetFormData = BudgetStep1Data &
  BudgetStep2Data & {
    documents?: DocumentItem[]
  }

import { useBudgetManagementFirmLabelsApi } from '@/hooks/useBudgetManagementFirmLabelsWithCache'
import { useAppStore } from '@/store'
import { BUDGET_LABELS } from '@/constants/mappings/budgetLabels'

// Step configuration with config IDs for dynamic labels
const stepConfigs = [
  { key: 'details', configId: BUDGET_LABELS.STEPS.DETAILS },
  { key: 'documents', configId: BUDGET_LABELS.STEPS.DOCUMENTS },
  { key: 'items', configId: 'CDL_BDG_STEP_ITEMS' },
  { key: 'review', configId: BUDGET_LABELS.STEPS.REVIEW },
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

  // Get labels from API
  const { getLabel } = useBudgetManagementFirmLabelsApi()
  const currentLanguage = useAppStore((state) => state.language)

  const [activeStep, setActiveStep] = useState(initialStep)
  const [isSaving, setIsSaving] = useState(false)
  const [budgetId, setBudgetId] = useState<number | null>(initialBudgetId)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create dynamic step labels
  const steps = stepConfigs.map((config, index) =>
    getLabel(config.configId, currentLanguage, fallbackSteps[index])
  )

  const isEditMode = Boolean(budgetId)
  const step1Ref = useRef<Step1Ref>(null)
  const step2Ref = useRef<Step2Ref>(null)

  // Keep active step in a ref so the resolver can react to step changes without remounting the form
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

  const updateURL = (step: number, id?: number | null) => {
    if (id && step >= 0) {
      const queryParam = isViewMode ? '?mode=view' : '?editing=true'
      router.push(`/budget/budget-management-firm/${id}/step/${step + 1}${queryParam}`)
    } else if (step === 0) {
      router.push('/budget/budget-management-firm/new')
    }
  }

  useEffect(() => {
    // Read step from path params (stepNumber) instead of query params
    const stepFromPath = params.stepNumber as string | undefined
    if (stepFromPath) {
      const stepNumber = parseInt(stepFromPath) - 1
      if (
        stepNumber !== activeStep &&
        stepNumber >= 0 &&
        stepNumber < steps.length
      ) {
        setActiveStep(stepNumber)
      }
    }
  }, [params.stepNumber, activeStep, steps.length])

  useEffect(() => {
    if (params.id && !budgetId) {
      setBudgetId(parseInt(params.id as string))
    }
  }, [params.id, budgetId])

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
    if (nextStep < steps.length) {
      setActiveStep(nextStep)
      updateURL(nextStep, budgetId)
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
    setActiveStep(0)
    setBudgetId(null)
    setIsSaving(false)
    setErrorMessage(null)
    setSuccessMessage(null)
    methods.reset()
    router.push('/budget/budget-management-firm')
  }

  const onSubmit = () => {}

  const handleStep1SaveAndNext = (data: { id: number }) => {
    if (data && data.id) {
      const nextStep = activeStep + 1
      setBudgetId(data.id)
      setActiveStep(nextStep)
      updateURL(nextStep, data.id)
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

      setSuccessMessage(
        'Budget submitted successfully!'
      )
      router.push('/budget/budget-management-firm')
    } catch (error) {
      const errorData = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const errorMessage =
        errorData?.response?.data?.message ||
        errorData?.message ||
        'Failed to submit budget. Please try again.'
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
                router.push(`/budget/budget-management-firm/${budgetId}/step/${step}?editing=true`)
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
            backgroundColor: '#FFFFFFBF',
            borderRadius: '16px',
            paddingTop: '16px',
            border: '1px solid #FFFFFF',
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
            sx={{ my: 4, backgroundColor: '#FFFFFFBF', boxShadow: 'none' }}
          >
            {getStepContent(activeStep)}

            <Box
              display="flex"
              justifyContent="space-between"
              sx={{ backgroundColor: '#FFFFFFBF', mt: 3, mx: 6, mb: 2 }}
            >
              <Button
                onClick={handleReset}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: 0,
                }}
              >
                Cancel
              </Button>
              <Box>
                {activeStep !== 0 && (
                  <Button
                    onClick={handleBack}
                    sx={{
                      width: '114px',
                      height: '36px',
                      gap: '6px',
                      opacity: 1,
                      paddingTop: '2px',
                      paddingRight: '3px',
                      paddingBottom: '2px',
                      paddingLeft: '3px',
                      borderRadius: '6px',
                      backgroundColor: '#DBEAFE',
                      color: '#155DFC',
                      border: 'none',
                      mr: 2,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: 0,
                    }}
                    variant="outlined"
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={
                    activeStep === steps.length - 1
                      ? isViewMode
                        ? () => router.push('/budget/budget-management-firm')
                        : handleSubmit
                      : handleNext
                  }
                  variant="contained"
                  disabled={isSaving}
                  sx={{
                    width: '114px',
                    height: '36px',
                    gap: '6px',
                    opacity: 1,
                    paddingTop: '2px',
                    paddingRight: '3px',
                    paddingBottom: '2px',
                    paddingLeft: '3px',
                    borderRadius: '6px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: 0,
                  }}
                >
                  {isSaving
                    ? activeStep === steps.length - 1
                      ? 'Submitting...'
                      : 'Saving...'
                    : activeStep === steps.length - 1
                      ? isViewMode
                        ? 'Close'
                        : 'Submit'
                      : isViewMode
                        ? 'Next'
                        : 'Save and Next'}
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
