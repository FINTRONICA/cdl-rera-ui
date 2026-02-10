import React, { useState, useEffect } from 'react'
import {
  DialogTitle,
  DialogContent,
  IconButton,
  Grid,
  TextField,
  Button,
  Drawer,
  Box,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material'
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material'
import { Controller, useForm } from 'react-hook-form'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { BudgetStep2Schema } from '@/lib/validation/budgetSchemas'
import {
  useCreateBudgetItem, 
  useUpdateBudgetItem 
} from '@/hooks/budget/useBudgetItems'
import { BudgetCategoryService } from '@/services/api/budgetApi/budgetCategoryService'
import type { BudgetCategoryUIData } from '@/services/api/budgetApi/budgetCategoryService'
import { useBudgetManagementFirmLabelsApi } from '@/hooks/useBudgetManagementFirmLabelsWithCache'
import { useAppStore } from '@/store'
import { FormError } from '../../atoms/FormError'
import { BUDGET_LABELS } from '@/constants/mappings/budgetLabels'
import type { BudgetItemResponse, BudgetItemRequest } from '@/utils/budgetMapper'

interface RightSlideBudgetItemPanelProps {
  isOpen: boolean
  onClose: () => void
  onBudgetItemAdded?: (item: BudgetItemResponse) => void
  onBudgetItemUpdated?: (item: BudgetItemResponse, index: number) => void
  title?: string
  budgetCategoryId?: string | number | undefined
  budgetId?: number | null
  mode?: 'add' | 'edit'
  budgetItemData?: BudgetItemResponse | null
  budgetItemIndex?: number
}

interface BudgetItemFormData {
  budgetCategoryId: string
  subCategoryCode: string
  subCategoryName: string
  subCategoryNameLocale: string
  serviceCode: string
  provisionalServiceCode: string
  serviceName: string
  serviceNameLocale: string
  totalBudget: string | number
  availableBudget: string | number
  utilizedBudget: string | number
}

export const RightSlideBudgetItemPanel: React.FC<RightSlideBudgetItemPanelProps> = ({
  isOpen,
  onClose,
  onBudgetItemAdded,
  onBudgetItemUpdated,
  budgetCategoryId,
  budgetId,
  mode = 'add',
  budgetItemData,
  budgetItemIndex,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiBudgetItemData, setApiBudgetItemData] = useState<BudgetItemResponse | null>(null)
  const [loadingBudgetItem, setLoadingBudgetItem] = useState(false)
  const [budgetCategoryOptions, setBudgetCategoryOptions] = useState<{ id: number; displayName: string; settingValue: string }[]>([])
  const [loadingBudgetCategories, setLoadingBudgetCategories] = useState(true)

  const { getLabel } = useBudgetManagementFirmLabelsApi()
  const currentLanguage = useAppStore((state) => state.language) || 'EN'
  
  // Use React Query mutations for create and update
  const createMutation = useCreateBudgetItem()
  const updateMutation = useUpdateBudgetItem()

  // Fetch Budget Categories
  useEffect(() => {
    const fetchBudgetCategories = async () => {
      try {
        setLoadingBudgetCategories(true)
        const response = await BudgetCategoryService.getBudgetCategories(0, 1000)
        const options = response.content.map((item: BudgetCategoryUIData) => ({
          id: item.id,
          displayName: item.categoryName || item.serviceName || `Budget Category ${item.id}`,
          settingValue: item.id.toString(),
        }))
        setBudgetCategoryOptions(options)
      } catch (error) {
        console.error('Error fetching budget categories:', error)
        setBudgetCategoryOptions([])
      } finally {
        setLoadingBudgetCategories(false)
      }
    }
    if (isOpen) {
      fetchBudgetCategories()
    }
  }, [isOpen])

  // Fetch budget item by ID if in edit mode
  useEffect(() => {
    const fetchBudgetItem = async () => {
      if (mode === 'edit' && budgetItemData?.id) {
        try {
          setLoadingBudgetItem(true)
          const data = await budgetItemsService.getBudgetItemsById(budgetItemData.id)
          setApiBudgetItemData(data)
        } catch (error) {
          console.error('Error fetching budget item:', error)
          setApiBudgetItemData(null)
        } finally {
          setLoadingBudgetItem(false)
        }
      } else {
        setApiBudgetItemData(null)
      }
    }
    if (isOpen) {
      fetchBudgetItem()
    }
  }, [isOpen, mode, budgetItemData?.id])

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<BudgetItemFormData>({
    defaultValues: {
      budgetCategoryId: budgetCategoryId?.toString() || '',
      subCategoryCode: '',
      subCategoryName: '',
      subCategoryNameLocale: '',
      serviceCode: '',
      provisionalServiceCode: '',
      serviceName: '',
      serviceNameLocale: '',
      totalBudget: '',
      availableBudget: '',
      utilizedBudget: '',
    },
    mode: 'onChange',
  })

  const validateBudgetItemField = (
    fieldName: keyof BudgetItemFormData,
    _value: unknown,
    allValues: BudgetItemFormData
  ) => {
    try {
      const budgetItemForValidation = {
        budgetCategoryId: allValues.budgetCategoryId || budgetCategoryId?.toString() || '',
        budgetItems: [
          {
            subCategoryCode: allValues.subCategoryCode || '',
            subCategoryName: allValues.subCategoryName || '',
            subCategoryNameLocale: allValues.subCategoryNameLocale || '',
            serviceCode: allValues.serviceCode || '',
            provisionalServiceCode: allValues.provisionalServiceCode || '',
            serviceName: allValues.serviceName || '',
            serviceNameLocale: allValues.serviceNameLocale || '',
            totalBudget: typeof allValues.totalBudget === 'string' 
              ? parseFloat(allValues.totalBudget) || 0 
              : allValues.totalBudget || 0,
            availableBudget: typeof allValues.availableBudget === 'string' 
              ? parseFloat(allValues.availableBudget) || 0 
              : allValues.availableBudget || 0,
            utilizedBudget: typeof allValues.utilizedBudget === 'string' 
              ? parseFloat(allValues.utilizedBudget) || 0 
              : allValues.utilizedBudget || 0,
          },
        ],
      }

      const result = BudgetStep2Schema.safeParse(budgetItemForValidation)

      if (result.success) {
        return true
      } else {
        const fieldMapping: Record<string, string> = {
          subCategoryCode: 'subCategoryCode',
          subCategoryName: 'subCategoryName',
          subCategoryNameLocale: 'subCategoryNameLocale',
          serviceCode: 'serviceCode',
          provisionalServiceCode: 'provisionalServiceCode',
          serviceName: 'serviceName',
          serviceNameLocale: 'serviceNameLocale',
          totalBudget: 'totalBudget',
          availableBudget: 'availableBudget',
          utilizedBudget: 'utilizedBudget',
        }

        const schemaFieldName = fieldMapping[fieldName]

        if (!schemaFieldName) {
          return true
        }

        const fieldError = result.error.issues.find(
          (issue) =>
            issue.path.includes('budgetItems') &&
            issue.path.includes(0) &&
            issue.path.includes(schemaFieldName)
        )

        if (fieldError) {
          return fieldError.message
        }

        return true
      }
    } catch {
      return true
    }
  }

  useEffect(() => {
    if (isOpen && mode === 'edit' && (apiBudgetItemData || budgetItemData) && !loadingBudgetItem) {
      const dataToUse = apiBudgetItemData ?? budgetItemData ?? ({} as BudgetItemResponse)
      const categoryId = dataToUse.budgetCategoryDTO?.id?.toString() || budgetCategoryId?.toString() || ''

      reset({
        budgetCategoryId: categoryId,
        subCategoryCode: dataToUse.subCategoryCode || '',
        subCategoryName: dataToUse.subCategoryName || '',
        subCategoryNameLocale: dataToUse.subCategoryNameLocale || '',
        serviceCode: dataToUse.serviceCode || '',
        provisionalServiceCode: dataToUse.provisionalServiceCode || '',
        serviceName: dataToUse.serviceName || '',
        serviceNameLocale: dataToUse.serviceNameLocale || '',
        totalBudget: dataToUse.totalBudget?.toString() || '',
        availableBudget: dataToUse.availableBudget?.toString() || '',
        utilizedBudget: dataToUse.utilizedBudget?.toString() || '',
      })
    } else if (isOpen && mode === 'add') {
      reset({
        budgetCategoryId: budgetCategoryId?.toString() || '',
        subCategoryCode: '',
        subCategoryName: '',
        subCategoryNameLocale: '',
        serviceCode: '',
        provisionalServiceCode: '',
        serviceName: '',
        serviceNameLocale: '',
        totalBudget: '',
        availableBudget: '',
        utilizedBudget: '',
      })
    }
  }, [isOpen, mode, budgetItemData, apiBudgetItemData, reset, loadingBudgetItem, budgetCategoryId])

  const onSubmit = async (data: BudgetItemFormData) => {
    try {
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsSubmitting(true)

      // Trigger validation on all fields to show errors even if not touched
      const isValid = await trigger([
        'budgetCategoryId',
        'subCategoryCode',
        'subCategoryName',
        'serviceCode',
        'serviceName',
        'totalBudget',
        'availableBudget',
        'utilizedBudget',
      ])

      // If field-level validation fails, don't proceed
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      const isEditing = mode === 'edit'
      const selectedCategoryId = data.budgetCategoryId || budgetCategoryId?.toString() || ''

      const budgetItemForValidation = {
        budgetCategoryId: selectedCategoryId,
        budgetItems: [
          {
            subCategoryCode: data.subCategoryCode || '',
            subCategoryName: data.subCategoryName || '',
            subCategoryNameLocale: data.subCategoryNameLocale || '',
            serviceCode: data.serviceCode || '',
            provisionalServiceCode: data.provisionalServiceCode || '',
            serviceName: data.serviceName || '',
            serviceNameLocale: data.serviceNameLocale || '',
            totalBudget: typeof data.totalBudget === 'string' 
              ? parseFloat(data.totalBudget) || 0 
              : data.totalBudget || 0,
            availableBudget: typeof data.availableBudget === 'string' 
              ? parseFloat(data.availableBudget) || 0 
              : data.availableBudget || 0,
            utilizedBudget: typeof data.utilizedBudget === 'string' 
              ? parseFloat(data.utilizedBudget) || 0 
              : data.utilizedBudget || 0,
          },
        ],
      }

      const validationResult = BudgetStep2Schema.safeParse(budgetItemForValidation)
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(
          (issue: { message: string }) => issue.message
        )
        setErrorMessage(errorMessages.join(', '))
        setIsSubmitting(false)
        return
      }

      if (!selectedCategoryId) {
        setErrorMessage('Budget Category is required')
        setIsSubmitting(false)
        return
      }

      const categoryId = typeof selectedCategoryId === 'string' 
        ? parseInt(selectedCategoryId) 
        : selectedCategoryId

      // Validate budgetId is available
      if (!budgetId) {
        setErrorMessage('Budget ID is required')
        setIsSubmitting(false)
        return
      }

      // Construct payload with only required fields
      // ✅ IMPORTANT: budgetDTO should ONLY contain { id: budgetId } - no other fields
      const payload: BudgetItemRequest = {
        ...(isEditing && budgetItemData?.id && { id: budgetItemData.id }),
        subCategoryCode: data.subCategoryCode || '',
        subCategoryName: data.subCategoryName || '',
        subCategoryNameLocale: data.subCategoryNameLocale || '',
        serviceCode: data.serviceCode || '',
        provisionalServiceCode: data.provisionalServiceCode || '',
        serviceName: data.serviceName || '',
        serviceNameLocale: data.serviceNameLocale || '',
        totalBudget: typeof data.totalBudget === 'string' 
          ? parseFloat(data.totalBudget) || 0 
          : data.totalBudget || 0,
        availableBudget: typeof data.availableBudget === 'string' 
          ? parseFloat(data.availableBudget) || 0 
          : data.availableBudget || 0,
        utilizedBudget: typeof data.utilizedBudget === 'string' 
          ? parseFloat(data.utilizedBudget) || 0 
          : data.utilizedBudget || 0,
        enabled: true,
        deleted: false,
        budgetCategoryDTO: {
          id: categoryId,
            enabled: true,
        },
        // ✅ CRITICAL: Only pass id in budgetDTO - create fresh object with ONLY id field
        budgetDTO: {
          id: budgetId,
        },
      }

      // ✅ Double-check: Ensure budgetDTO only contains id (explicitly reassign to prevent any field leakage)
      payload.budgetDTO = {
        id: budgetId,
      }

      // Log the final payload structure to verify
      const payloadToSend = {
        ...payload,
        budgetDTO: {
          id: budgetId,
        },
      }

      console.log('[RightSlideBudgetItemPanel] Final payload to send:', JSON.stringify(payloadToSend, null, 2))
      console.log('[RightSlideBudgetItemPanel] budgetDTO (should ONLY have id):', JSON.stringify(payloadToSend.budgetDTO, null, 2))

      // ✅ Use React Query mutations (they handle cache invalidation automatically)
      let response: BudgetItemResponse
      if (isEditing && budgetItemData?.id) {
        response = await updateMutation.mutateAsync({
          id: budgetItemData.id,
          payload: payloadToSend
        })
      } else {
        response = await createMutation.mutateAsync(payloadToSend)
      }

      console.log('[RightSlideBudgetItemPanel] ✅ Mutation completed')
      console.log('[RightSlideBudgetItemPanel] Response:', response)
      console.log('[RightSlideBudgetItemPanel] isEditing:', isEditing)
      console.log('[RightSlideBudgetItemPanel] onBudgetItemAdded:', !!onBudgetItemAdded)
      console.log('[RightSlideBudgetItemPanel] onBudgetItemUpdated:', !!onBudgetItemUpdated)

      // Success message is handled by the mutation hook (toast)
      setSuccessMessage(
        isEditing
          ? 'Budget item updated successfully!'
          : 'Budget item added successfully!'
      )

      // Call callbacks BEFORE closing panel to ensure refetch happens
      if (isEditing && onBudgetItemUpdated && budgetItemIndex !== undefined) {
        console.log('[RightSlideBudgetItemPanel] Calling onBudgetItemUpdated callback')
        await onBudgetItemUpdated(response, budgetItemIndex)
      } else if (!isEditing && onBudgetItemAdded) {
        console.log('[RightSlideBudgetItemPanel] Calling onBudgetItemAdded callback')
        await onBudgetItemAdded(response)
      }

      // Close panel after a short delay to allow refetch to complete
      setTimeout(() => {
        reset()
        onClose()
      }, 1500)
    } catch (error: unknown) {
      const errorData = error as {
        response?: { data?: { message?: string } }
        message?: string
      }
      const errorMessage =
        errorData?.response?.data?.message ||
        errorData?.message ||
        'Failed to save budget item. Please try again.'
      setErrorMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  const commonFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: '46px',
      borderRadius: '8px',
      '& fieldset': {
        borderColor: '#CAD5E2',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#CAD5E2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2563EB',
      },
    },
  }

  const errorFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: '46px',
      borderRadius: '8px',
      '& fieldset': {
        borderColor: 'red',
        borderWidth: '1px',
      },
    },
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
    color: '#1E2939',
    fontFamily: 'Outfit',
    fontWeight: 400,
    fontStyle: 'normal',
    fontSize: '14px',
    letterSpacing: 0,
    wordBreak: 'break-word',
  }

  const selectStyles = {
    height: '46px',
    borderRadius: '8px',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#CAD5E2',
      borderWidth: '1px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#CAD5E2',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#2563EB',
    },
    '& .MuiSelect-icon': {
      color: '#666',
    },
  }

  const renderTextField = (
    name: keyof BudgetItemFormData,
    label: string,
    defaultValue = '',
    gridSize: number = 6,
    required = false,
    type: 'text' | 'number' = 'text'
  ) => (
    <Grid key={name} size={{ xs: 12, md: gridSize }}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{
          validate: (value: unknown) => {
            const allValues = getValues()
            return validateBudgetItemField(name, value, allValues)
          },
        }}
        render={({ field }) => (
          <>
            <TextField
              {...field}
              label={label}
              type={type}
              fullWidth
              required={required}
              error={!!errors[name]}
              InputLabelProps={{ sx: labelSx }}
              InputProps={{ sx: valueSx }}
              sx={errors[name] ? errorFieldStyles : commonFieldStyles}
              value={field.value || ''}
            />
            <FormError
              error={(errors[name]?.message as string) || ''}
              touched={true}
            />
          </>
        )}
      />
    </Grid>
  )

  const renderSelectField = (
    name: keyof BudgetItemFormData,
    label: string,
    options: { id: number; displayName: string; settingValue: string }[],
    gridSize: number = 6,
    required = false,
    loading = false
  ) => (
    <Grid key={name} size={{ xs: 12, md: gridSize }}>
      <Controller
        name={name}
        control={control}
        rules={{
          validate: (value: unknown) => {
            const allValues = getValues()
            return validateBudgetItemField(name, value, allValues)
          },
        }}
        defaultValue={''}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors[name]} required={required}>
            <InputLabel sx={labelSx} required={required}>
              {loading ? `Loading...` : label}
            </InputLabel>
            <Select
              {...field}
              input={<OutlinedInput label={loading ? `Loading...` : label} />}
              label={loading ? `Loading...` : label}
              sx={{ ...selectStyles, ...valueSx }}
              IconComponent={KeyboardArrowDownIcon}
              disabled={loading}
              value={field.value || ''}
            >
              {loading ? (
                <MenuItem disabled value="">
                  <em>Loading options...</em>
                </MenuItem>
              ) : options.length === 0 ? (
                <MenuItem disabled value="">
                  <em>No options available</em>
                </MenuItem>
              ) : (
                options.map((option) => (
                  <MenuItem key={option.id} value={option.settingValue}>
                    {option.displayName}
                  </MenuItem>
                ))
              )}
            </Select>
            <FormError
              error={(errors[name]?.message as string) || ''}
              touched={true}
            />
          </FormControl>
        )}
      />
    </Grid>
  )


  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: 460,
          borderRadius: 3,
          backgroundColor: 'white',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          fontStyle: 'normal',
          fontSize: '20px',
          lineHeight: '28px',
          letterSpacing: '0.15px',
          verticalAlign: 'middle',
          flexShrink: 0,
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: 'white',
          zIndex: 11,
        }}
      >
        {mode === 'edit'
          ? getLabel('CDL_BDG_BUDGET_ITEM_EDIT', currentLanguage, 'Edit Budget Item')
          : getLabel('CDL_BDG_BUDGET_ITEM_ADD', currentLanguage, 'Add Budget Item')}
        <IconButton onClick={handleClose}>
          <CancelOutlinedIcon />
        </IconButton>
      </DialogTitle>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <DialogContent
          dividers
          sx={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '20px',
            marginBottom: '80px', // Space for fixed buttons
          }}
        >
          {loadingBudgetItem && (
              <Alert severity="info" sx={{ mb: 2 }}>
              Loading budget item data...
              </Alert>
            )}

          <Grid container rowSpacing={4} columnSpacing={2} mt={3}>
            {/* Budget Category Dropdown */}
            {renderSelectField(
              'budgetCategoryId',
              getLabel(BUDGET_LABELS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME, currentLanguage, 'Budget Category'),
              budgetCategoryOptions,
              12,
              true,
              loadingBudgetCategories
            )}

            {renderTextField(
              'subCategoryCode',
              getLabel('CDL_BDG_SUB_CATEGORY_CODE', currentLanguage, 'Sub-Category Code'),
              '',
              6,
              true
            )}
            {renderTextField(
              'subCategoryName',
              getLabel('CDL_BDG_SUB_CATEGORY_NAME', currentLanguage, 'Sub-Category Name'),
              '',
              6,
              true
            )}
            {renderTextField(
              'subCategoryNameLocale',
              getLabel('CDL_BDG_SUB_CATEGORY_NAME_LOCALE', currentLanguage, 'Sub-Category Name (Local)'),
              '',
              6,
              false
            )}
            {renderTextField(
              'serviceCode',
              getLabel('CDL_BDG_SERVICE_CODE', currentLanguage, 'Service Code'),
              '',
              6,
              true
            )}
            {renderTextField(
              'provisionalServiceCode',
              getLabel('CDL_BDG_PROVISIONAL_SERVICE_CODE', currentLanguage, 'Provisional Service Code'),
              '',
              6,
              false
            )}
            {renderTextField(
              'serviceName',
              getLabel('CDL_BDG_SERVICE_NAME', currentLanguage, 'Service Name'),
              '',
                  6,
                  true
                )}
            {renderTextField(
              'serviceNameLocale',
              getLabel('CDL_BDG_SERVICE_NAME_LOCALE', currentLanguage, 'Service Name (Local)'),
              '',
              6,
              false
            )}
            {renderTextField(
              'totalBudget',
              getLabel('CDL_BDG_TOTAL_BUDGET', currentLanguage, 'Total Budget'),
              '',
              6,
              true,
              'number'
            )}
            {renderTextField(
              'availableBudget',
              getLabel('CDL_BDG_AVAILABLE_BUDGET', currentLanguage, 'Available Budget'),
              '',
              6,
              false,
              'number'
            )}
            {renderTextField(
              'utilizedBudget',
              getLabel('CDL_BDG_UTILIZED_BUDGET', currentLanguage, 'Utilized Budget'),
              '',
              6,
              false,
              'number'
            )}
          </Grid>
        </DialogContent>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 2,
            backgroundColor: 'white',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
            zIndex: 10,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClose}
                disabled={isSubmitting || loadingBudgetItem}
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
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                type="submit"
                disabled={isSubmitting || loadingBudgetItem}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: 0,
                  backgroundColor: '#2563EB',
                  color: '#fff',
                }}
              >
                {isSubmitting
                  ? mode === 'edit'
                    ? 'Updating...'
                    : 'Adding...'
                  : mode === 'edit'
                    ? 'Update'
                    : 'Add'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </form>

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
    </Drawer>
  )
}
