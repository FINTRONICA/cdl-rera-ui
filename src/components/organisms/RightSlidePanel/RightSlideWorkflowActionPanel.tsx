'use client'

import React, { useEffect, useState, useCallback } from 'react'
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
} from '@mui/material'
import { Controller, useForm, FieldErrors } from 'react-hook-form'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

import {
  useCreateWorkflowAction,
  useUpdateWorkflowAction,
} from '@/hooks/workflow'
import type {
  WorkflowActionUIData,
  CreateWorkflowActionRequest,
  UpdateWorkflowActionRequest,
} from '@/services/api/workflowApi'
import { getLabelByConfigId as getWorkflowActionLabel } from '@/constants/mappings/workflowMapping'
import { getWorkflowActionValidationRules } from '@/lib/validation/workflowActionSchemas'

interface RightSlideWorkflowActionPanelProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'add' | 'edit' | 'view'
  actionData?: WorkflowActionUIData | null
}

type ActionFormData = {
  actionKey: string
  actionName: string
  moduleCode: string
  description: string
  name: string
}

const DEFAULT_VALUES: ActionFormData = {
  actionKey: '',
  actionName: '',
  moduleCode: '',
  description: '',
  name: '',
}

export const RightSlideWorkflowActionPanel: React.FC<
  RightSlideWorkflowActionPanelProps
> = ({ isOpen, onClose, mode = 'add', actionData }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createAction = useCreateWorkflowAction()
  const updateAction = useUpdateWorkflowAction()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting: isFormSubmitting, isDirty },
    clearErrors,
  } = useForm<ActionFormData>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const isSubmitting =
    createAction.isPending || updateAction.isPending || isFormSubmitting

  useEffect(() => {
    if (!isOpen) return

    const values: ActionFormData =
      mode === 'edit' && actionData
        ? {
            actionKey: actionData.actionKey ?? '',
            actionName: actionData.actionName ?? '',
            moduleCode: actionData.moduleCode ?? '',
            description: actionData.description ?? '',
            name: actionData.name ?? '',
          }
        : DEFAULT_VALUES

    reset(values, { keepDirty: false })
    clearErrors()
    setErrorMessage(null)
  }, [isOpen, mode, actionData, reset, clearErrors])

  const onSubmit = (data: ActionFormData) => {
    try {
      if (isSubmitting) {
        return
      }

      if (!isDirty) {
        setErrorMessage('No changes to save.')
        return
      }

      setErrorMessage(null)

      if (mode === 'edit') {
        if (typeof actionData?.id !== 'number') {
          setErrorMessage('Invalid or missing action ID for update')
          return
        }
        const updatePayload: UpdateWorkflowActionRequest = {
          id: actionData.id,
          actionKey: data.actionKey.trim(),
          actionName: data.actionName.trim(),
          moduleCode: data.moduleCode.trim(),
          name: data.name.trim(),
          ...(data.description?.trim() && {
            description: data.description.trim(),
          }),
        }

        try {
          const jsonString = JSON.stringify(updatePayload)
          JSON.parse(jsonString)
        } catch (errors) {
          setErrorMessage(
            `${errors}Invalid data format - cannot serialize to JSON`
          )
          return
        }

        if (!updatePayload.id || updatePayload.id <= 0) {
          setErrorMessage(
            'Invalid or missing record ID - cannot update this record'
          )
          return
        }

        updateAction.mutate(
          { id: actionData.id.toString(), updates: updatePayload },
          {
            onSuccess: () => {
              setTimeout(() => {
                onClose()
              }, 1000)
            },
            onError: (err: Error | unknown) => {
              setErrorMessage(`${err}Update workflow action error`)
            },
          }
        )
      } else {
        const createPayload: CreateWorkflowActionRequest = {
          actionKey: data.actionKey.trim(),
          actionName: data.actionName.trim(),
          moduleCode: data.moduleCode.trim(),
          name: data.name.trim(),
          description: data.description?.trim() || '',
        }

        createAction.mutate(createPayload, {
          onSuccess: () => {
            setTimeout(() => {
              onClose()
            }, 1000)
          },
        })
      }
    } catch (error) {
      setErrorMessage(`${error}An unexpected error occurred. Please try again`)
    }
  }

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

  const isViewMode = mode === 'view'
  const validationRules = getWorkflowActionValidationRules()

  const renderTextField = (
    name: keyof ActionFormData,
    label: string,
    type: 'text' | 'number' = 'text',
    gridSize: number = 12,
    required: boolean = true
  ) => {
    const fieldRules = validationRules[name] || {}

    return (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          rules={fieldRules}
          render={({ field, fieldState }) => {
            const hasError = !!fieldState.error

            // Field styles with error state - red border when error
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

            // Label styles with red asterisk for required fields
            const labelStyles = {
              ...labelSx,
              color: hasError ? '#ef4444' : '#6A7282',
              '& .MuiFormLabel-asterisk': {
                color: required ? '#ef4444' : 'inherit', // Red asterisk for required fields
              },
              '&.Mui-focused': {
                color: hasError ? '#ef4444' : '#2563EB',
              },
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
                  InputProps={{ sx: valueSx }}
                  sx={fieldStyles}
                  onChange={(e) => {
                    let value = e.target.value
                    if (
                      type === 'text' &&
                      (name === 'moduleCode' ||
                        name === 'actionName' ||
                        name === 'actionKey' ||
                        name === 'name')
                    ) {
                      value = value.replace(/[0-9]/g, '')
                    }
                    const finalValue = type === 'number' ? Number(value) : value
                    field.onChange(finalValue)
                  }}
                  onBlur={field.onBlur}
                />
              </Box>
            )
          }}
        />
      </Grid>
    )
  }

  const handleResetToLoaded = useCallback(() => {
    const loaded: ActionFormData =
      mode === 'edit' && actionData
        ? {
            actionKey: actionData.actionKey ?? '',
            actionName: actionData.actionName ?? '',
            moduleCode: actionData.moduleCode ?? '',
            description: actionData.description ?? '',
            name: actionData.name ?? '',
          }
        : DEFAULT_VALUES
    reset(loaded, { keepDirty: false })
    clearErrors()
  }, [mode, actionData, reset, clearErrors])

  const onError = (errors: FieldErrors<ActionFormData>) => {
    console.log(errors)
  }

  const handleDrawerClose = (
    _event: React.KeyboardEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      onClose()
    }
  }

  const isFormDirty = isDirty
  const canSave = isFormDirty && !isSubmitting && !isViewMode
  const canReset = isFormDirty && !isSubmitting && !isViewMode

  return (
    <>
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
              {mode === 'edit' ? 'Edit Workflow Action' : 'Add Workflow Action'}
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
                'actionKey',
                getWorkflowActionLabel('CDL_WA_ACTION_KEY'),
                'text',
                12,
                true
              )}
              {renderTextField(
                'actionName',
                getWorkflowActionLabel('CDL_WA_ACTION_NAME'),
                'text',
                12,
                true
              )}
              {renderTextField(
                'moduleCode',
                getWorkflowActionLabel('CDL_WA_MODULE_CODE'),
                'text',
                12,
                true
              )}
              {renderTextField(
                'name',
                getWorkflowActionLabel('CDL_WA_NAME'),
                'text',
                12,
                true
              )}
              {renderTextField(
                'description',
                getWorkflowActionLabel('CDL_WA_DESCRIPTION'),
                'text',
                12,
                false
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
    </>
  )
}
