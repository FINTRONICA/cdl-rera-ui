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
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { getLabelByConfigId as getWorkflowAmountRuleLabel } from '@/constants/mappings/workflowMapping'
import { getWorkflowAmountRuleValidationRules } from '@/lib/validation'

import {
  useCreateWorkflowAmountRule,
  useUpdateWorkflowAmountRule,
  useWorkflowAmountRuleForm,
  useFindAllWorkflowDefinitions,
} from '@/hooks/workflow'
import type {
  WorkflowAmountRuleUIData,
  CreateWorkflowAmountRuleRequest,
  UpdateWorkflowAmountRuleRequest,
} from '@/services/api/workflowApi'

interface RightSlideWorkflowAmountRulePanelProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'add' | 'edit' | 'view'
  amountRuleData?: WorkflowAmountRuleUIData | null
}

type AmountRuleFormData = {
  currency: string
  minAmount: number
  maxAmount: number
  priority: number
  requiredMakers: number
  requiredCheckers: number
  workflowDefinitionName: string
  enabled: boolean
}

interface WorkflowDefinition {
  id: string | number
  name: string
  version: number
}

const DEFAULT_VALUES: AmountRuleFormData = {
  currency: '',
  minAmount: 1,
  maxAmount: 1,
  priority: 1,
  requiredMakers: 1,
  requiredCheckers: 1,
  workflowDefinitionName: '',
  enabled: true,
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

export const RightSlideWorkflowAmountRulePanel: React.FC<
  RightSlideWorkflowAmountRulePanelProps
> = ({ isOpen, onClose, mode = 'add', amountRuleData }) => {
  const [selectedWorkflowAmountRuleId, setSelectedWorkflowAmountRuleId] =
    useState<number | null>(null)
  const createAmountRule = useCreateWorkflowAmountRule()
  const updateAmountRule = useUpdateWorkflowAmountRule()

  const { isSubmitting: formLoading } = useWorkflowAmountRuleForm()

  const {
    data: workflowDefinitionsResponse,
    isLoading: workflowDefinitionsLoading,
  } = useFindAllWorkflowDefinitions()

  const workflowDefinitionOptions = useMemo(() => {
    if (!workflowDefinitionsResponse?.content) return []

    return workflowDefinitionsResponse.content.map(
      (def: WorkflowDefinition) => ({
        id: def.id,
        label: def.name,
        value: def.id,
        description: `${def.name} (v${def.version}) - Rule_${def.id}`,
      })
    )
  }, [workflowDefinitionsResponse])

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting: isFormSubmitting, isDirty },
    clearErrors,
  } = useForm<AmountRuleFormData>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const isSubmitting =
    createAmountRule.isPending ||
    updateAmountRule.isPending ||
    isFormSubmitting ||
    formLoading ||
    workflowDefinitionsLoading
  const isViewMode = mode === 'view'

  const isFormDirty = isDirty
  const canSave = isFormDirty && !isSubmitting && !isViewMode
  const canReset = isFormDirty && !isSubmitting && !isViewMode

  const handleWorkflowDefinitionChange = useCallback(
    (workflowDefinitionName: string) => {
      try {
        const selectedDefinition = workflowDefinitionOptions.find(
          (option) => option.label === workflowDefinitionName
        )
        if (
          selectedDefinition &&
          typeof selectedDefinition.value === 'number'
        ) {
          setSelectedWorkflowAmountRuleId(selectedDefinition.value)
        } else {
          setSelectedWorkflowAmountRuleId(null)
        }
      } catch {}
    },
    [workflowDefinitionOptions]
  )

  const extractWorkflowDefinitionId = (
    workflowDefinitionDTO: string | Record<string, unknown>
  ): number | null => {
    try {
      if (typeof workflowDefinitionDTO === 'number') {
        return workflowDefinitionDTO
      }

      if (
        workflowDefinitionDTO &&
        typeof workflowDefinitionDTO === 'object' &&
        workflowDefinitionDTO.id
      ) {
        const id = parseInt(workflowDefinitionDTO.id.toString(), 10)
        return isNaN(id) ? null : id
      }

      if (typeof workflowDefinitionDTO === 'string') {
        const id = parseInt(workflowDefinitionDTO, 10)
        return isNaN(id) ? null : id
      }

      return null
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const extractedWorkflowDefinitionId =
      mode === 'edit' && amountRuleData?.workflowDefinitionDTO
        ? extractWorkflowDefinitionId(amountRuleData.workflowDefinitionDTO)
        : null

    const values: AmountRuleFormData =
      mode === 'edit' && amountRuleData
        ? ({
            currency: amountRuleData.currency ?? '',
            minAmount: amountRuleData.minAmount ?? 0,
            maxAmount: amountRuleData.maxAmount ?? 0,
            priority: amountRuleData.priority ?? 0,
            requiredMakers: amountRuleData.requiredMakers ?? 0,
            requiredCheckers: amountRuleData.requiredCheckers ?? 0,
            workflowDefinitionName:
              amountRuleData.workflowDefinitionDTO?.name || '',
            enabled: amountRuleData.enabled ?? true,
          } as AmountRuleFormData)
        : DEFAULT_VALUES

    if (mode === 'edit' && extractedWorkflowDefinitionId) {
      setSelectedWorkflowAmountRuleId(extractedWorkflowDefinitionId)
    }

    reset(values, { keepDirty: false })
    clearErrors()
  }, [isOpen, mode, amountRuleData, reset, clearErrors])

  const onSubmit = (data: AmountRuleFormData) => {
    try {
      if (mode === 'edit') {
        if (!amountRuleData?.id) {
          return
        }

        const updatePayload: UpdateWorkflowAmountRuleRequest = {
          id: Number(amountRuleData.id),
          currency: data.currency.trim(),
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
          priority: data.priority,
          requiredMakers: data.requiredMakers,
          requiredCheckers: data.requiredCheckers,
          workflowDefinitionId: selectedWorkflowAmountRuleId || 0,
          enabled: data.enabled,
        }

        updateAmountRule.mutate(
          { id: String(amountRuleData.id), updates: updatePayload },
          {
            onSuccess: () => {
              setTimeout(() => onClose(), 1000)
            },
          }
        )
      } else {
        const createPayload: CreateWorkflowAmountRuleRequest = {
          currency: data.currency.trim(),
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
          priority: data.priority,
          requiredMakers: data.requiredMakers,
          requiredCheckers: data.requiredCheckers,
          workflowDefinitionId: selectedWorkflowAmountRuleId || 0,
          workflowId: selectedWorkflowAmountRuleId || 0,
          amountRuleName: `Rule_${selectedWorkflowAmountRuleId || ''}`,
          enabled: data.enabled,
        }

        createAmountRule.mutate(createPayload, {
          onSuccess: () => {
            setTimeout(() => onClose(), 1000)
          },
        })
      }
    } catch {}
  }

  const handleResetToLoaded = useCallback(() => {
    try {
      const loaded: AmountRuleFormData =
        mode === 'edit' && amountRuleData
          ? {
              currency: amountRuleData.currency ?? '',
              minAmount: amountRuleData.minAmount ?? 0,
              maxAmount: amountRuleData.maxAmount ?? 0,
              priority: amountRuleData.priority ?? 0,
              requiredMakers: amountRuleData.requiredMakers ?? 0,
              requiredCheckers: amountRuleData.requiredCheckers ?? 0,
              workflowDefinitionName:
                amountRuleData.workflowDefinitionDTO?.name || '',
              enabled: amountRuleData.enabled ?? true,
            }
          : DEFAULT_VALUES

      reset(loaded, { keepDirty: false })
      clearErrors()

      if (mode === 'edit' && amountRuleData?.workflowDefinitionDTO?.id) {
        setSelectedWorkflowAmountRuleId(
          Number(amountRuleData.workflowDefinitionDTO.id)
        )
      } else if (
        workflowDefinitionsResponse?.content &&
        workflowDefinitionsResponse.content.length > 0
      ) {
        const firstDefinition = workflowDefinitionsResponse.content[0]
        if (firstDefinition && typeof firstDefinition.id === 'number') {
          setSelectedWorkflowAmountRuleId(firstDefinition.id)
        }
      }
    } catch {}
  }, [mode, amountRuleData, reset, clearErrors, workflowDefinitionsResponse])

  const onError = () => {}

  type OptionItem = {
    label: string
    value: string | number
    id?: string | number
  }

  const renderSelectField = (
    name: keyof AmountRuleFormData,
    label: string,
    options?: OptionItem[] | string[],
    gridSize: number = 6,
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

    const validationRules = getWorkflowAmountRuleValidationRules()
    const fieldRules =
      validationRules[name as keyof typeof validationRules] || {}

    return (
      <Grid key={String(name)} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          rules={fieldRules}
          defaultValue={''}
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
                  required={true}
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
                  disabled={
                    !!extraProps.disabled ||
                    !!extraProps.isLoading ||
                    isSubmitting ||
                    isViewMode
                  }
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
                  <FormHelperText>{fieldState.error?.message}</FormHelperText>
                )}
              </FormControl>
            )
          }}
        />
      </Grid>
    )
  }

  const renderTextField = (
    name: keyof AmountRuleFormData,
    label: string,
    type: 'text' | 'number' = 'text',
    gridSize: number = 12,
    required: boolean = true
  ) => {
    const validationRules = getWorkflowAmountRuleValidationRules()
    const fieldRules =
      validationRules[name as keyof typeof validationRules] || {}

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

            const labelStyles = {
              ...labelSx,
              color: hasError ? '#ef4444' : '#6A7282',
              '& .MuiFormLabel-asterisk': {
                color: required ? '#ef4444' : 'inherit',
              },
              '&.Mui-focused': {
                color: hasError ? '#ef4444' : '#2563EB',
              },
            }

            const getMaxLength = () => {
              switch (name) {
                case 'currency':
                  return 10
                default:
                  return undefined
              }
            }

            return (
              <Box>
                <TextField
                  {...field}
                  type={type}
                  label={label}
                  fullWidth
                  disabled={isSubmitting || isViewMode}
                  required={required}
                  error={hasError}
                  helperText={hasError ? fieldState.error?.message : ''}
                  InputLabelProps={{ sx: labelStyles }}
                  InputProps={{
                    sx: valueSx,
                    inputProps: {
                      maxLength: getMaxLength(),
                      max:
                        name === 'requiredMakers' || name === 'requiredCheckers'
                          ? 10
                          : name === 'priority'
                            ? 10
                            : undefined,
                      min: name === 'priority' ? 1 : undefined,
                    },
                  }}
                  sx={fieldStyles}
                  onChange={(e) => {
                    let value = e.target.value

                    if (type === 'text') {
                      if (name === 'currency') {
                        value = value.replace(/[^A-Za-z]/g, '')
                      }
                    } else if (type === 'number') {
                      if (value === '') {
                        field.onChange('')
                        return
                      }

                      const numValue = Number(value)
                      if (isNaN(numValue)) {
                        return
                      }

                      if (name === 'priority') {
                        if (numValue < 1) {
                          return
                        }
                        if (numValue > 10) {
                          return
                        }
                        if (value.length > 2) {
                          return
                        }
                      }

                      if (
                        name === 'requiredMakers' ||
                        name === 'requiredCheckers'
                      ) {
                        if (numValue < 1) {
                          return
                        }
                        if (numValue > 10) {
                          return
                        }
                      }

                      if (name === 'minAmount' || name === 'maxAmount') {
                        if (numValue < 0) {
                          return
                        }
                      }
                    }

                    const finalValue = type === 'number' ? Number(value) : value
                    field.onChange(finalValue)
                  }}
                />
              </Box>
            )
          }}
        />
      </Grid>
    )
  }

  const renderCheckboxField = (
    name: keyof AmountRuleFormData,
    label?: string,
    gridSize: number = 6,
    extraProps: {
      disabled?: boolean
      defaultValue?: boolean
      onChange?: (value: boolean) => void
    } = {}
  ) => (
    <Grid key={name} size={{ xs: 12, md: gridSize }}>
      <Controller
        name={name}
        control={control}
        defaultValue={extraProps.defaultValue ?? false}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!field.value}
                onChange={(e) => {
                  const val = (e.target as HTMLInputElement).checked
                  field.onChange(val)
                  if (extraProps.onChange) extraProps.onChange(val)
                }}
                disabled={extraProps.disabled}
                sx={{
                  color: '#CAD5E2',
                  '&.Mui-checked': {
                    color: '#2563EB',
                  },
                }}
              />
            }
            label={
              label ??
              name
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
            }
            sx={{
              '& .MuiFormControlLabel-label': {
                fontFamily: 'Outfit, sans-serif',
                fontStyle: 'normal',
                fontSize: '14px',
                lineHeight: '24px',
                letterSpacing: '0.5px',
                verticalAlign: 'middle',
              },
            }}
          />
        )}
      />
    </Grid>
  )

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
              ? 'Edit Workflow Amount Rule'
              : mode === 'view'
                ? 'View Workflow Amount Rule'
                : 'Add New Workflow Amount Rule'}
          </DialogTitle>
          <IconButton onClick={onClose} size="small">
            <CancelOutlinedIcon />
          </IconButton>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <DialogContent dividers>
          <Grid container rowSpacing={4} columnSpacing={2} mt={3}>
            {renderTextField(
              'currency',
              getWorkflowAmountRuleLabel('CDL_WAR_CURRENCY'),
              'text',
              12,
              true
            )}
            {renderTextField(
              'minAmount',
              getWorkflowAmountRuleLabel('CDL_WAR_MIN_AMOUNT'),
              'number',
              12,
              true
            )}

            {renderTextField(
              'maxAmount',
              getWorkflowAmountRuleLabel('CDL_WAR_MAX_AMOUNT'),
              'number',
              12,
              true
            )}
            {renderTextField(
              'priority',
              getWorkflowAmountRuleLabel('CDL_WAR_PRIORITY'),
              'number',
              12,
              true
            )}
            {renderTextField(
              'requiredMakers',
              getWorkflowAmountRuleLabel('CDL_WAR_REQUIRED_MAKERS'),
              'number',
              12,
              true
            )}
            {renderTextField(
              'requiredCheckers',
              getWorkflowAmountRuleLabel('CDL_WAR_REQUIRED_CHECKERS'),
              'number',
              12
            )}
            {renderSelectField(
              'workflowDefinitionName',
              `${getWorkflowAmountRuleLabel('CDL_WAR_WORKFLOW_DEFINITION')}`,

              workflowDefinitionOptions.map((option) => ({
                label: option.label,
                value: option.label,
                id: option.id,
              })),
              12,
              true,
              {
                isLoading: workflowDefinitionsLoading,
                disabled: isSubmitting || isViewMode,
                onChange: (value: string | number) =>
                  handleWorkflowDefinitionChange(value as string),
              }
            )}

            <Grid size={{ xs: 12 }}>
              {renderCheckboxField(
                'enabled',
                getWorkflowAmountRuleLabel('CDL_WAR_ACTIVE'),
                3,
                { disabled: isSubmitting, defaultValue: true }
              )}
            </Grid>
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
                    ? mode === 'edit'
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
