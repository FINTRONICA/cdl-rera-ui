'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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
import type { Theme } from '@mui/material/styles'
import {
  FormProvider,
  useForm,
  type Resolver,
  type ResolverResult,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CapitalPartnerStep1Schema,
  CapitalPartnerStep2Schema,
  // CapitalPartnerStep4Schema,
  type CapitalPartnerStep1Data,
  type CapitalPartnerStep2Data,
} from '@/lib/validation/capitalPartnerSchemas'

import Step1, { type Step1Ref } from './steps/Step1'
import Step2, { type Step2Ref } from './steps/Step2'
import Step3, { type Step3Ref } from './steps/Step3'
// import Step4, { type Step4Ref } from './steps/Step4'
import Step5 from './steps/Step5'
import DocumentUploadFactory from '../DocumentUpload/DocumentUploadFactory'
import { DocumentItem } from '../DeveloperStepper/developerTypes'
import {
  outerContainerSx,
  formSectionSx,
  buttonContainerSx,
  stepperLabelSx,
  backButtonSx,
  nextButtonSx,
  cancelButtonSx,
} from './styles'

type CapitalPartnerFormData = CapitalPartnerStep1Data &
  CapitalPartnerStep2Data & {
    // Add other step data types as needed
    documents?: any[]
    paymentPlan?: any[]
  }
import { useCreateDeveloperWorkflowRequest } from '@/hooks/workflow'
import { useCapitalPartnerLabelsApi } from '@/hooks/useCapitalPartnerLabelsApi'
import { useAppStore } from '@/store'

// Step configuration with config IDs for dynamic labels (OWNER_REGISTRY)
const stepConfigs = [
  { key: 'basic', configId: 'CDL_OWNER_BASIC_INFO' },
  { key: 'documents', configId: 'CDL_OWNER_DOCUMENTS' },
  { key: 'unit', configId: 'CDL_OWNER_UNIT_DETAILS' },
  { key: 'payment', configId: 'CDL_OWNER_UNIT_PAYMENT_PLAN' },
  { key: 'review', configId: 'CDL_OWNER_REVIEW' },
]

// Fallback step labels
const fallbackSteps = [
  'Basic Details',
  'Documents',
  'Unit Details',
  'Payment Plan',
  // 'Bank Details',
  'Review',
]

interface InvestorsStepperWrapperProps {
  initialCapitalPartnerId?: number | null
  initialStep?: number
  isViewMode?: boolean
}

export default function InvestorsStepperWrapper({
  initialCapitalPartnerId = null,
  initialStep = 0,
  isViewMode = false,
}: InvestorsStepperWrapperProps = {}) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  // Get labels from API
  const { getLabel } = useCapitalPartnerLabelsApi()
  const currentLanguage = useAppStore((state) => state.language)

  const [activeStep, setActiveStep] = useState(initialStep)
  const [isSaving, setIsSaving] = useState(false)
  const [capitalPartnerId, setCapitalPartnerId] = useState<number | null>(
    initialCapitalPartnerId
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create dynamic step labels
  const steps = stepConfigs.map((config, index) =>
    getLabel(config.configId, currentLanguage, fallbackSteps[index])
  )

  const isEditMode = Boolean(capitalPartnerId)
  const step1Ref = useRef<Step1Ref>(null)
  const step2Ref = useRef<Step2Ref>(null)
  const step3Ref = useRef<Step3Ref>(null)
  // const step4Ref = useRef<Step4Ref>(null)

  // Keep active step in a ref so the resolver can react to step changes without remounting the form
  const activeStepRef = useRef(activeStep)
  useEffect(() => {
    activeStepRef.current = activeStep
  }, [activeStep])

  const dynamicResolver: Resolver<CapitalPartnerFormData> = useCallback(
    async (
      values: CapitalPartnerFormData,
      context: unknown,
      options: Parameters<Resolver<CapitalPartnerFormData>>[2]
    ) => {
      const step = activeStepRef.current
      switch (step) {
        case 0:
          return (
            zodResolver(
              CapitalPartnerStep1Schema
            ) as unknown as Resolver<CapitalPartnerFormData>
          )(values, context, options)
        case 2:
          return (
            zodResolver(
              CapitalPartnerStep2Schema
            ) as unknown as Resolver<CapitalPartnerFormData>
          )(values, context, options)
        // case 4:
        //   return (
        //     zodResolver(
        //       CapitalPartnerStep4Schema
        //     ) as unknown as Resolver<CapitalPartnerFormData>
        //   )(values, context, options)
        default:
          return {
            values,
            errors: {},
          } as ResolverResult<CapitalPartnerFormData>
      }
    },
    []
  )

  const updateURL = (step: number, id?: number | null) => {
    if (id && step >= 0) {
      const queryParam = isViewMode ? '?mode=view' : '?editing=true'
      router.push(`/owner-registry/${id}/step/${step + 1}${queryParam}`)
    } else if (step === 0) {
      router.push('/owner-registry/new')
    }
  }
  const createCapitalPartnerWorkflowRequest =
    useCreateDeveloperWorkflowRequest()

  useEffect(() => {
    const stepFromUrl = searchParams.get('step')
    if (stepFromUrl) {
      const stepNumber = parseInt(stepFromUrl) - 1
      if (
        stepNumber !== activeStep &&
        stepNumber >= 0 &&
        stepNumber < steps.length
      ) {
        setActiveStep(stepNumber)
      }
    }
  }, [searchParams, activeStep, steps.length])

  useEffect(() => {
    const idParam = params.id as string | undefined
    if (idParam) {
      const numId = parseInt(idParam, 10)
      if (!Number.isNaN(numId) && numId > 0 && !capitalPartnerId) {
        setCapitalPartnerId(numId)
      }
    }
  }, [params.id, capitalPartnerId])

  const methods = useForm<CapitalPartnerFormData>({
    resolver: dynamicResolver,
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      // Step 1: Basic Info (required for resolver when activeStep === 0)
      investorType: '',
      investorFirstName: '',
      investorMiddleName: '',
      investorLastName: '',
      arabicName: '',
      investorId: '',
      investorIdType: '',
      idNumber: '',
      ownership: '',
      idExpiaryDate: null,
      nationality: '',
      accountContact: '',
      mobileNumber: '',
      email: '',

      // Step 2: Unit Details (required for resolver when activeStep === 2)
      projectNameDropdown: '',
      projectId: '',
      developerIdInput: '',
      developerNameInput: '',
      unitNoQaqood: '',
      unitStatus: '',
      plotSize: '',
      propertyId: '',
      floor: '',
      bedroomCount: '',
      buildingName: '',
      unitIban: '',
      registrationFees: '',
      agentName: '',
      agentNationalId: '',
      VatApplicable: false,
      SalesPurchaseAgreement: false,
      ProjectPaymentPlan: false,
      salePrice: '',
      deedNo: '',
      contractNo: '',
      agreementDate: null,
      ModificationFeeNeeded: false,
      ReservationBookingForm: false,
      OqoodPaid: false,
      worldCheck: false,
      paidInEscrow: '',
      paidOutEscrow: '',
      totalPaid: '',
      qaqoodAmount: '',
      unitAreaSize: '',
      forfeitAmount: '',
      dldAmount: '',
      refundAmount: '',
      transferredAmount: '',
      unitRemarks: '',

      // Additional fields for other steps
      documents: [],
      paymentPlan: [],
    },
  })

  const handleAsyncStep = async (stepRef: {
    handleSaveAndNext: () => Promise<void>
  }) => {
    try {
      setIsSaving(true)

      await stepRef.handleSaveAndNext()
    } catch {
      return false
    } finally {
      setIsSaving(false)
    }
    return true
  }

  const navigateToNextStep = () => {
    const nextStep = activeStep + 1
    if (nextStep < steps.length) {
      setActiveStep(nextStep)
      updateURL(nextStep, capitalPartnerId)
    }
  }

  const handleNext = async () => {
    if (isViewMode) {
      navigateToNextStep()
      return
    }

    // Check for unsaved changes in Step 3 (Payment Plan)
    if (activeStep === 3) {
      const step3State = (window as any).step3ValidationState || {}
      if (step3State.hasUnsavedChanges) {
        setErrorMessage(
          'You have unsaved payment plan data. Please save all rows (click the ✓ icon) or cancel editing (click the ✗ icon) before proceeding.'
        )
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }
    }

    if (activeStep === 0 && step1Ref.current) {
      setIsSaving(true)
      setErrorMessage(null)
      try {
        const id = await step1Ref.current.handleSaveAndNext()
        if (id != null && id > 0) {
          setCapitalPartnerId(id)
          const nextStep = activeStep + 1
          setActiveStep(nextStep)
          updateURL(nextStep, id)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Save failed. Please check the form and try again.'
        // Don't show top Snackbar for validation errors; field-level errors are shown inline
        if (msg !== 'Please fill all required fields correctly.') {
          setErrorMessage(msg)
        }
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (activeStep === 1) {
      navigateToNextStep()
      return
    }

    if (activeStep === 2 && step2Ref.current) {
      await handleAsyncStep(step2Ref.current)
      return
    }

    if (activeStep === 3 && step3Ref.current) {
      await handleAsyncStep(step3Ref.current)
      return
    }

    // if (activeStep === 4 && step4Ref.current) {
    //   await handleAsyncStep(step4Ref.current)
    //   return
    // }

    navigateToNextStep()
  }

  const handleBack = () => {
    const prevStep = activeStep - 1
    if (prevStep >= 0) {
      setActiveStep(prevStep)
      updateURL(prevStep, capitalPartnerId)
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setCapitalPartnerId(null)
    setIsSaving(false)
    setErrorMessage(null)
    setSuccessMessage(null)
    methods.reset()
    router.push('/owner-registry')
  }

  const onSubmit = () => {}

  const handleStep1SaveAndNext = (data: { id?: number } | unknown) => {
    const raw = data as Record<string, unknown> | null
    const id = raw?.id ?? (raw as any)?.data?.id
    const numId = id != null ? Number(id) : NaN
    if (!Number.isNaN(numId) && numId > 0) {
      const nextStep = activeStep + 1
      setCapitalPartnerId(numId)
      setActiveStep(nextStep)
      updateURL(nextStep, numId)
    }
  }

  const handleStep2SaveAndNext = () => {
    const nextStep = activeStep + 1
    if (nextStep < steps.length) {
      setActiveStep(nextStep)
      updateURL(nextStep, capitalPartnerId)
    }
  }

  const handleStep3SaveAndNext = () => {
    const nextStep = activeStep + 1
    if (nextStep < steps.length) {
      setActiveStep(nextStep)
      updateURL(nextStep, capitalPartnerId)
    }
  }

  // const handleStep4SaveAndNext = () => {
  //   const nextStep = activeStep + 1
  //   if (nextStep < steps.length) {
  //     setActiveStep(nextStep)
  //     updateURL(nextStep, capitalPartnerId)
  //   }
  // }

  const handleDocumentsChange = useCallback(
    (documents: DocumentItem[]) => {
      methods.setValue('documents', documents)
    },
    [methods]
  )

  const handlePaymentPlanChange = useCallback(
    (paymentPlan: CapitalPartnerFormData['paymentPlan']) => {
      methods.setValue('paymentPlan', paymentPlan)
    },
    [methods]
  )

  const handleSubmit = async () => {
    try {
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsSaving(true)
      const capitalPartnerIdForWorkflow = capitalPartnerId?.toString()
      if (!capitalPartnerIdForWorkflow) {
        setErrorMessage(
          'Owner Registry ID not found. Please complete Step 1 first.'
        )
        setIsSaving(false)
        return
      }
      const step1Data = methods.getValues()
      await createCapitalPartnerWorkflowRequest.mutateAsync({
        referenceId: capitalPartnerIdForWorkflow,
        payloadData: { ...step1Data } as Record<string, unknown>,
        referenceType: 'OWNER_REGISTRY',
        moduleName: 'OWNER_REGISTRY',
        actionKey: 'CREATE',
      })
      setSuccessMessage(
        'Owner Registry registration submitted successfully! Workflow request created.'
      )
      router.push('/owner-registry')
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
            capitalPartnerId={capitalPartnerId}
            isViewMode={isViewMode}
          />
        )
      case 1:
        return (
          <DocumentUploadFactory
            type="CAPITAL_PARTNER"
            entityId={capitalPartnerId?.toString() || ''}
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
            capitalPartnerId={capitalPartnerId}
            onSaveAndNext={handleStep2SaveAndNext}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
          />
        )
      case 3:
        return (
          <Step3
            ref={step3Ref}
            paymentPlan={methods.watch('paymentPlan') || []}
            onPaymentPlanChange={handlePaymentPlanChange}
            capitalPartnerId={capitalPartnerId}
            onSaveAndNext={handleStep3SaveAndNext}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
          />
        )
      // case 4:
      //   return (
      //     <Step4
      //       ref={step4Ref}
      //       capitalPartnerId={capitalPartnerId}
      //       onSaveAndNext={handleStep4SaveAndNext}
      //       isEditMode={isEditMode}
      //       isViewMode={isViewMode}
      //     />
      //   )
      case 4:
        return (
          <Step5 capitalPartnerId={capitalPartnerId} isViewMode={isViewMode} />
        )
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Box sx={outerContainerSx}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography variant="caption" sx={stepperLabelSx}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box
            key={`step-${activeStep}-${capitalPartnerId}`}
            sx={formSectionSx}
          >
            {getStepContent(activeStep)}

            <Box
              display="flex"
              justifyContent="space-between"
              sx={buttonContainerSx}
            >
              <Button
                type="button"
                onClick={handleReset}
                variant="outlined"
                sx={cancelButtonSx}
              >
                Cancel
              </Button>
              <Box>
                {activeStep !== 0 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    sx={(theme) => ({
                      ...(
                        backButtonSx as (
                          theme: Theme
                        ) => Record<string, unknown>
                      )(theme),
                      mr: 2,
                    })}
                    variant="outlined"
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={
                    activeStep === steps.length - 1
                      ? isViewMode
                        ? () => router.push('/owner-registry')
                        : handleSubmit
                      : handleNext
                  }
                  variant="contained"
                  disabled={
                    (activeStep === steps.length - 1 && isSaving) ||
                    createCapitalPartnerWorkflowRequest.isPending
                  }
                  sx={nextButtonSx}
                >
                  {isSaving || createCapitalPartnerWorkflowRequest.isPending
                    ? activeStep === steps.length - 1
                      ? 'Submitting...'
                      : 'Saving...'
                    : activeStep === steps.length - 1
                      ? isViewMode
                        ? 'Close'
                        : 'Complete'
                      : isViewMode
                        ? 'Next'
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
