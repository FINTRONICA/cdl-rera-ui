'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Drawer,
  Box,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import { Controller, useForm, FieldErrors } from 'react-hook-form'
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { getLabelByConfigId as getWorkflowAmountStageOverrideLabel } from '@/constants/mappings/workflowMapping'

import {
  useCreateWorkflowAmountStageOverride,
  useUpdateWorkflowAmountStageOverride,
  useWorkflowAmountRules,
} from '@/hooks/workflow'
import type {
  WorkflowAmountStageOverrideUIData,
  CreateWorkflowAmountStageOverrideRequest,
  UpdateWorkflowAmountStageOverrideRequest,
} from '@/services/api/workflowApi'
import {
  getWorkflowAmountStageOverrideValidationRules,
  validateStageOrderAndRequiredApprovals,
} from '@/lib/validation'

interface RightSlideWorkflowAmountStageOverridePanelProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'add' | 'edit' | 'view'
  stageOverrideData?: WorkflowAmountStageOverrideUIData | null
}

type StageOverrideFormData = {
  stageOrder: number | string
  requiredApprovals: number | string
  keycloakGroup: string
  stageKey: string
  amountRuleName: string
}

const DEFAULT_VALUES: StageOverrideFormData = {
  stageOrder: '',
  requiredApprovals: '',
  keycloakGroup: '',
  stageKey: '',
  amountRuleName: '',
}

const commonFieldStyles = (hasError: boolean) => ({
  '& .MuiOutlinedInput-root': {
    height: '46px',
    borderRadius: '8px',
    '& fieldset': {
      borderColor: hasError ? '#ef4444' : '#CAD5E2',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: hasError ? '#ef4444' : '#CAD5E2',
    },
    '&.Mui-focused fieldset': {
      borderColor: hasError ? '#ef4444' : '#2563EB',
    },
  },
})

const labelSx = {
  color: '#6A7282',
  fontFamily: 'Outfit',
  fontWeight: 400,
  fontStyle: 'normal',
  fontSize: '12px',
  letterSpacing: 0,
}

const valueSx = {
  fontFamily: 'Outfit',
  fontWeight: 400,
  fontStyle: 'normal',
  fontSize: '14px',
  letterSpacing: 0,
  wordBreak: 'break-word',
}

export const RightSlideWorkflowAmountStageOverridePanel: React.FC<
  RightSlideWorkflowAmountStageOverridePanelProps
> = ({ isOpen, onClose, mode = 'add', stageOverrideData }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedWorkflowAmountRuleId, setSelectedWorkflowAmountRuleId] =
    useState<number | null>(null)

  const { data: workflowAmountRulesData, isLoading: isLoadingRules } =
    useWorkflowAmountRules(0, 100)
  const validationRules = getWorkflowAmountStageOverrideValidationRules()
  const createStageOverride = useCreateWorkflowAmountStageOverride()
  const updateStageOverride = useUpdateWorkflowAmountStageOverride()

  const availableAmountRuleNames = useMemo(() => {
    if (!workflowAmountRulesData?.content) return []

    const amountRuleNames = workflowAmountRulesData.content.map((rule) => ({
      amountRuleName: `RULE_${rule.id}`,
      id: rule.id,
    }))

    const uniqueAmountRuleNames = amountRuleNames.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.amountRuleName === item.amountRuleName)
    )

    return uniqueAmountRuleNames
  }, [workflowAmountRulesData])

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting: isFormSubmitting, isDirty },
    clearErrors,
    watch,
    setError,
    setValue,
  } = useForm<StageOverrideFormData>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const isSubmitting =
    createStageOverride.isPending ||
    updateStageOverride.isPending ||
    isFormSubmitting ||
    isLoadingRules
  const isViewMode = mode === 'view'

  const isFormDirty = isDirty
  const canSave = isFormDirty && !isSubmitting && !isViewMode
  const canReset = isFormDirty && !isSubmitting && !isViewMode

  const handleAmountRuleNameChange = useCallback(
    (amountRuleName: string) => {
      const selectedRule = availableAmountRuleNames.find(
        (rule) => rule.amountRuleName === amountRuleName
      )
      if (selectedRule && typeof selectedRule.id === 'number') {
        setSelectedWorkflowAmountRuleId(selectedRule.id)
      } else {
        setSelectedWorkflowAmountRuleId(null)
      }
    },
    [availableAmountRuleNames]
  )

  useEffect(() => {
    if (
      workflowAmountRulesData?.content &&
      workflowAmountRulesData.content.length > 0 &&
      !selectedWorkflowAmountRuleId
    ) {
      const firstRule = workflowAmountRulesData.content[0]
      if (firstRule && typeof firstRule.id === 'number') {
        setSelectedWorkflowAmountRuleId(firstRule.id)
      }
    }
  }, [workflowAmountRulesData, selectedWorkflowAmountRuleId])

  const watchedStageOrder = watch('stageOrder')
  const watchedRequiredApprovals = watch('requiredApprovals')

  useEffect(() => {
    if (!isOpen) return

    // Clear previous cross-field errors
    clearErrors(['stageOrder', 'requiredApprovals'])

    // Auto-set requiredApprovals to 0 when stageOrder is 0
    const stageOrderValue =
      watchedStageOrder === '' || watchedStageOrder === null
        ? 0
        : Number(watchedStageOrder)
    if (
      stageOrderValue === 0 &&
      watchedRequiredApprovals !== '' &&
      watchedRequiredApprovals !== null &&
      Number(watchedRequiredApprovals) > 0
    ) {
      setValue('requiredApprovals', 0)
    }

    const validationResult = validateStageOrderAndRequiredApprovals(
      watchedStageOrder,
      watchedRequiredApprovals
    )

    if (validationResult !== true) {
      if (
        validationResult.includes(
          'At least one of Stage Order or Required Approvals must be greater than 0'
        )
      ) {
        setError('stageOrder', {
          type: 'manual',
          message: validationResult,
        })
        setError('requiredApprovals', {
          type: 'manual',
          message: validationResult,
        })
      } else {
        setError('requiredApprovals', {
          type: 'manual',
          message: validationResult,
        })
      }
    }
  }, [
    watchedStageOrder,
    watchedRequiredApprovals,
    isOpen,
    clearErrors,
    setError,
    setValue,
  ])

  useEffect(() => {
    if (!isOpen) return

    const values: StageOverrideFormData =
      mode === 'edit' && stageOverrideData
        ? {
            stageOrder: stageOverrideData.stageOrder ?? '',
            requiredApprovals: stageOverrideData.requiredApprovals ?? '',
            keycloakGroup: stageOverrideData.keycloakGroup ?? '',
            stageKey: stageOverrideData.stageKey ?? '',
            amountRuleName:
              stageOverrideData.workflowAmountRuleName ||
              `RULE_${stageOverrideData.workflowAmountRuleId}`,
          }
        : DEFAULT_VALUES

    // Set the workflow amount rule ID for edit mode
    if (mode === 'edit' && stageOverrideData?.workflowAmountRuleId) {
      setSelectedWorkflowAmountRuleId(stageOverrideData.workflowAmountRuleId)
    }

    reset(values, { keepDirty: false })
    clearErrors()
    setErrorMessage(null)
  }, [isOpen, mode, stageOverrideData, reset, clearErrors])

  const onSubmit = (data: StageOverrideFormData) => {
    setErrorMessage(null)

    if (!selectedWorkflowAmountRuleId) {
      setErrorMessage('Please select a workflow amount rule')
      return
    }

    if (!data.keycloakGroup?.trim()) {
      setErrorMessage('Keycloak Group is required')
      return
    }

    if (!data.stageKey?.trim()) {
      setErrorMessage('Stage Key is required')
      return
    }

    const validationResult = validateStageOrderAndRequiredApprovals(
      data.stageOrder,
      data.requiredApprovals
    )

    if (validationResult !== true) {
      setErrorMessage(validationResult)
      return
    }

    const stageOrderValue =
      data.stageOrder === '' || data.stageOrder === null
        ? 0
        : Number(data.stageOrder)
    const requiredApprovalsValue =
      data.requiredApprovals === '' || data.requiredApprovals === null
        ? 0
        : Number(data.requiredApprovals)

    if (stageOrderValue === 0 && requiredApprovalsValue === 0) {
      setErrorMessage(
        'At least one of Stage Order or Required Approvals must be greater than 0'
      )
      return
    }

    if (mode === 'edit') {
      if (typeof stageOverrideData?.id !== 'number') {
        setErrorMessage('Invalid or missing stage override ID for update')
        return
      }

      const updatePayload: UpdateWorkflowAmountStageOverrideRequest = {
        id: stageOverrideData.id,
        stageOrder:
          data.stageOrder === '' || data.stageOrder === null
            ? 0
            : Number(data.stageOrder),
        requiredApprovals:
          data.requiredApprovals === '' || data.requiredApprovals === null
            ? 0
            : Number(data.requiredApprovals),
        keycloakGroup: data.keycloakGroup.trim(),
        stageKey: data.stageKey.trim(),
        workflowAmountRuleId: selectedWorkflowAmountRuleId!,
      }

      updateStageOverride.mutate(
        { id: stageOverrideData.id.toString(), updates: updatePayload },
        {
          onSuccess: () => {
            setTimeout(() => {
              onClose()
            }, 1000)
          },
        }
      )
    } else {
      const createPayload: CreateWorkflowAmountStageOverrideRequest = {
        stageOrder:
          data.stageOrder === '' || data.stageOrder === null
            ? 0
            : Number(data.stageOrder),
        requiredApprovals:
          data.requiredApprovals === '' || data.requiredApprovals === null
            ? 0
            : Number(data.requiredApprovals),
        keycloakGroup: data.keycloakGroup.trim(),
        stageKey: data.stageKey.trim(),
        workflowAmountRuleId: selectedWorkflowAmountRuleId!,
      }

      createStageOverride.mutate(createPayload, {
        onSuccess: () => {
          setTimeout(() => {
            onClose()
          }, 1000)
        },
      })
    }
  }

  const handleResetToLoaded = useCallback(() => {
    const loaded: StageOverrideFormData =
      mode === 'edit' && stageOverrideData
        ? {
            stageOrder: stageOverrideData.stageOrder ?? '',
            requiredApprovals: stageOverrideData.requiredApprovals ?? '',
            keycloakGroup: stageOverrideData.keycloakGroup ?? '',
            stageKey: stageOverrideData.stageKey ?? '',
            amountRuleName:
              stageOverrideData.workflowAmountRuleName ||
              `RULE_${stageOverrideData.workflowAmountRuleId}`, // Set the amount rule name
          }
        : DEFAULT_VALUES
    reset(loaded, { keepDirty: false })
    clearErrors()

    // Reset workflow amount rule ID
    if (mode === 'edit' && stageOverrideData?.workflowAmountRuleId) {
      setSelectedWorkflowAmountRuleId(stageOverrideData.workflowAmountRuleId)
    } else if (
      workflowAmountRulesData?.content &&
      workflowAmountRulesData.content.length > 0
    ) {
      const firstRule = workflowAmountRulesData.content[0]
      if (firstRule && typeof firstRule.id === 'number') {
        setSelectedWorkflowAmountRuleId(firstRule.id)
      }
    }
  }, [mode, stageOverrideData, reset, clearErrors, workflowAmountRulesData])

  const onError = (errors: FieldErrors<StageOverrideFormData>) => {
    console.log(errors)
    // No error handling needed since validation is removed
  }

  const renderTextField = (
    name: keyof StageOverrideFormData,
    label: string,
    type: 'text' | 'number' = 'text',
    gridSize: number = 12,
    required: boolean = true,
    showRedAsterisk: boolean = false
  ) => {
    const fieldLabelSx = {
      ...labelSx,
      ...(showRedAsterisk && {
        '& .MuiFormLabel-asterisk': {
          color: '#ef4444',
        },
      }),
    }

    const fieldRules =
      validationRules[name as keyof typeof validationRules] || {}

    if (name === 'amountRuleName') {
      return (
        <Grid key={name} size={{ xs: 12, md: gridSize }}>
          <Controller
            name={name}
            control={control}
            rules={{
              required: 'Amount Rule Name is required',
              validate: (value: string | number | null | undefined) => {
                if (!value || value === '' || value === null) {
                  return 'Amount Rule Name is required'
                }
                return true
              },
            }}
            render={({ field, fieldState }) => {
              const hasError = !!fieldState.error

              const fieldStyles = {
                '& .MuiOutlinedInput-root': {
                  height: '46px',
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: hasError ? '#ef4444' : '#CAD5E2',
                    borderWidth: hasError ? '2px' : '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: hasError ? '#ef4444' : '#CAD5E2',
                    borderWidth: hasError ? '2px' : '1px',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: hasError ? '#ef4444' : '#2563EB',
                    borderWidth: hasError ? '2px' : '2px',
                  },
                },
              }

              const dynamicLabelSx = {
                ...fieldLabelSx,
                ...(hasError && {
                  color: '#ef4444',
                  '& .MuiFormLabel-asterisk': {
                    color: '#ef4444',
                  },
                }),
                '&.Mui-focused': {
                  color: '#2563EB',
                },
              }

              return (
                <TextField
                  {...field}
                  type={type}
                  label={label}
                  fullWidth
                  disabled={isSubmitting || isViewMode}
                  required={required}
                  error={hasError}
                  helperText={
                    hasError
                      ? fieldState.error?.message || 'Supporting text'
                      : ''
                  }
                  InputLabelProps={{ sx: dynamicLabelSx }}
                  InputProps={{ sx: valueSx }}
                  sx={fieldStyles}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value)
                  }}
                />
              )
            }}
          />
        </Grid>
      )
    }

    return (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          rules={fieldRules}
          render={({ field, fieldState }) => {
            const hasError = !!fieldState.error

            const fieldStyles = {
              '& .MuiOutlinedInput-root': {
                height: '46px',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: hasError ? '#ef4444' : '#CAD5E2',
                  borderWidth: hasError ? '2px' : '1px',
                },
                '&:hover fieldset': {
                  borderColor: hasError ? '#ef4444' : '#CAD5E2',
                  borderWidth: hasError ? '2px' : '1px',
                },
                '&.Mui-focused fieldset': {
                  borderColor: hasError ? '#ef4444' : '#2563EB',
                  borderWidth: hasError ? '2px' : '2px',
                },
              },
            }

            const dynamicLabelSx = {
              ...fieldLabelSx,
              ...(hasError && {
                color: '#ef4444',
                '& .MuiFormLabel-asterisk': {
                  color: '#ef4444',
                },
              }),
              '&.Mui-focused': {
                color: '#2563EB',
              },
            }

            return (
              <TextField
                {...field}
                type={type}
                label={label}
                fullWidth
                disabled={isSubmitting || isViewMode}
                required={required}
                error={hasError}
                helperText={
                  hasError ? fieldState.error?.message || 'Supporting text' : ''
                }
                InputLabelProps={{ sx: dynamicLabelSx }}
                InputProps={{
                  sx: valueSx,
                  inputProps: {
                    maxLength: type === 'number' ? 2 : undefined,
                    pattern:
                      type === 'number'
                        ? '([0-9]|10)'
                        : name === 'keycloakGroup' || name === 'stageKey'
                          ? '[a-zA-Z\\s\\-_]*'
                          : undefined,
                  },
                }}
                sx={fieldStyles}
                onChange={(e) => {
                  const value = e.target.value
                  if (type === 'number') {
                    const numericValue = value
                      .replace(/[^0-9]/g, '')
                      .slice(0, 2)

                    if (numericValue === '') {
                      field.onChange('')
                    } else {
                      const numValue = Number(numericValue)

                      if (name === 'requiredApprovals') {
                        const currentStageOrder =
                          watchedStageOrder === '' || watchedStageOrder === null
                            ? 0
                            : Number(watchedStageOrder)
                        if (currentStageOrder === 0 && numValue > 0) {
                          field.onChange(0)
                          return
                        }
                      }

                      if (name === 'stageOrder') {
                        const currentRequiredApprovals =
                          watchedRequiredApprovals === '' ||
                          watchedRequiredApprovals === null
                            ? 0
                            : Number(watchedRequiredApprovals)
                        if (currentRequiredApprovals === 0 && numValue === 0) {
                          field.onChange(numValue)
                          return
                        }
                      }

                      if (numValue > 10) {
                        field.onChange(10)
                      } else {
                        field.onChange(isNaN(numValue) ? '' : numValue)
                      }
                    }
                  } else if (
                    type === 'text' &&
                    (name === 'keycloakGroup' || name === 'stageKey')
                  ) {
                    const textValue = value.replace(/[0-9]/g, '')
                    field.onChange(textValue)
                  } else {
                    field.onChange(value)
                  }
                }}
              />
            )
          }}
        />
      </Grid>
    )
  }

  type OptionItem = {
    label: string
    value: string | number
    id?: string | number
  }

  const renderSelectField = (
    name: keyof StageOverrideFormData,
    label: string,
    options?: OptionItem[] | string[],
    gridSize: number = 6,
    required: boolean = true,
    showRedAsterisk: boolean = false,
    extraProps: {
      isLoading?: boolean
      disabled?: boolean
      onChange?: (value: string | number) => void
      placeholder?: string
    } = {}
  ) => {
    const resolvedOptions: OptionItem[] | string[] =
      options && options.length > 0 ? options : []

    const baseLabelSx = {
      ...labelSx,
      ...(showRedAsterisk && {
        '& .MuiFormLabel-asterisk': {
          color: '#ef4444',
        },
      }),
    }

    const fieldRules =
      validationRules[name as keyof typeof validationRules] || {}

    return (
      <Grid key={String(name)} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          defaultValue={''}
          rules={fieldRules}
          render={({ field, fieldState }) => {
            const hasError = !!fieldState.error

            const fieldStyles = {
              '& .MuiOutlinedInput-root': {
                height: '46px',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: hasError ? '#ef4444' : '#CAD5E2',
                  borderWidth: hasError ? '2px' : '1px',
                },
                '&:hover fieldset': {
                  borderColor: hasError ? '#ef4444' : '#CAD5E2',
                  borderWidth: hasError ? '2px' : '1px',
                },
                '&.Mui-focused fieldset': {
                  borderColor: hasError ? '#ef4444' : '#2563EB',
                  borderWidth: hasError ? '2px' : '2px',
                },
              },
            }

            const dynamicLabelSx = {
              ...baseLabelSx,
              ...(hasError && {
                color: '#ef4444',
                '& .MuiFormLabel-asterisk': {
                  color: '#ef4444',
                },
              }),
              '&.Mui-focused': {
                color: '#2563EB',
              },
            }

            return (
              <FormControl
                fullWidth
                error={hasError}
                disabled={!!extraProps.disabled || !!extraProps.isLoading}
              >
                <InputLabel
                  sx={dynamicLabelSx}
                  id={`${String(name)}-label`}
                  required={required}
                >
                  {extraProps.placeholder ?? label}
                </InputLabel>

                <Select
                  labelId={`${String(name)}-label`}
                  id={`${String(name)}-select`}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value
                    field.onChange(val)
                    if (extraProps.onChange) extraProps.onChange(val)
                  }}
                  onBlur={field.onBlur}
                  disabled={!!extraProps.disabled || !!extraProps.isLoading}
                  label={extraProps.placeholder ?? label}
                  sx={{
                    ...commonFieldStyles(false),
                    ...valueSx,
                    ...fieldStyles,
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                >
                  {extraProps.isLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Loading {label.toLowerCase()}...
                    </MenuItem>
                  ) : Array.isArray(resolvedOptions) &&
                    resolvedOptions.length > 0 ? (
                    resolvedOptions.map((opt) =>
                      typeof opt === 'string' ? (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ) : (
                        <MenuItem key={opt.id ?? opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      )
                    )
                  ) : (
                    <MenuItem disabled>
                      No {label.toLowerCase()} available
                    </MenuItem>
                  )}
                </Select>

                {hasError && (
                  <FormHelperText>
                    {fieldState.error?.message ?? 'Supporting text'}
                  </FormHelperText>
                )}
              </FormControl>
            )
          }}
        />
      </Grid>
    )
  }

  const handleDrawerClose = (
    _event: React.KeyboardEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      onClose()
    }
  }

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleDrawerClose}
      PaperProps={{
        sx: {
          width: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <DialogTitle
            sx={{
              p: 0,
              fontSize: '20px',
              fontWeight: 500,
              fontStyle: 'normal',
            }}
          >
            {mode === 'edit'
              ? 'Edit Workflow Amount Stage Override'
              : 'Add New Workflow Amount Stage Override'}
          </DialogTitle>
          <IconButton onClick={onClose} size="small">
            <CancelOutlinedIcon />
          </IconButton>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <DialogContent dividers>
          {errorMessage && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            </Box>
          )}

          <Grid container rowSpacing={4} columnSpacing={2} mt={3}>
            {renderTextField(
              'stageOrder',
              getWorkflowAmountStageOverrideLabel('CDL_WASO_STAGE_ORDER'),
              'number',
              12,
              true,
              true
            )}
            {renderTextField(
              'requiredApprovals',
              getWorkflowAmountStageOverrideLabel(
                'CDL_WASO_REQUIRED_APPROVALS'
              ),
              'number',
              12,
              true,
              true
            )}
            {renderTextField(
              'keycloakGroup',
              getWorkflowAmountStageOverrideLabel('CDL_WASO_KEYCLOAK_GROUP'),
              'text',
              12,
              true,
              true
            )}
            {renderTextField(
              'stageKey',
              getWorkflowAmountStageOverrideLabel('CDL_WASO_STAGE_KEY'),
              'text',
              12,
              true,
              true
            )}

            {renderSelectField(
              'amountRuleName',
              getWorkflowAmountStageOverrideLabel(
                'CDL_WAR_WORKFLOW_AMOUNT_RULE'
              ),
              availableAmountRuleNames.map((rule) => ({
                label: rule.amountRuleName,
                value: rule.amountRuleName,
                id: rule.id,
              })),
              12,
              true,
              true,
              {
                isLoading: isLoadingRules,
                disabled: isSubmitting || isViewMode,
                onChange: (value: string | number) =>
                  handleAmountRuleNameChange(value as string),
              }
            )}
          </Grid>
        </DialogContent>

        {!isViewMode && (
          <Box
            sx={{
              position: 'relative',
              top: 20,
              left: 0,
              right: 0,
              padding: 2,
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleResetToLoaded}
                  disabled={!canReset}
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    opacity: canReset ? 1 : 0.5,
                  }}
                >
                  Reset
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!canSave}
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    opacity: canSave ? 1 : 0.5,
                  }}
                >
                  {isSubmitting && (
                    <CircularProgress
                      size={20}
                      sx={{
                        color: 'white',
                      }}
                    />
                  )}
                  {isSubmitting
                    ? isLoadingRules
                      ? 'Loading rules...'
                      : mode === 'edit'
                        ? 'Updating...'
                        : 'Creating...'
                    : mode === 'edit'
                      ? 'Update'
                      : 'Save'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </form>
    </Drawer>
  )
}
