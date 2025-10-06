'use client'

import React, { useState, useMemo, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Drawer,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextareaAutosize,
  Grid,
} from '@mui/material'
import { CommentModal } from '@/components/molecules'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import type { WorkflowRequest } from '@/services/api/workflowApi/workflowRequestService'
import { useCreateWorkflowExecution } from '@/hooks/workflow'
import {
  useQueueRequestDetail,
  useQueueRequestStatus,
  useQueueRequestLogs,
} from '@/hooks/workflow/useWorkflowRequest'
import { useAuthStore } from '@/store/authStore'
import { JWTParser } from '@/utils/jwtParser'

interface FieldItem {
  gridSize: number
  label: string
  value: string | number | boolean | null | undefined
}

interface SectionProps {
  title: string
  fields: FieldItem[]
}

const Section = ({ title, fields }: SectionProps) => {
  const renderDisplayField = (
    label: string,
    value: string | number | boolean | null | undefined
  ) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: 'var(--font-outfit), system-ui, sans-serif',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: '#64748b',
          fontFamily: 'var(--font-outfit), system-ui, sans-serif',
          wordBreak: 'break-word',
        }}
      >
        {String(value || '-')}
      </Typography>
    </Box>
  )

  const renderCheckboxField = (label: string, value: boolean) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: 'var(--font-outfit), system-ui, sans-serif',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: '#64748b',
          fontFamily: 'var(--font-outfit), system-ui, sans-serif',
        }}
      >
        {value ? 'Yes' : 'No'}
      </Typography>
    </Box>
  )

  return (
    <Box mb={4}>
      <Typography
        variant="h6"
        fontWeight={600}
        gutterBottom
        sx={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          fontStyle: 'normal',
          fontSize: '18px',
          lineHeight: '28px',
          letterSpacing: '0.15px',
          verticalAlign: 'middle',
        }}
      >
        {title}
      </Typography>

      <Grid container spacing={3} mt={3}>
        {fields.map((field, idx) => (
          <Grid
            size={{ xs: 12, md: field.gridSize || 6 }}
            key={`field-${title}-${idx}`}
          >
            {typeof field.value === 'boolean'
              ? renderCheckboxField(field.label, field.value)
              : renderDisplayField(field.label, field.value)}
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

interface RightSlideWorkflowTransactionStatePanelProps {
  isOpen: boolean
  onClose: () => void
  transactionId?: string | number
  steps?: string[]
  initialStep?: number
  onApprove?: (transactionId?: string | number, comment?: string) => void
  onReject?: (transactionId?: string | number, comment?: string) => void
  children?: ReactNode
  workflowRequestData?: WorkflowRequest // Legacy - API response from WORKFLOW_REQUEST.GET_BY_ID
  workflowRequestLogsData?: { content: Record<string, unknown>[] } // Legacy - API response from WORKFLOW_REQUEST_LOG.GET_ALL
  activeTab?: string // Current active tab (buildPartner, capitalPartner, payments, etc.)
}

export const RightSlideWorkflowTransactionStatePanel: React.FC<
  RightSlideWorkflowTransactionStatePanelProps
> = ({
  isOpen,
  onClose,
  transactionId,
  steps: stepsProp,
  initialStep = 0,
  onApprove,
  onReject,
  children,
  workflowRequestData,
  workflowRequestLogsData,
  activeTab = 'buildPartner',
}) => {
  const TAB_TO_MODULE_MAP = useMemo(
    () => ({
      buildPartner: 'BUILD_PARTNER',
      buildPartnerAsset: 'BUILD_PARTNER_ASSET',
      capitalPartner: 'CAPITAL_PARTNER',
      payments: 'PAYMENTS',
      suretyBond: 'SURETY_BOND',
    }),
    []
  )
  const [comment, setComment] = useState('')
  const [permissionDeniedModalOpen, setPermissionDeniedModalOpen] =
    useState(false)
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState('')
  const [activeStep, setActiveStep] = useState(Math.max(1, initialStep))
  const [modalOpen, setModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(
    null
  )

  const createWorkflowExecutionMutation = useCreateWorkflowExecution()
  const router = useRouter()
  const { token } = useAuthStore()

  // Queue API hooks
  const {
    data: queueDetailData,
    isLoading: queueDetailLoading,
    error: _queueDetailError,
  } = useQueueRequestDetail(transactionId?.toString() || '')

  const {
    data: queueStatusData,
    isLoading: _queueStatusLoading,
    error: _queueStatusError,
  } = useQueueRequestStatus(transactionId?.toString() || '')

  const {
    data: queueLogsData,
    isLoading: queueLogsLoading,
    error: _queueLogsError,
  } = useQueueRequestLogs(transactionId?.toString() || '')

  React.useEffect(() => {
    // Use queue status data if available, otherwise fallback to old data
    const currentStageOrder =
      queueStatusData?.completedStages ||
      queueDetailData?.currentStageOrder ||
      workflowRequestData?.currentStageOrder
    if (currentStageOrder) {
      const newActiveStep = Math.max(1, currentStageOrder - 1)
      setActiveStep(newActiveStep)
    }
  }, [
    queueStatusData?.completedStages,
    queueDetailData?.currentStageOrder,
    workflowRequestData?.currentStageOrder,
  ])

  const showPermissionDeniedModal = useCallback((message: string) => {
    setPermissionDeniedMessage(message)
    setPermissionDeniedModalOpen(true)
  }, [])

  const handlePermissionDeniedModalClose = useCallback(() => {
    setPermissionDeniedModalOpen(false)
    setPermissionDeniedMessage('')
    router.push('/dashboard')
  }, [router])

  const getCurrentUserRoles = useCallback(() => {
    if (!token) {
      return []
    }
    try {
      const parsedToken = JWTParser.parseToken(token)
      if (!parsedToken?.payload?.realm_access?.roles) {
        return []
      }
      const roles = parsedToken.payload.realm_access.roles
      return roles
    } catch (error) {
      return []
    }
  }, [token])

  const hasRole = useCallback(
    (role: string) => {
      const _userRoles = getCurrentUserRoles()
      const hasSpecificRole = _userRoles.includes(role)
      return hasSpecificRole
    },
    [getCurrentUserRoles]
  )

  const dynamicSteps = useMemo(() => {
    const _userRoles = getCurrentUserRoles()
    const isMaker = hasRole('ROLE_MAKER')
    const isChecker = hasRole('ROLE_CHECKER')
    const _isAdmin = hasRole('ROLE_ADMIN')

    // Use queue status data if available, otherwise fallback to old data
    const stageData =
      queueStatusData?.stageHistory ||
      workflowRequestData?.workflowRequestStageDTOS

    if (stageData && stageData.length > 0) {
      const sortedStages = [...stageData]
        .sort((a, b) => a.stageOrder - b.stageOrder)
        .map((stage) => ({
          id: stage.id,
          stageOrder: stage.stageOrder,
          label:
            stage.stageKey ||
            stage.keycloakGroup ||
            `Stage ${stage.stageOrder}`,
          stageKey: stage.stageKey,
          keycloakGroup: stage.keycloakGroup,
          status: 'status' in stage ? stage.status : undefined,
          requiredApprovals: stage.requiredApprovals,
          approvalsObtained: stage.approvalsObtained,
        }))

      if (!sortedStages.some((stage) => stage.stageKey === 'INITIATION')) {
        return [
          {
            id: 0,
            stageOrder: 0,
            label: 'Initiation',
            stageKey: 'INITIATION',
            keycloakGroup: 'INITIATION',
          },
          ...sortedStages,
        ]
      }

      return sortedStages
    }

    const defaultSteps = ['Initiation', 'Maker', 'Approval'].map(
      (label, index) => {
        let displayLabel = label

        if (label === 'Maker' && isMaker) {
          displayLabel = `${label} (Your Role)`
        } else if (label === 'Approval' && isChecker) {
          displayLabel = `${label} (Your Role)`
        }

        return {
          id: index,
          stageOrder: index,
          label: displayLabel,
          stageKey: label.toUpperCase(),
          keycloakGroup: label.toUpperCase(),
        }
      }
    )

    return stepsProp ?? defaultSteps
  }, [
    queueStatusData?.stageHistory,
    workflowRequestData?.workflowRequestStageDTOS,
    stepsProp,
    getCurrentUserRoles,
    hasRole,
  ])

  const getCurrentUserInfo = useCallback(() => {
    if (!token) {
      return { userId: null, userName: null }
    }
    try {
      const userInfo = JWTParser.extractUserInfo(token)
      if (!userInfo) {
        return { userId: null, userName: null }
      }
      const result = {
        userId: userInfo.userId,
        userName: userInfo.name,
      }
      return result
    } catch (error) {
      return { userId: null, userName: null }
    }
  }, [token])

  const resolveUserName = useCallback(
    (userId: string | null | undefined) => {
      const { userId: currentUserId, userName: _currentUserName } =
        getCurrentUserInfo()
      if (userId === currentUserId && _currentUserName) {
        return _currentUserName
      }
      return userId
    },
    [getCurrentUserInfo]
  )

  // Function to validate role permissions for workflow actions
  const validateRolePermission = useCallback(
    (_action: 'approve' | 'reject', currentStage: string) => {
      const _userRoles = getCurrentUserRoles()

      const isMaker = hasRole('ROLE_MAKER')
      const isChecker = hasRole('ROLE_CHECKER')
      const isAdmin = hasRole('ROLE_ADMIN')

      if (isAdmin) {
        return { allowed: true, message: '' }
      }

      const isMakerStage =
        currentStage.toLowerCase().includes('maker') ||
        currentStage.toLowerCase().includes('initiation') ||
        currentStage === 'Stage 1' ||
        currentStage === '1' ||
        currentStage.toLowerCase().includes('stage 1')

      if (isMakerStage) {
        if (isMaker) {
          return { allowed: true, message: '' }
        } else {
          return {
            allowed: false,
            message: `Your role does not match. Your current role is "${_userRoles.find((r: string) => r.startsWith('ROLE_'))}" but you need ROLE_MAKER for this action.`,
          }
        }
      }
      const isCheckerStage =
        currentStage.toLowerCase().includes('checker') ||
        currentStage.toLowerCase().includes('approval') ||
        currentStage === 'Stage 2' ||
        currentStage === 'Stage 3' ||
        currentStage === '2' ||
        currentStage === '3' ||
        currentStage.toLowerCase().includes('stage 2') ||
        currentStage.toLowerCase().includes('stage 3')
      if (isCheckerStage) {
        if (isChecker) {
          return { allowed: true, message: '' }
        } else {
          return {
            allowed: false,
            message: `Your role does not match. Your current role is "${_userRoles.find((r: string) => r.startsWith('ROLE_'))}" but you need ROLE_CHECKER for this action.`,
          }
        }
      }

      return {
        allowed: false,
        message: `Your role does not match. Your current role is "${_userRoles.find((r: string) => r.startsWith('ROLE_'))}" and you don't have permission for this action. Stage "${currentStage}" is not recognized.`,
      }
    },
    [getCurrentUserRoles, hasRole]
  )

  const currentLogEntry = useMemo(() => {
    if (!workflowRequestLogsData?.content || !transactionId) return null

    const logs = workflowRequestLogsData.content
    if (logs.length === 0) return null

    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.eventAt as string).getTime()
      const dateB = new Date(b.eventAt as string).getTime()
      return dateB - dateA
    })

    return sortedLogs[0]
  }, [workflowRequestLogsData, transactionId])

  const currentWorkflowData =
    workflowRequestData || currentLogEntry?.workflowRequestDTO

  const transactionDetails = useMemo(() => {
    // Use queue detail data if available, otherwise fallback to old data
    const workflowData =
      queueDetailData ||
      currentWorkflowData ||
      currentLogEntry?.workflowRequestDTO
    const detailsJson =
      queueDetailData?.payloadJson ||
      (workflowData as any)?.payloadJson ||
      currentLogEntry?.detailsJson

    if (!workflowData && !currentLogEntry && queueDetailLoading) {
      return [
        { gridSize: 3, label: 'Reference ID', value: 'Loading...' },
        { gridSize: 3, label: 'Reference Type', value: 'Loading...' },
        { gridSize: 3, label: 'Action Key', value: 'Loading...' },
        { gridSize: 3, label: 'Current Stage', value: 'Loading...' },
        { gridSize: 6, label: 'Created By', value: 'Loading...' },
        { gridSize: 6, label: 'Created At', value: 'Loading...' },
        { gridSize: 6, label: 'Last Updated At', value: 'Loading...' },
      ]
    }

    const baseDetails = [
      {
        gridSize: 4,
        label: 'ID',
        value: (workflowData as any)?.id ? (workflowData as any).id : '-',
      },
      {
        gridSize: 4,
        label: 'Reference ID',
        value: (workflowData as any)?.referenceId
          ? (workflowData as any).referenceId
          : transactionId
            ? String(transactionId)
            : '-',
      },
      {
        gridSize: 4,
        label: 'Reference Type',
        value: (workflowData as any)?.referenceType
          ? (workflowData as any).referenceType
          : '-',
      },
      {
        gridSize: 4,
        label: 'Action Key',
        value: (workflowData as any)?.actionKey
          ? (workflowData as any).actionKey
          : '-',
      },
      {
        gridSize: 4,
        label: 'Amount',
        value: (workflowData as any)?.amount
          ? (workflowData as any).amount
          : '-',
      },
      {
        gridSize: 4,
        label: 'Currency',
        value: (workflowData as any)?.currency
          ? (workflowData as any).currency
          : '-',
      },
      // { gridSize: 12, label: 'Created By', value: workflowData?.createdBy ? workflowData.createdBy : '-' },
    ]

    const dynamicDetails = []
    const currentModuleName =
      TAB_TO_MODULE_MAP[activeTab as keyof typeof TAB_TO_MODULE_MAP] ||
      (workflowData as any)?.moduleName

    if (
      activeTab === 'buildPartner' ||
      currentModuleName === 'BUILD_PARTNER' ||
      (workflowData as any)?.referenceType === 'BUILD_PARTNER'
    ) {
      dynamicDetails.push({
        gridSize: 4,
        label: 'CIFRERA',
        value: detailsJson?.bpCifrera ? detailsJson.bpCifrera : '-',
      })

      dynamicDetails.push({
        gridSize: 4,
        label: 'License No',
        value: detailsJson?.bpLicenseNo ? detailsJson.bpLicenseNo : '-',
      })

      dynamicDetails.push({
        gridSize: 4,
        label: 'Local Name',
        value: detailsJson?.bpNameLocal ? detailsJson.bpNameLocal : '-',
      })

      dynamicDetails.push({
        gridSize: 4,
        label: 'Current Stage',
        value: (workflowData as any)?.currentStageOrder
          ? `Stage ${(workflowData as any).currentStageOrder}`
          : '-',
      })

      dynamicDetails.push({
        gridSize: 4,
        label: 'Created At',
        value: (workflowData as any)?.createdAt
          ? new Date((workflowData as any).createdAt).toLocaleDateString(
              'en-GB',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )
          : '-',
      })

      dynamicDetails.push({
        gridSize: 4,
        label: 'Last Updated At',
        value: (workflowData as any)?.lastUpdatedAt
          ? new Date((workflowData as any).lastUpdatedAt).toLocaleDateString(
              'en-GB',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )
          : '-',
      })

      dynamicDetails.push({
        gridSize: 6,
        label: 'Build Partner Name',
        value: detailsJson?.bpName ? detailsJson.bpName : '-',
      })

      dynamicDetails.push({
        gridSize: 6,
        label: 'Developer ID',
        value: detailsJson?.bpDeveloperId ? detailsJson.bpDeveloperId : '-',
      })
    }

    if (detailsJson) {
      // Capital Partner specific fields
      if (
        activeTab === 'capitalPartner' ||
        currentModuleName === 'CAPITAL_PARTNER'
      ) {
        if ((detailsJson as Record<string, unknown>).cpName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'CP Name',
            value: (detailsJson as Record<string, unknown>).cpName,
          })
        if ((detailsJson as Record<string, unknown>).cpId)
          dynamicDetails.push({
            gridSize: 3,
            label: 'CP ID',
            value: (detailsJson as Record<string, unknown>).cpId,
          })
        if ((detailsJson as Record<string, unknown>).cpCode)
          dynamicDetails.push({
            gridSize: 3,
            label: 'CP Code',
            value: (detailsJson as Record<string, unknown>).cpCode,
          })
        if ((detailsJson as Record<string, unknown>).cpType)
          dynamicDetails.push({
            gridSize: 3,
            label: 'CP Type',
            value: (detailsJson as Record<string, unknown>).cpType,
          })
        if ((detailsJson as Record<string, unknown>).cpContactPerson)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Contact Person',
            value: (detailsJson as Record<string, unknown>).cpContactPerson,
          })
        if ((detailsJson as Record<string, unknown>).cpEmail)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Email',
            value: (detailsJson as Record<string, unknown>).cpEmail,
          })
        if ((detailsJson as Record<string, unknown>).cpPhone)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Phone',
            value: (detailsJson as Record<string, unknown>).cpPhone,
          })
        if ((detailsJson as Record<string, unknown>).cpAddress)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Address',
            value: (detailsJson as Record<string, unknown>).cpAddress,
          })
        if ((detailsJson as Record<string, unknown>).cpLicenseNumber)
          dynamicDetails.push({
            gridSize: 3,
            label: 'License Number',
            value: (detailsJson as Record<string, unknown>).cpLicenseNumber,
          })
        if ((detailsJson as Record<string, unknown>).cpRegistrationDate)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Registration Date',
            value: (detailsJson as Record<string, unknown>).cpRegistrationDate,
          })
      }

      // Payments specific fields
      if (activeTab === 'payments' || currentModuleName === 'PAYMENTS') {
        if ((detailsJson as Record<string, unknown>).paymentId)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Payment ID',
            value: (detailsJson as Record<string, unknown>).paymentId,
          })
        if ((detailsJson as Record<string, unknown>).recipientName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'Recipient Name',
            value: (detailsJson as Record<string, unknown>).recipientName,
          })
        if ((detailsJson as Record<string, unknown>).paymentAmount)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Payment Amount',
            value: (detailsJson as Record<string, unknown>).paymentAmount,
          })
        if ((detailsJson as Record<string, unknown>).paymentCurrency)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Currency',
            value: (detailsJson as Record<string, unknown>).paymentCurrency,
          })
        if ((detailsJson as Record<string, unknown>).paymentMethod)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Payment Method',
            value: (detailsJson as Record<string, unknown>).paymentMethod,
          })
        if ((detailsJson as Record<string, unknown>).bankAccount)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Bank Account',
            value: (detailsJson as Record<string, unknown>).bankAccount,
          })
        if ((detailsJson as Record<string, unknown>).routingNumber)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Routing Number',
            value: (detailsJson as Record<string, unknown>).routingNumber,
          })
        if ((detailsJson as Record<string, unknown>).paymentDate)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Payment Date',
            value: (detailsJson as Record<string, unknown>).paymentDate,
          })
        if ((detailsJson as Record<string, unknown>).paymentStatus)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Payment Status',
            value: (detailsJson as Record<string, unknown>).paymentStatus,
          })
        if ((detailsJson as Record<string, unknown>).transactionReference)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Transaction Reference',
            value: (detailsJson as Record<string, unknown>)
              .transactionReference,
          })
      }

      // Surety Bond specific fields
      if (activeTab === 'suretyBond' || currentModuleName === 'SURETY_BOND') {
        if ((detailsJson as Record<string, unknown>).bondId)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Bond ID',
            value: (detailsJson as Record<string, unknown>).bondId,
          })
        if ((detailsJson as Record<string, unknown>).bondName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'Bond Name',
            value: (detailsJson as Record<string, unknown>).bondName,
          })
        if ((detailsJson as Record<string, unknown>).bondType)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Bond Type',
            value: (detailsJson as Record<string, unknown>).bondType,
          })
        if ((detailsJson as Record<string, unknown>).bondAmount)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Bond Amount',
            value: (detailsJson as Record<string, unknown>).bondAmount,
          })
        if ((detailsJson as Record<string, unknown>).bondCurrency)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Currency',
            value: (detailsJson as Record<string, unknown>).bondCurrency,
          })
        if ((detailsJson as Record<string, unknown>).bondStartDate)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Start Date',
            value: (detailsJson as Record<string, unknown>).bondStartDate,
          })
        if ((detailsJson as Record<string, unknown>).bondEndDate)
          dynamicDetails.push({
            gridSize: 3,
            label: 'End Date',
            value: (detailsJson as Record<string, unknown>).bondEndDate,
          })
        if ((detailsJson as Record<string, unknown>).bondStatus)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Bond Status',
            value: (detailsJson as Record<string, unknown>).bondStatus,
          })
        if ((detailsJson as Record<string, unknown>).issuerName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'Issuer Name',
            value: (detailsJson as Record<string, unknown>).issuerName,
          })
        if ((detailsJson as Record<string, unknown>).beneficiaryName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'Beneficiary Name',
            value: (detailsJson as Record<string, unknown>).beneficiaryName,
          })
      }

      // Build Partner Asset specific fields
      if (
        activeTab === 'buildPartnerAsset' ||
        currentModuleName === 'BUILD_PARTNER_ASSET'
      ) {
        if ((detailsJson as Record<string, unknown>).assetId)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Asset ID',
            value: (detailsJson as Record<string, unknown>).assetId,
          })
        if ((detailsJson as Record<string, unknown>).assetName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'Asset Name',
            value: (detailsJson as Record<string, unknown>).assetName,
          })
        if ((detailsJson as Record<string, unknown>).assetType)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Asset Type',
            value: (detailsJson as Record<string, unknown>).assetType,
          })
        if ((detailsJson as Record<string, unknown>).assetValue)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Asset Value',
            value: (detailsJson as Record<string, unknown>).assetValue,
          })
        if ((detailsJson as Record<string, unknown>).assetLocation)
          dynamicDetails.push({
            gridSize: 4,
            label: 'Asset Location',
            value: (detailsJson as Record<string, unknown>).assetLocation,
          })
        if ((detailsJson as Record<string, unknown>).assetStatus)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Asset Status',
            value: (detailsJson as Record<string, unknown>).assetStatus,
          })
        if ((detailsJson as Record<string, unknown>).ownerName)
          dynamicDetails.push({
            gridSize: 6,
            label: 'Owner Name',
            value: (detailsJson as Record<string, unknown>).ownerName,
          })
        if ((detailsJson as Record<string, unknown>).registrationDate)
          dynamicDetails.push({
            gridSize: 3,
            label: 'Registration Date',
            value: (detailsJson as Record<string, unknown>).registrationDate,
          })
      }
    }

    return [...baseDetails, ...dynamicDetails]
  }, [
    queueDetailData,
    queueDetailLoading,
    currentWorkflowData,
    currentLogEntry,
    transactionId,
    activeTab,
    TAB_TO_MODULE_MAP,
  ])

  const auditTrail = useMemo(() => {
    // Use queue logs data if available, otherwise fallback to old data
    const logsData = queueLogsData?.content || workflowRequestLogsData?.content
    const workflowData = queueDetailData || currentWorkflowData

    if (!logsData && !workflowData && queueLogsLoading) {
      return [
        {
          action: 'Loading...',
          user: 'Loading...',
          timestamp: 'Loading...',
        },
      ]
    }

    if (logsData && logsData.length > 0) {
      return logsData
        .sort(
          (a, b) =>
            new Date(a.eventAt as string).getTime() -
            new Date(b.eventAt as string).getTime()
        )
        .map((log) => {
          const displayUser =
            resolveUserName(log.eventByUser as string) ||
            (log.eventByGroup as string) ||
            'System'

          const isApprovalAction =
            (log.eventType as string)?.toLowerCase().includes('approve') ||
            (log.eventType as string)?.toLowerCase().includes('approved') ||
            (log.eventType as string)?.toLowerCase().includes('approval')

          let userRole = 'Unknown'
          if (log.eventByGroup) {
            userRole = log.eventByGroup as string
          } else if (
            (log.eventType as string)?.toLowerCase().includes('maker')
          ) {
            userRole = 'ROLE_MAKER'
          } else if (
            (log.eventType as string)?.toLowerCase().includes('checker') ||
            (log.eventType as string)?.toLowerCase().includes('approval')
          ) {
            userRole = 'ROLE_CHECKER'
          }

          return {
            id: log.id,
            action: log.eventType || 'Unknown Event',
            user: displayUser,
            group: log.eventByGroup,
            role: userRole,
            isApproval: isApprovalAction,
            timestamp: log.eventAt
              ? new Date(log.eventAt as string).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'N/A',
            rawTimestamp: log.eventAt,
            details: log.detailsJson || {},
            workflowRequestId: (log as any).workflowRequestDTO?.id,
            referenceId: (log as any).workflowRequestDTO?.referenceId,
            moduleName: (log as any).workflowRequestDTO?.moduleName,
            actionKey: (log as any).workflowRequestDTO?.actionKey,
          }
        })
    }

    if (currentWorkflowData) {
      return [
        {
          action: 'Request Created',
          user: (currentWorkflowData as any).createdBy || 'System',
          timestamp: (currentWorkflowData as any).createdAt
            ? new Date((currentWorkflowData as any).createdAt).toLocaleString()
            : '-',
        },
        {
          action: 'Current Stage',
          user: `Stage ${(currentWorkflowData as any).currentStageOrder || 1}`,
          timestamp: (currentWorkflowData as any).lastUpdatedAt
            ? new Date(
                (currentWorkflowData as any).lastUpdatedAt
              ).toLocaleString()
            : 'Pending',
        },
      ]
    }

    return []
  }, [
    queueLogsData,
    queueDetailData,
    workflowRequestLogsData,
    currentWorkflowData,
    resolveUserName,
    queueLogsLoading,
  ])

  const handleApprove = () => {
    const currentStage = workflowRequestData?.currentStageOrder
      ? `Stage ${workflowRequestData.currentStageOrder}`
      : 'Unknown'

    const currentStep = dynamicSteps[activeStep]
    const currentStepLabel =
      typeof currentStep === 'string'
        ? currentStep
        : currentStep?.label || 'Unknown'

    const _userRoles = getCurrentUserRoles()
    const isMaker = hasRole('ROLE_MAKER')
    const isChecker = hasRole('ROLE_CHECKER')

    const isCheckerStage =
      currentStage === 'Stage 2' ||
      currentStage === 'Stage 3' ||
      currentStage === '2' ||
      currentStage === '3' ||
      currentStepLabel.toLowerCase().includes('checker') ||
      currentStepLabel.toLowerCase().includes('approval')

    if (isMaker && isCheckerStage) {
      showPermissionDeniedModal(
        `Permission Denied! Your role is ROLE_MAKER but you're trying to approve at ${currentStepLabel} (CHECKER stage). Only ROLE_CHECKER can approve CHECKER stages.`
      )
      return
    }

    const isMakerStage =
      currentStage === 'Stage 1' ||
      currentStage === '1' ||
      currentStepLabel.toLowerCase().includes('maker') ||
      currentStepLabel.toLowerCase().includes('initiation')

    if (isChecker && isMakerStage) {
      showPermissionDeniedModal(
        `Permission Denied! Your role is ROLE_CHECKER but you're trying to approve at ${currentStepLabel} (MAKER stage). Only ROLE_MAKER can approve MAKER stages.`
      )
      return
    }

    const permission = validateRolePermission('approve', currentStage)

    if (!permission.allowed) {
      alert(permission.message)
      return
    }

    setActionType('approve')
    setModalOpen(true)
  }

  const handleReject = () => {
    const currentStage = workflowRequestData?.currentStageOrder
      ? `Stage ${workflowRequestData.currentStageOrder}`
      : 'Unknown'

    // Get the current active step from the stepper
    const currentStep = dynamicSteps[activeStep]
    const currentStepLabel =
      typeof currentStep === 'string'
        ? currentStep
        : currentStep?.label || 'Unknown'

    const _userRoles = getCurrentUserRoles()
    const isMaker = hasRole('ROLE_MAKER')
    const isChecker = hasRole('ROLE_CHECKER')

    const isCheckerStage =
      currentStage === 'Stage 2' ||
      currentStage === 'Stage 3' ||
      currentStage === '2' ||
      currentStage === '3' ||
      currentStepLabel.toLowerCase().includes('checker') ||
      currentStepLabel.toLowerCase().includes('approval')

    if (isMaker && isCheckerStage) {
      showPermissionDeniedModal(
        `Permission Denied! Your role is ROLE_MAKER but you're trying to reject at ${currentStepLabel} (CHECKER stage). Only ROLE_CHECKER can reject CHECKER stages.`
      )
      return
    }

    const isMakerStage =
      currentStage === 'Stage 1' ||
      currentStage === '1' ||
      currentStepLabel.toLowerCase().includes('maker') ||
      currentStepLabel.toLowerCase().includes('initiation')

    if (isChecker && isMakerStage) {
      showPermissionDeniedModal(
        `Permission Denied! Your role is ROLE_CHECKER but you're trying to reject at ${currentStepLabel} (MAKER stage). Only ROLE_MAKER can reject MAKER stages.`
      )
      return
    }

    const permission = validateRolePermission('reject', currentStage)

    if (!permission.allowed) {
      alert(permission.message)
      return
    }

    setActionType('reject')
    setModalOpen(true)
  }

  const getCurrentWorkflowStageId = useMemo(() => {
    if (
      !workflowRequestData?.workflowRequestStageDTOS ||
      !workflowRequestData?.currentStageOrder
    ) {
      return null
    }

    const currentStage = workflowRequestData.workflowRequestStageDTOS.find(
      (stage) => stage.stageOrder === workflowRequestData.currentStageOrder
    )

    return currentStage?.id || null
  }, [workflowRequestData])

  const isAllStepsCompleted = useMemo(() => {
    if (
      !workflowRequestData?.workflowRequestStageDTOS ||
      !workflowRequestData?.currentStageOrder
    ) {
      return false
    }

    const totalStages = workflowRequestData.workflowRequestStageDTOS.length
    const currentStageOrder = workflowRequestData.currentStageOrder

    return currentStageOrder >= totalStages
  }, [workflowRequestData])

  const canPerformAction = useMemo(() => {
    if (isAllStepsCompleted) {
      return false
    }

    const currentStage = workflowRequestData?.currentStageOrder
      ? `Stage ${workflowRequestData.currentStageOrder}`
      : 'Unknown'

    const currentStep = dynamicSteps[activeStep]
    const currentStepLabel =
      typeof currentStep === 'string'
        ? currentStep
        : currentStep?.label || 'Unknown'

    const _userRoles = getCurrentUserRoles()
    const isMaker = hasRole('ROLE_MAKER')
    const isChecker = hasRole('ROLE_CHECKER')
    const isAdmin = hasRole('ROLE_ADMIN')

    if (isAdmin) {
      return true
    }

    const isCheckerStage =
      currentStage === 'Stage 2' ||
      currentStage === 'Stage 3' ||
      currentStage === '2' ||
      currentStage === '3' ||
      currentStepLabel.toLowerCase().includes('checker') ||
      currentStepLabel.toLowerCase().includes('approval')

    if (isMaker && isCheckerStage) {
      return false
    }

    const isMakerStage =
      currentStage === 'Stage 1' ||
      currentStage === '1' ||
      currentStepLabel.toLowerCase().includes('maker') ||
      currentStepLabel.toLowerCase().includes('initiation')

    if (isChecker && isMakerStage) {
      return false
    }

    if (isMakerStage) {
      return isMaker
    }

    if (isCheckerStage) {
      return isChecker
    }

    return false
  }, [
    isAllStepsCompleted,
    workflowRequestData,
    getCurrentUserRoles,
    hasRole,
    dynamicSteps,
    activeStep,
  ])

  const _getCurrentActiveStep = useMemo(() => {
    if (!workflowRequestData?.currentStageOrder) {
      return 0
    }

    return workflowRequestData.currentStageOrder - 1
  }, [workflowRequestData])

  const handleCommentSubmit = async (
    comment: string,
    type: 'approve' | 'reject'
  ) => {
    try {
      const workflowStageId = getCurrentWorkflowStageId

      if (!workflowStageId) {
        return
      }

      const { userId: currentUserId, userName: _currentUserName } =
        getCurrentUserInfo()

      if (!currentUserId) {
        return
      }

      const _userRoles = getCurrentUserRoles()
      const currentRole = _userRoles.find((r: string) => r.startsWith('ROLE_'))

      const payload = {
        userId: String(currentUserId),
        remarks: comment.trim() || (type === 'approve' ? 'APPROVE' : 'REJECT'),
        decision: (type === 'approve' ? 'APPROVE' : 'REJECT') as
          | 'APPROVE'
          | 'REJECT',
        userRole: currentRole,
      }

      const _response = await createWorkflowExecutionMutation.mutateAsync({
        workflowId: String(workflowStageId),
        data: payload,
      })

      if (type === 'approve') {
        const newStep = Math.min(activeStep + 1, dynamicSteps.length - 1)

        setActiveStep(newStep)
      }

      if (type === 'approve') {
        onApprove?.(transactionId, comment)
      } else {
        onReject?.(transactionId, comment)
      }

      setModalOpen(false)
      setComment('')
    } catch (error) {}
  }
  const formatReferenceType = (text = '') => {
    return text
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 520, md: 600 },
            height: 'calc(100vh - 48px)',
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: '12px',
            background: '#FFFFFFE5',
            boxShadow: '-8px 0px 8px 0px #62748E14',
            backdropFilter: 'blur(10px)',
            p: '24px',
            mt: '24px',
            mb: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 0, px: 0 }}
        >
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 24,
                fontWeight: 600,
                color: '#1e293b',
                fontFamily: 'var(--font-outfit), system-ui, sans-serif',
              }}
            >
              {(currentWorkflowData as any)?.referenceType && (
                <h2 title="Transaction Details">
                  {formatReferenceType(
                    (currentWorkflowData as any).referenceType
                  )}{' '}
                  Details :
                </h2>
              )}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: '#64748b',
                pt: 2,
                fontFamily: 'var(--font-outfit), system-ui, sans-serif',
              }}
            >
              {
                String()
                // (activeTab === 'buildPartner' && (currentWorkflowData?.payloadJson?.bpName || currentLogEntry?.detailsJson?.bpName)) ||
                // (activeTab === 'capitalPartner' && ((currentWorkflowData?.payloadJson as any)?.cpName || (currentLogEntry?.detailsJson as any)?.cpName)) ||
                // (activeTab === 'payments' && ((currentWorkflowData?.payloadJson as any)?.recipientName || (currentLogEntry?.detailsJson as any)?.recipientName)) ||
                // (activeTab === 'suretyBond' && ((currentWorkflowData?.payloadJson as any)?.bondName || (currentLogEntry?.detailsJson as any)?.bondName)) ||
                // (activeTab === 'buildPartnerAsset' && ((currentWorkflowData?.payloadJson as any)?.assetName || (currentLogEntry?.detailsJson as any)?.assetName))
              }
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CancelOutlinedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, pt: '16px', overflowY: 'auto' }}>
          {children ?? (
            <>
              <Section title="" fields={transactionDetails} />

              {currentLogEntry && (
                <Box sx={{ mt: 0 }}>
                  <span>{String(currentLogEntry.eventType)}</span>
                </Box>
              )}

              <Box className="w-full h-px mt-3 bg-gray-800" />

              {/* Dynamic Stepper */}
              <Box sx={{ mt: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {dynamicSteps.map((step, index) => {
                    const stepLabel =
                      typeof step === 'string' ? step : step.label
                    const _stepOrder =
                      typeof step === 'string' ? 0 : step.stageOrder

                    const isInitiationStage = stepLabel
                      .toLowerCase()
                      .includes('initiation')
                    const isActive = index === activeStep
                    const isCompleted = isInitiationStage || index < activeStep

                    return (
                      <Step
                        key={`${typeof step === 'string' ? step : step.id}-${typeof step === 'string' ? 0 : step.stageOrder}`}
                        completed={isCompleted}
                        active={isActive}
                      >
                        <StepLabel>
                          <div>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: isActive
                                  ? '#3b82f6'
                                  : isCompleted
                                    ? '#3b82f6'
                                    : '#1e293b',
                                fontFamily:
                                  'var(--font-outfit), system-ui, sans-serif',
                              }}
                            >
                              {stepLabel}
                              {isActive && ' (Current)'}
                              {isCompleted && ' ✓'}
                            </div>
                          </div>
                        </StepLabel>
                      </Step>
                    )
                  })}
                </Stepper>
              </Box>
              {workflowRequestLogsData?.content &&
                workflowRequestLogsData.content.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      sx={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: '#1e293b',
                        mb: 2,
                        fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                      }}
                    >
                      Workflow Request Logs
                    </Typography>
                    <Box>
                      {workflowRequestLogsData.content
                        .sort(
                          (a, b) =>
                            new Date(b.eventAt as string).getTime() -
                            new Date(a.eventAt as string).getTime()
                        )
                        .map((log) => {
                          const displayUser =
                            resolveUserName(log.eventByUser as string) || 'N/A'

                          return (
                            <Box
                              key={String(log.id)}
                              sx={{
                                p: 3,
                                mb: 2,
                                backgroundColor: '#ffffff',
                                borderRadius: 2,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              <Box sx={{ mb: 1.5 }}>
                                <Typography
                                  sx={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontFamily:
                                      'var(--font-outfit), system-ui, sans-serif',
                                  }}
                                >
                                  {String(log.eventType || 'Unknown Event')}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr 1fr',
                                  gap: 2,
                                }}
                              >
                                <Box>
                                  <Typography
                                    sx={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#64748b',
                                      fontFamily:
                                        'var(--font-outfit), system-ui, sans-serif',
                                      mb: 0.5,
                                    }}
                                  >
                                    Event By User
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      fontFamily:
                                        'var(--font-outfit), system-ui, sans-serif',
                                    }}
                                  >
                                    {displayUser}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#64748b',
                                      fontFamily:
                                        'var(--font-outfit), system-ui, sans-serif',
                                      mb: 0.5,
                                    }}
                                  >
                                    Event By Group
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      fontFamily:
                                        'var(--font-outfit), system-ui, sans-serif',
                                    }}
                                  >
                                    {String(log.eventByGroup || 'N/A')}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#64748b',
                                      fontFamily:
                                        'var(--font-outfit), system-ui, sans-serif',
                                      mb: 0.5,
                                    }}
                                  >
                                    Event Date & Time
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      fontFamily:
                                        'var(--font-outfit), system-ui, sans-serif',
                                    }}
                                  >
                                    {log.eventAt
                                      ? new Date(
                                          log.eventAt as string
                                        ).toLocaleString('en-GB', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit',
                                        })
                                      : 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          )
                        })}
                    </Box>
                  </Box>
                )}
              {/* Audit Trail - Tracker Style */}
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#1e293b',
                    mb: 3,
                    fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                  }}
                >
                  Audit Trail
                </Typography>

                {/* Timeline Container */}
                <Box
                  sx={{
                    position: 'relative',
                    pl: 3,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 12,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: '#e5e7eb',
                    },
                  }}
                >
                  {auditTrail.map((item, index) => {
                    const isLast = index === auditTrail.length - 1
                    const isApproval = (item as Record<string, unknown>)
                      .isApproval
                    const isCompleted =
                      item.timestamp &&
                      item.timestamp !== 'Pending' &&
                      item.timestamp !== 'N/A'

                    return (
                      <Box
                        key={
                          String((item as Record<string, unknown>).id) || index
                        }
                        sx={{
                          position: 'relative',
                          mb: isLast ? 0 : 3,
                        }}
                      >
                        {/* Timeline Node */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: -21,
                            top: 8,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: isCompleted
                              ? isApproval
                                ? '#10b981'
                                : '#3b82f6'
                              : '#9ca3af',
                            border: '3px solid #ffffff',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                          }}
                        >
                          {isCompleted && isApproval && (
                            <Box
                              sx={{
                                width: 8,
                                height: 6,
                                border: '2px solid white',
                                borderTop: 'none',
                                borderRight: 'none',
                                transform: 'rotate(-45deg)',
                              }}
                            />
                          )}
                          {isCompleted && !isApproval && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: 'white',
                              }}
                            />
                          )}
                          {!isCompleted && (
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: 'white',
                              }}
                            />
                          )}
                        </Box>

                        {/* Content Card */}
                        <Box
                          sx={{
                            backgroundColor: '#ffffff',
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            p: 3,
                            ml: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          {/* Header */}
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              sx={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: isCompleted
                                  ? isApproval
                                    ? '#10b981'
                                    : '#3b82f6'
                                  : '#6b7280',
                                fontFamily:
                                  'var(--font-outfit), system-ui, sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                mb: 0.5,
                              }}
                            >
                              {String(item.action)}
                            </Typography>

                            {Boolean((item as Record<string, unknown>).role) &&
                              String((item as Record<string, unknown>).role) !==
                                'Unknown' && (
                                <Typography
                                  sx={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    fontFamily:
                                      'var(--font-outfit), system-ui, sans-serif',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                  }}
                                >
                                  Role:{' '}
                                  {String(
                                    (item as Record<string, unknown>).role || ''
                                  )}
                                </Typography>
                              )}
                          </Box>

                          {/* Details Grid */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 1fr 1fr',
                              },
                              gap: 2,
                            }}
                          >
                            {/* User */}
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#9ca3af',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  mb: 1,
                                }}
                              >
                                User
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {item.user || 'System'}
                              </Typography>
                            </Box>

                            {/* Group */}
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#9ca3af',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  mb: 1,
                                }}
                              >
                                Group
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                }}
                              >
                                {String(
                                  (item as Record<string, unknown>).group
                                ) || 'N/A'}
                              </Typography>
                            </Box>

                            {/* Timestamp */}
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#9ca3af',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  mb: 1,
                                }}
                              >
                                Timestamp
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: isCompleted ? '#1e293b' : '#f59e0b',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                }}
                              >
                                {item.timestamp || 'Pending'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Status Badge */}
                          {isCompleted && (
                            <Box
                              sx={{
                                mt: 2,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 0.5,
                                backgroundColor: isApproval
                                  ? '#dcfce7'
                                  : '#dbeafe',
                                borderRadius: 2,
                                border: `1px solid ${isApproval ? '#bbf7d0' : '#bfdbfe'}`,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: isApproval
                                    ? '#10b981'
                                    : '#3b82f6',
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: isApproval ? '#065f46' : '#1e40af',
                                  fontFamily:
                                    'var(--font-outfit), system-ui, sans-serif',
                                }}
                              >
                                {isApproval ? 'Completed' : 'Processed'}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </>
          )}
        </DialogContent>

        <Box sx={{ mt: 'auto', pt: 1, display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleApprove}
            disabled={!canPerformAction}
            sx={{
              backgroundColor: !canPerformAction ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontFamily: 'var(--font-outfit), system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: !canPerformAction ? '#9ca3af' : '#2563eb',
              },
              '&:disabled': {
                backgroundColor: '#9ca3af',
                color: 'white',
              },
            }}
          >
            {isAllStepsCompleted ? 'Completed' : 'Approve'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleReject}
            disabled={!canPerformAction}
            sx={{
              backgroundColor: !canPerformAction ? '#9ca3af' : '#ef4444',
              color: 'white',
              fontFamily: 'var(--font-outfit), system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: !canPerformAction ? '#9ca3af' : '#dc2626',
              },
              '&:disabled': {
                backgroundColor: '#9ca3af',
                color: 'white',
              },
            }}
          >
            {isAllStepsCompleted ? 'Completed' : 'Reject'}
          </Button>
        </Box>

        <CommentModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setComment('')
            setActionType(null)
          }}
          title={
            actionType === 'approve' ? 'Approval Comment' : 'Rejection Comment'
          }
          subtitle={`Transaction ID • ${transactionId ?? 'TXN12345'}`}
          actions={[
            {
              label: 'Cancel',
              color: 'secondary',
              onClick: () => {
                setModalOpen(false)
                setComment('')
                setActionType(null)
              },
            },
            {
              label: actionType === 'approve' ? 'Approve' : 'Reject',
              color: actionType === 'approve' ? 'primary' : 'error',
              onClick: () => {
                if (actionType) {
                  handleCommentSubmit(comment, actionType)
                }
              },
              disabled:
                createWorkflowExecutionMutation.isPending || !comment.trim(),
            },
          ]}
        >
          <TextareaAutosize
            minRows={4}
            placeholder="Write your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 font-sans text-sm border rounded-lg outline-none resize-y mt-7 border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </CommentModal>

        <CommentModal
          open={permissionDeniedModalOpen}
          onClose={handlePermissionDeniedModalClose}
          title="Permission Denied"
          subtitle="Access Restricted"
          actions={[
            {
              label: 'Go to Dashboard',
              color: 'primary',
              onClick: handlePermissionDeniedModalClose,
            },
          ]}
        >
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#ef4444',
                fontFamily: 'var(--font-outfit), system-ui, sans-serif',
                mb: 2,
              }}
            >
              {permissionDeniedMessage}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#64748b',
                fontFamily: 'var(--font-outfit), system-ui, sans-serif',
              }}
            >
              You will be redirected to the dashboard.
            </Typography>
          </Box>
        </CommentModal>
      </Drawer>
    </>
  )
}
