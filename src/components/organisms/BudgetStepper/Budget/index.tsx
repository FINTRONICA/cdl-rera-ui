'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material'
import { FormProvider, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'

import { useIsDarkMode } from '@/hooks/useIsDarkMode'
import { useCreateWorkflowRequest } from '@/hooks/workflow'
import Step1Component, { type Step1Ref } from './steps/Step1'
import Step2 from './steps/Step2'

import { MASTER_BUDGET_LABELS } from '@/constants/mappings/budgetLabels'
import DocumentUploadFactory from '@/components/organisms/DocumentUpload/DocumentUploadFactory'
import { useBudgetLabelsWithCache } from '@/hooks/budget/useBudgetCategoryLabelsWithCache'

import {
  budgetMasterStep1Schema,
  type BudgetMasterStep1FormValues,
} from '@/lib/validation/budgetSchemas'

interface MasterBudgetStepperWrapperProps {
  initialBudgetId?: string | null
  initialStep?: number
  isReadOnly?: boolean;
}

const defaultValues: BudgetMasterStep1FormValues = {
  chargeTypeId: '',
  chargeType: '',
  groupNameId: '',
  groupName: '',
  categoryCode: '',
  categoryName: '',
  categorySubCode: '',
  categorySubName: '',
  categorySubToSubCode: '',
  categorySubToSubName: '',
  serviceCode: '',
  serviceName: '',
  provisionalBudgetCode: '',
  documents: [],
}

const BUDGET_STEP_STORAGE_KEY = 'budget_category_max_step'

const emptyToNull = (s: string | undefined) =>
  s == null || String(s).trim() === '' ? null : String(s).trim()

const mapFormToPayload = (values: BudgetMasterStep1FormValues) => {
  const chargeTypeId = values.chargeTypeId
  const numId =
    chargeTypeId != null &&
    chargeTypeId !== '' &&
    !Number.isNaN(Number(chargeTypeId))
      ? Number(chargeTypeId)
      : null
  return {
    chargeTypeId: numId,
    chargeType: values.chargeType?.trim() || '',
    serviceChargeGroupId: values.groupNameId ? Number(values.groupNameId) : 0,
    serviceChargeGroupName: values.groupName?.trim() || '',
    categoryCode: values.categoryCode?.trim() || '',
    categoryName: values.categoryName?.trim() || '',
    categorySubCode: emptyToNull(values.categorySubCode),
    categorySubName: emptyToNull(values.categorySubName),
    categorySubToSubCode: emptyToNull(values.categorySubToSubCode),
    categorySubToSubName: emptyToNull(values.categorySubToSubName),
    serviceCode: values.serviceCode?.trim() || '',
    serviceName: values.serviceName?.trim() || '',
    provisionalBudgetCode: values.provisionalBudgetCode?.trim() || '',
    enabled: true,
    deleted: false,
  }
}

function MasterBudgetStepperContent({ 
  initialBudgetId = null,
  initialStep = 0,
  isReadOnly = false 
}: MasterBudgetStepperWrapperProps) {
  const router = useRouter()
  const params = useParams()
  const { getLabel } = useBudgetLabelsWithCache()
  const isDarkMode = useIsDarkMode()

  const [activeStep, setActiveStep] = useState(initialStep)
  const [savedId, setSavedId] = useState<string | null>(initialBudgetId)
  const [isEditMode, setIsEditMode] = useState(Boolean(initialBudgetId))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const step1Ref = React.useRef<Step1Ref>(null)

  const createWorkflowRequest = useCreateWorkflowRequest()

  const methods = useForm<BudgetMasterStep1FormValues>({
    defaultValues,
    resolver: zodResolver(
      budgetMasterStep1Schema
    ) as Resolver<BudgetMasterStep1FormValues>,
    mode: 'onChange',
  })

  const steps = useMemo(
    () => [
      getLabel(
        MASTER_BUDGET_LABELS.STEPS.DETAILS,
        'EN',
        MASTER_BUDGET_LABELS.FALLBACKS.STEPS.DETAILS
      ),
      getLabel(
        MASTER_BUDGET_LABELS.STEPS.DOCUMENTS,
        'EN',
        MASTER_BUDGET_LABELS.FALLBACKS.STEPS.DOCUMENTS
      ),
      getLabel(
        MASTER_BUDGET_LABELS.STEPS.REVIEW,
        'EN',
        MASTER_BUDGET_LABELS.FALLBACKS.STEPS.REVIEW
      ),
    ],
    [getLabel]
  )

  const getMaxAllowedStepIndex = useCallback((budgetId: string | null): number => {
    if (!budgetId) return 0
    const stored = typeof window !== 'undefined'
      ? window.sessionStorage.getItem(`${BUDGET_STEP_STORAGE_KEY}_${budgetId}`)
      : null
    const step1Based = Math.min(steps.length, parseInt(stored || '2', 10))
    return Math.max(0, step1Based - 1)
  }, [steps.length])

  const setMaxAllowedStep = useCallback((budgetId: string, step1Based: number) => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(
      `${BUDGET_STEP_STORAGE_KEY}_${budgetId}`,
      String(step1Based)
    )
  }, [])

  // Sync from URL and enforce step access: do not allow editing URL to skip steps
  useEffect(() => {
    const id = params?.id as string | undefined
    const stepNumber = params?.stepNumber as string | undefined

    if (id) {
      setSavedId(id)
      setIsEditMode(true)
      if (typeof window !== 'undefined' && initialBudgetId && id === initialBudgetId) {
        window.sessionStorage.setItem(`${BUDGET_STEP_STORAGE_KEY}_${id}`, String(steps.length))
      }
    } else {
      setSavedId(null)
      setIsEditMode(false)
    }

    const maxAllowed = getMaxAllowedStepIndex(id ?? null)
    let stepIndex: number

    if (stepNumber) {
      const parsed = parseInt(stepNumber, 10)
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= steps.length) {
        stepIndex = parsed - 1
        if (!isReadOnly && stepIndex > maxAllowed) {
          stepIndex = maxAllowed
          const queryParam = isReadOnly ? '?mode=view' : '?editing=true'
          router.replace(
            `/budgets/budget/${id}/step/${stepIndex + 1}${queryParam}`
          )
        }
      } else {
        stepIndex = initialStep ?? 0
      }
    } else {
      stepIndex = initialStep ?? 0
    }

    setActiveStep(stepIndex)
  }, [
    params?.id,
    params?.stepNumber,
    initialStep,
    initialBudgetId,
    steps.length,
    getMaxAllowedStepIndex,
    isReadOnly,
    router,
  ])

  const updateURL = useCallback(
    (step: number, id?: string | null) => {
      if (id && step >= 0) {
        const queryParam = isReadOnly ? '?mode=view' : '?editing=true'
        router.push(`/budgets/budget/${id}/step/${step + 1}${queryParam}`)
      } else if (step === 0) {
        router.push('/budgets/budget/new')
      }
    },
    [router, isReadOnly]
  )

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

  const navigateToNextStep = (targetId?: string) => {
    const nextStep = activeStep + 1
    const id = targetId || savedId
    if (nextStep < steps.length && id) {
      if (activeStep === 1) setMaxAllowedStep(id, 3)
      setActiveStep(nextStep)
      updateURL(nextStep, id)
    }
  }

  const handleStep1SaveAndNext = (data: { id: string }) => {
    if (data?.id) {
      setSavedId(data.id)
      setIsEditMode(true)
      setMaxAllowedStep(data.id, 2)
      setSuccessMessage('Budget category saved successfully. Proceed to document upload.')
      const nextStep = activeStep + 1
      if (nextStep < steps.length) {
        setActiveStep(nextStep)
        updateURL(nextStep, data.id)
      }
    }
  }

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (isReadOnly) {
      navigateToNextStep()
      return
    }

    if (activeStep === 0) {
      if (!step1Ref.current) {
        setErrorMessage('Form is not ready. Please wait a moment and try again.')
        return
      }
      if (!step1Ref.current.handleSaveAndNext) {
        setErrorMessage('Save function is not available. Please refresh the page.')
        return
      }
      await handleAsyncStep(step1Ref.current)
      return
    }

    if (activeStep === 1) {
      navigateToNextStep()
      return
    }

    navigateToNextStep()
  }

  const handleBack = () => {
    const prevStep = activeStep - 1
    if (prevStep >= 0) {
    setActiveStep(prevStep)
      updateURL(prevStep, savedId)
    }
  }

  const handleReset = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setActiveStep(0)
    setSavedId(null)
    setIsEditMode(false)
    methods.reset(defaultValues)
    router.push('/budgets/budget')
  }


  const handleEdit = () => {
    if (!savedId) {
      setErrorMessage('No budget category ID found to edit.')
      return
    }

    setActiveStep(0)
    updateURL(0, savedId)
      setSuccessMessage('Returned to budget category details.')
  }

  const handleEditDocuments = () => {
    if (!savedId) {
      setErrorMessage('No budget category ID found to manage documents.')
      return
    }

    setActiveStep(1)
    updateURL(1, savedId)
  }

  const onSubmit = () => {
    // Empty handler - actual submission handled by handleSubmit
  }

  const handleSubmit = async () => {
    try {
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsSaving(true)

      if (!savedId) {
        setErrorMessage('Please save the budget category details before submitting.')
        setIsSaving(false)
        return
      }

      const values = methods.getValues()
      const step1Data = {
        ...mapFormToPayload(values),
        id: Number(savedId),
      }

      await createWorkflowRequest.mutateAsync({
        referenceId: savedId,
        referenceType: 'BUDGET_CATEGORY',
        moduleName: 'BUDGET_CATEGORY',
        actionKey: 'CREATE',
        amount: 0,
        currency: 'USD',
        payloadJson: step1Data as unknown as Record<string, unknown>,
      })

      setSuccessMessage(
        'Budget category submitted successfully! Workflow request created.'
      )

      setTimeout(() => {
        router.push('/budgets/budget')
      }, 1500)
    } catch (error) {
      const errorData = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const errorMsg =
        errorData?.response?.data?.message ||
        errorData?.message ||
        'Failed to submit workflow request. Please try again.'
      setErrorMessage(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }


  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Step1Component
            ref={step1Ref}
            key={`${savedId ?? 'new'}-${activeStep}`}
            onSaveAndNext={handleStep1SaveAndNext}
            savedId={savedId}
            isEditMode={isEditMode}
            isReadOnly={isReadOnly}
            refreshKey={activeStep}
          />
        )
      case 1:
        if (!savedId) {
          return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="error">
                {getLabel(
                  MASTER_BUDGET_LABELS.DOCUMENTS.SAVE_HEADING,
                  'EN',
                  MASTER_BUDGET_LABELS.FALLBACKS.DOCUMENTS.SAVE_HEADING
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {getLabel(
                  MASTER_BUDGET_LABELS.DOCUMENTS.SAVE_MESSAGE,
                  'EN',
                  MASTER_BUDGET_LABELS.FALLBACKS.DOCUMENTS.SAVE_MESSAGE
                )}
              </Typography>
            </Box>
          )
        }

        return (
          <DocumentUploadFactory
            type="BUDGET_CATEGORY"
            entityId={savedId}
            isOptional
            isReadOnly={isReadOnly}
            onDocumentsChange={(documents) => {
              methods.setValue('documents', documents)
            }}
          />
        )
      case 2:
        return (
          <Step2
            key={`step2-${savedId || 'new'}-${activeStep}`}
            onEdit={handleEdit}
            onEditDocuments={handleEditDocuments}
            isReadOnly={isReadOnly}
            budgetId={savedId}
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
            position: 'relative',
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
            key={`step-${activeStep}-${savedId}`}
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
                  fontStyle: 'normal',
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
                      gap: '6px',
                      opacity: 1,
                      paddingTop: '2px',
                      paddingRight: '3px',
                      paddingBottom: '2px',
                      paddingLeft: '3px',
                      borderRadius: '6px',
                      backgroundColor: isDarkMode
                        ? 'rgba(30, 58, 138, 0.5)'
                        : '#DBEAFE',
                      color: isDarkMode ? '#93C5FD' : '#155DFC',
                      border: 'none',
                      mr: 2,
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: 0,
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
                      ? isReadOnly
                        ? () => router.push('/budgets/budget')
                        : handleSubmit
                      : handleNext
                  }
                  variant="contained"
                  disabled={isSaving}
                  sx={{
                    width: isSaving ? '140px' : '114px',
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
                    '&.Mui-disabled': {
                      backgroundColor: '#93C5FD',
                      color: '#FFFFFF',
                    },
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#1E40AF' : '#1E40AF',
                    },
                  }}
                >
                  {isSaving
                    ? 'Saving...'
                    : isReadOnly
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

export default function MasterBudgetStepperWrapper({
  initialBudgetId = null,
  initialStep = 0,
  isReadOnly = false,
}: MasterBudgetStepperWrapperProps = {}) {
  return (
    <MasterBudgetStepperContent 
      initialBudgetId={initialBudgetId}
      initialStep={initialStep}
      isReadOnly={isReadOnly} 
    />
  )
}

