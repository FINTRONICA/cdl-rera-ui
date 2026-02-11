'use client'

import { useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  useTheme,
  alpha,
} from '@mui/material'
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material'
import { Controller, useFormContext } from 'react-hook-form'
import { useBudgetManagementLabelsWithCache as useBudgetManagementFirmLabelsApi } from '@/hooks/budget/useBudgetManagementLabelsWithCache'
import { useAppStore } from '@/store'
import { budgetService } from '@/services/api/budgetApi/budgetManagementService'
import { buildPartnerService } from '@/services/api/buildPartnerService'
import { realEstateAssetService } from '@/services/api/projectService'
import { BudgetCategoryService } from '@/services/api/budgetApi/budgetCategoryService'
import { BudgetStep1Schema } from '@/lib/validation/budgetSchemas'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'
import { FormError } from '@/components/atoms/FormError'
import {
  commonFieldStyles as sharedCommonFieldStyles,
  labelSx as sharedLabelSx,
  valueSx as sharedValueSx,
  selectStyles as sharedSelectStyles,
  cardStyles as sharedCardStyles,
  errorFieldStyles as sharedErrorFieldStyles,
} from '@/components/organisms/ProjectStepper/styles'
import type { Theme } from '@mui/material/styles'

type ThemeStyleFn = (theme: Theme) => Record<string, unknown>
import { DateRangePicker } from '@/app/dashboard/components/filters/DateRangePicker'
import dayjs from 'dayjs'
import type { BudgetRequest } from '@/utils/budgetMapper'
import type { BuildPartner } from '@/services/api/buildPartnerService'
import type { RealEstateAsset } from '@/services/api/projectService'
import type { BudgetCategoryUIData } from '@/services/api/budgetApi/budgetCategoryService'

interface Step1Props {
  onSaveAndNext?: (data: { id: number }) => void
  budgetId?: number | null
  isEditMode?: boolean
  isViewMode?: boolean
}

export interface Step1Ref {
  handleSaveAndNext: () => Promise<void>
}

const Step1 = forwardRef<Step1Ref, Step1Props>(
  (
    { onSaveAndNext, budgetId, isEditMode, isViewMode = false },
    ref
  ) => {
    const {
      control,
      watch,
      getValues,
      setValue,
      formState: { errors },
      setError,
      clearErrors,
      trigger,
    } = useFormContext()

    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    const { getLabel } = useBudgetManagementFirmLabelsApi()
    const currentLanguage = useAppStore((state) => state.language)

    // Dropdown data state
    const [assetRegisterOptions, setAssetRegisterOptions] = useState<{ id: number; displayName: string; settingValue: string }[]>([])
    const [managementFirmOptions, setManagementFirmOptions] = useState<{ id: number; displayName: string; settingValue: string }[]>([])
    const [budgetCategoryOptions, setBudgetCategoryOptions] = useState<{ id: number; displayName: string; settingValue: string }[]>([])
    const [loadingAssetRegisters, setLoadingAssetRegisters] = useState(true)
    const [loadingManagementFirms, setLoadingManagementFirms] = useState(true)
    const [loadingBudgetCategories, setLoadingBudgetCategories] = useState(true)

    const [isFormInitialized, setIsFormInitialized] = useState(false)
    const [isLoadingBudget, setIsLoadingBudget] = useState(false)

    // Date range state
    const [dateRange, setDateRange] = useState({
      startDate: '',
      endDate: '',
    })

    // Fetch Asset Registers (Build Partners)
    useEffect(() => {
      const fetchAssetRegisters = async () => {
        try {
          setLoadingAssetRegisters(true)
          const response = await buildPartnerService.getBuildPartners(0, 1000)
          
          if (!response || !response.content || !Array.isArray(response.content)) {
            setAssetRegisterOptions([])
            return
          }

          const options = response.content
            .filter((item: BuildPartner) => item && item.id)
            .map((item: BuildPartner) => ({
              id: item.id,
              displayName: item.arName || item.arProjectName || `Asset Register ${item.id}`,
              settingValue: item.id.toString(),
            }))
          
          setAssetRegisterOptions(options)
        } catch (error) {
          console.error('[Step1] Error fetching asset registers:', error)
          setAssetRegisterOptions([])
        } finally {
          setLoadingAssetRegisters(false)
        }
      }
      fetchAssetRegisters()
    }, [])

    // Fetch Management Firms (Real Estate Assets/Projects)
    useEffect(() => {
      const fetchManagementFirms = async () => {
        try {
          setLoadingManagementFirms(true)
          const response = await realEstateAssetService.getProjects(0, 1000)
          
          // Handle both array response and paginated response
          let dataArray: RealEstateAsset[] = []
          
          if (Array.isArray(response)) {
            // Direct array response
            dataArray = response
          } else if (response && typeof response === 'object' && 'content' in response) {
            // Paginated response with content property
            const paginatedResponse = response as { content?: RealEstateAsset[] }
            dataArray = Array.isArray(paginatedResponse.content) ? paginatedResponse.content : []
          } else {
            setManagementFirmOptions([])
            return
          }

          const options = dataArray
            .filter((item: RealEstateAsset) => item && item.id && item.mfName)
            .map((item: RealEstateAsset) => ({
              id: item.id,
              displayName: item.mfName || `Management Firm ${item.id}`,
              settingValue: item.id.toString(),
            }))
          
          setManagementFirmOptions(options)
        } catch (error) {
          console.error('[Step1] Error fetching management firms:', error)
          setManagementFirmOptions([])
        } finally {
          setLoadingManagementFirms(false)
        }
      }
      fetchManagementFirms()
    }, [])

    // Fetch Budget Categories
    useEffect(() => {
      const fetchBudgetCategories = async () => {
        try {
          setLoadingBudgetCategories(true)
          const response = await BudgetCategoryService.getBudgetCategories(0, 1000)
          
          if (!response || !response.content || !Array.isArray(response.content)) {
            setBudgetCategoryOptions([])
            return
          }

          const options = response.content
            .filter((item: BudgetCategoryUIData) => item && item.id)
            .map((item: BudgetCategoryUIData) => ({
              id: item.id,
              displayName: item.categoryName || item.serviceName || `Budget Category ${item.id}`,
              settingValue: item.id.toString(),
            }))
          
          setBudgetCategoryOptions(options)
        } catch (error) {
          console.error('[Step1] Error fetching budget categories:', error)
          setBudgetCategoryOptions([])
        } finally {
          setLoadingBudgetCategories(false)
        }
      }
      fetchBudgetCategories()
    }, [])

    // Store budget data for later use
    const [loadedBudgetData, setLoadedBudgetData] = useState<Awaited<ReturnType<typeof budgetService.getBudgetById>> | null>(null)

    // Load existing budget data in edit mode
    useEffect(() => {
      const loadBudgetData = async () => {
        if (isEditMode && budgetId && !isFormInitialized) {
          try {
            setIsLoadingBudget(true)
            const budgetData = await budgetService.getBudgetById(budgetId)
            
            // Store budget data for later use
            setLoadedBudgetData(budgetData)
            
            // Debug: Log the budget data received from backend
            console.log('[Step1] Budget data loaded from backend:', {
              id: budgetData.id,
              assetRegisterDTO: budgetData.assetRegisterDTO,
              managementFirmDTO: budgetData.managementFirmDTO,
              budgetCategoriesDTOS: budgetData.budgetCategoriesDTOS,
            })
            
            // Set form values from loaded data
            if (budgetData.assetRegisterDTO?.id) {
              console.log('[Step1] Setting assetRegisterId to:', budgetData.assetRegisterDTO.id.toString())
              setValue('assetRegisterId', budgetData.assetRegisterDTO.id.toString(), { shouldValidate: false, shouldDirty: false })
            } else {
              console.warn('[Step1] assetRegisterDTO is null or missing id')
            }
            if (budgetData.managementFirmDTO?.id) {
              console.log('[Step1] Setting managementFirmId to:', budgetData.managementFirmDTO.id.toString())
              setValue('managementFirmId', budgetData.managementFirmDTO.id.toString(), { shouldValidate: false, shouldDirty: false })
            } else {
              console.warn('[Step1] managementFirmDTO is null or missing id')
            }
            
            setValue('budgetId', budgetData.budgetId || '', { shouldValidate: false, shouldDirty: false })
            setValue('budgetName', budgetData.budgetName || '', { shouldValidate: false, shouldDirty: false })
            setValue('budgetPeriodCode', budgetData.budgetPeriodCode || '', { shouldValidate: false, shouldDirty: false })
            
            // Parse budgetPeriodCode to extract dates and set date range
            // budgetPeriodCode format: "YYYY-MM-DD to YYYY-MM-DD" (e.g., "2025-11-29 to 2025-12-08")
            if (budgetData.budgetPeriodCode) {
              const parseDateRange = (periodCode: string) => {
                try {
                  // Split by " to " to get start and end dates
                  const parts = periodCode.split(' to ')
                  if (parts.length === 2 && parts[0] && parts[1]) {
                    const startDateStr = parts[0].trim() // "YYYY-MM-DD"
                    const endDateStr = parts[1].trim()   // "YYYY-MM-DD"
                    
                    // Convert YYYY-MM-DD to DD-MM-YYYY for display
                    const convertToDisplayFormat = (dateStr: string) => {
                      const dateParts = dateStr.split('-')
                      if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
                        const [year, month, day] = dateParts
                        return `${day}-${month}-${year}` // DD-MM-YYYY
                      }
                      return ''
                    }
                    
                    const startDate = convertToDisplayFormat(startDateStr)
                    const endDate = convertToDisplayFormat(endDateStr)
                    
                    if (startDate && endDate) {
                      return { startDate, endDate }
                    }
                  }
                } catch (error) {
                  console.error('[Step1] Error parsing budgetPeriodCode:', error)
                }
                return null
              }
              
              const dateRange = parseDateRange(budgetData.budgetPeriodCode)
              if (dateRange) {
                console.log('[Step1] Setting date range from budgetPeriodCode:', dateRange)
                setDateRange(dateRange)
              }
            }
            
            // Also check if budgetPeriodFrom and budgetPeriodTo exist (fallback)
            const budgetPeriodFrom = 'budgetPeriodFrom' in budgetData ? (budgetData as { budgetPeriodFrom?: string | Date }).budgetPeriodFrom : undefined
            const budgetPeriodTo = 'budgetPeriodTo' in budgetData ? (budgetData as { budgetPeriodTo?: string | Date }).budgetPeriodTo : undefined
            if (budgetPeriodFrom && budgetPeriodTo && (!budgetData.budgetPeriodCode || budgetData.budgetPeriodCode === '')) {
              const formatDate = (dateStr: string | Date) => {
                if (!dateStr) return ''
                const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
                if (isNaN(date.getTime())) return ''
                const day = String(date.getDate()).padStart(2, '0')
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const year = date.getFullYear()
                return `${day}-${month}-${year}`
              }
              const startDate = formatDate(budgetPeriodFrom)
              const endDate = formatDate(budgetPeriodTo)
              if (startDate && endDate) {
                console.log('[Step1] Setting date range from budgetPeriodFrom/To:', { startDate, endDate })
                setDateRange({ startDate, endDate })
              }
            }
            setValue('propertyGroupId', budgetData.propertyGroupId?.toString() || '', { shouldValidate: false, shouldDirty: false })
            setValue('propertyManagerEmail', budgetData.propertyManagerEmail || '', { shouldValidate: false, shouldDirty: false })
            setValue('masterCommunityName', budgetData.masterCommunityName || '', { shouldValidate: false, shouldDirty: false })
            setValue('masterCommunityNameLocale', budgetData.masterCommunityNameLocale || '', { shouldValidate: false, shouldDirty: false })
            setValue('isActive', budgetData.isActive ?? true, { shouldValidate: false, shouldDirty: false })

        setIsFormInitialized(true)
          } catch (error) {
            console.error('Error loading budget data:', error)
          } finally {
            setIsLoadingBudget(false)
          }
        }
      }

      loadBudgetData()
    }, [isEditMode, budgetId, isFormInitialized, setValue])

    // FIX: Set budgetCategoryId separately when both budget data and options are available
    useEffect(() => {
      if (
        isEditMode &&
        loadedBudgetData &&
        budgetCategoryOptions.length > 0 &&
        !loadingBudgetCategories
      ) {
        // Extract category ID from budgetCategoriesDTOS
        if (loadedBudgetData.budgetCategoriesDTOS && loadedBudgetData.budgetCategoriesDTOS.length > 0) {
          const firstCategory = loadedBudgetData.budgetCategoriesDTOS[0] as unknown
          if (firstCategory) {
            let categoryId: number | null = null
            if (typeof firstCategory === 'object' && firstCategory !== null && 'id' in firstCategory) {
              categoryId = (firstCategory as { id: number }).id
            } else if (typeof firstCategory === 'number') {
              categoryId = firstCategory as number
            }
            
            if (categoryId) {
              const categoryIdString = categoryId.toString()
              const currentValue = getValues('budgetCategoryId')
              
              // Only set if the value is different or not set
              if (currentValue !== categoryIdString) {
                console.log('[Step1] Setting budgetCategoryId to:', categoryIdString)
                console.log('[Step1] Current value:', currentValue)
                console.log('[Step1] Available budgetCategoryOptions:', budgetCategoryOptions)
                console.log('[Step1] Options include this ID?', budgetCategoryOptions.some(opt => opt.id === categoryId))
                
                // Verify the option exists in the loaded options
                const optionExists = budgetCategoryOptions.some(opt => opt.id === categoryId)
                if (optionExists) {
                  setValue('budgetCategoryId', categoryIdString, { shouldValidate: false, shouldDirty: false })
                  console.log('[Step1] Successfully set budgetCategoryId')
                } else {
                  console.warn('[Step1]  Budget category option not found in loaded options')
                  console.warn('[Step1] Looking for categoryId:', categoryId)
                  console.warn('[Step1] Available option IDs:', budgetCategoryOptions.map(opt => opt.id))
                }
              } else {
                console.log('[Step1] budgetCategoryId already set to correct value:', categoryIdString)
              }
            }
          }
        }
      }
    }, [isEditMode, loadedBudgetData, budgetCategoryOptions, loadingBudgetCategories, setValue, getValues])

    const handleSaveAndNext = useCallback(async () => {
      try {
        // Get form values
        const formValues = {
          assetRegisterId: watch('assetRegisterId'),
          managementFirmId: watch('managementFirmId'),
          budgetCategoryId: watch('budgetCategoryId'),
          budgetId: watch('budgetId'),
          budgetName: watch('budgetName'),
          budgetPeriodCode: watch('budgetPeriodCode'),
          propertyGroupId: watch('propertyGroupId'),
          propertyManagerEmail: watch('propertyManagerEmail'),
          masterCommunityName: watch('masterCommunityName'),
          masterCommunityNameLocale: watch('masterCommunityNameLocale'),
          isActive: watch('isActive') ?? true,
        }

        // Debug: Log form values to verify they're being captured
        console.log('[Step1] Form values before validation:', {
          assetRegisterId: formValues.assetRegisterId,
          managementFirmId: formValues.managementFirmId,
          assetRegisterIdType: typeof formValues.assetRegisterId,
          managementFirmIdType: typeof formValues.managementFirmId,
        })

        // Validate with Zod
        const zodResult = BudgetStep1Schema.safeParse(formValues)
        
        if (!zodResult.success) {
          // Clear all errors first
          const fieldsToValidate = [
            'assetRegisterId',
            'managementFirmId',
            'budgetId',
            'budgetName',
            'budgetPeriodCode',
            'propertyGroupId',
            'propertyManagerEmail',
            'masterCommunityName',
          ] as const
          
          clearErrors(fieldsToValidate as unknown as string[])
          
          // Set errors from Zod validation
          zodResult.error.issues.forEach((issue) => {
            const field = (issue.path?.[0] as string) || ''
            if (field) {
              setError(field as keyof typeof errors, {
                type: 'manual',
                message: issue.message,
              })
            }
          })
          
          // Scroll to first error
          if (zodResult.error.issues.length > 0) {
            const firstError = zodResult.error.issues[0]
            if (firstError) {
              const firstErrorField = (firstError.path?.[0] as string) || ''
              if (firstErrorField) {
                const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
                if (element) {
                  setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.focus()
                  }, 100)
                }
              }
            }
          }
          
          throw new Error('Please fill all required fields correctly')
        }
        
        // Parse and validate IDs
        const assetRegisterId = formValues.assetRegisterId 
          ? parseInt(formValues.assetRegisterId.toString(), 10) 
          : null
        const managementFirmId = formValues.managementFirmId 
          ? parseInt(formValues.managementFirmId.toString(), 10) 
          : null
        const budgetCategoryId = formValues.budgetCategoryId 
          ? parseInt(formValues.budgetCategoryId.toString(), 10) 
          : null

        // Debug: Log parsed IDs
        console.log('[Step1] Parsed IDs:', {
          assetRegisterId,
          managementFirmId,
          budgetCategoryId,
          assetRegisterIdValid: assetRegisterId && !isNaN(assetRegisterId) && assetRegisterId > 0,
          managementFirmIdValid: managementFirmId && !isNaN(managementFirmId) && managementFirmId > 0,
          budgetCategoryIdValid: budgetCategoryId && !isNaN(budgetCategoryId) && budgetCategoryId > 0,
        })

        // Validate IDs are valid numbers
        if (!assetRegisterId || isNaN(assetRegisterId) || assetRegisterId <= 0) {
          throw new Error('Asset Register ID is required and must be a valid number')
        }
        if (!managementFirmId || isNaN(managementFirmId) || managementFirmId <= 0) {
          throw new Error('Management Firm ID is required and must be a valid number')
        }

        // Build budgetCategoriesDTOS array
        const budgetCategoriesDTOS: Array<{ id: number }> = []
        if (budgetCategoryId && !isNaN(budgetCategoryId) && budgetCategoryId > 0) {
          budgetCategoriesDTOS.push({ id: budgetCategoryId })
        }

        // Prepare payload
        const payload: BudgetRequest = {
          ...(isEditMode && budgetId ? { id: budgetId } : {}), // Include id for updates
          budgetId: formValues.budgetId,
          budgetName: formValues.budgetName,
          isActive: formValues.isActive,
          budgetPeriodCode: formValues.budgetPeriodCode,
          propertyGroupId: parseInt(formValues.propertyGroupId?.toString() || '0', 10) || 0,
          propertyManagerEmail: formValues.propertyManagerEmail,
          masterCommunityName: formValues.masterCommunityName,
          masterCommunityNameLocale: formValues.masterCommunityNameLocale || '',
          createdBy: '', // Will be set by backend
          enabled: true,
          deleted: false,
          assetRegisterDTO: {
            id: assetRegisterId,
          },
          managementFirmDTO: {
            id: managementFirmId,
          },
          budgetCategoriesDTOS: budgetCategoriesDTOS,
        }

        // Debug: Log final payload
        console.log('[Step1] Final payload being sent:', JSON.stringify(payload, null, 2))

        let response
        if (isEditMode && budgetId) {
          // Update existing budget
          response = await budgetService.updateBudget(budgetId, payload)
              } else {
          // Create new budget
          response = await budgetService.createBudget(payload)
        }

        if (onSaveAndNext && response.id) {
          onSaveAndNext({ id: response.id })
            }
          } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save budget'
        throw new Error(errorMessage)
      }
    }, [watch, setError, clearErrors, isEditMode, budgetId, onSaveAndNext])

    useImperativeHandle(
      ref,
      () => ({
        handleSaveAndNext,
      }),
      [handleSaveAndNext]
    )

    const labelStyles = useMemo(() => (sharedLabelSx as ThemeStyleFn)(theme), [theme])
    const valueStyles = useMemo(() => (sharedValueSx as ThemeStyleFn)(theme), [theme])
    const commonFieldStyles = useMemo(
      () => (sharedCommonFieldStyles as ThemeStyleFn)(theme),
      [theme]
    )
    const selectStyles = useMemo(() => (sharedSelectStyles as ThemeStyleFn)(theme), [theme])
    const cardStylesMui = useMemo(() => (sharedCardStyles as ThemeStyleFn)(theme), [theme])
    const errorFieldStyles = useMemo(() => (sharedErrorFieldStyles as ThemeStyleFn)(theme), [theme])

    const getLabelSx = () => ({
      ...labelStyles,
      marginBottom: '4px',
      fontWeight: 600,
      lineHeight: 1.25,
      color: theme.palette.text.secondary,
      '&.Mui-focused': { color: theme.palette.primary.main },
      '&.MuiFormLabel-filled': {
        color: theme.palette.text.primary,
      },
      '&.MuiInputLabel-root': {
        color: theme.palette.text.secondary,
      },
    })

    const focusedLabelSx = {
      '&:has(.MuiOutlinedInput-root.Mui-focused) .MuiInputLabel-root': {
        color: `${theme.palette.primary.main} !important`,
      },
    }

    const valueSx = valueStyles
    const labelSx = getLabelSx()

    const getFormControlLabelSx = (hasError: boolean) => ({
      '& .MuiInputLabel-root': {
        color: hasError ? theme.palette.error.main : theme.palette.text.secondary,
      },
      '&:has(.MuiOutlinedInput-root.Mui-focused) .MuiInputLabel-root': {
        color: `${hasError ? theme.palette.error.main : theme.palette.primary.main} !important`,
      },
      '& .MuiFormLabel-filled.MuiInputLabel-root': {
        color: hasError ? theme.palette.error.main : theme.palette.text.primary,
      },
    })

    const renderTextField = (
      name: string,
      configId: string,
      fallbackLabel: string,
      gridMd = 6,
      disabled = false,
      required = false
    ) => {
      const label = getLabel(configId, currentLanguage, fallbackLabel)
      return (
        <Grid size={{ xs: 12, md: gridMd }}>
          <Controller
            name={name}
            control={control}
            rules={required ? { required: `${label} is required` } : {}}
            render={({ field }) => (
              <>
                <TextField
                  {...field}
                  label={label}
                  fullWidth
                  disabled={disabled || isViewMode || isLoadingBudget}
                  error={!!errors[name]}
                  InputLabelProps={{
                    sx: {
                      ...labelSx,
                      color: theme.palette.text.secondary,
                      '&.MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
                      },
                      ...(!!errors[name] &&
                        !isViewMode && {
                          color: `${theme.palette.error.main} !important`,
                          '&.Mui-focused': { color: theme.palette.error.main },
                          '&.MuiFormLabel-filled': { color: theme.palette.error.main },
                          '&.MuiInputLabel-root': { color: theme.palette.error.main },
                        }),
                    },
                  }}
                  InputProps={{
                    sx: {
                      ...valueSx,
                      ...((disabled || isViewMode || isLoadingBudget) && {
                        backgroundColor: isDark ? alpha(theme.palette.background.paper, 0.25) : '#F9FAFB',
                        color: isDark ? theme.palette.text.secondary : '#6B7280',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: isDark ? alpha('#FFFFFF', 0.2) : '#E5E7EB',
                        },
                      }),
                    },
                  }}
                  sx={{
                    ...commonFieldStyles,
                    ...focusedLabelSx,
                    ...((disabled || isViewMode || isLoadingBudget) && {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isDark ? alpha('#FFFFFF', 0.2) : '#E5E7EB',
                        },
                        '&:hover fieldset': {
                          borderColor: isDark ? alpha('#FFFFFF', 0.2) : '#E5E7EB',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: isDark ? alpha('#FFFFFF', 0.2) : '#E5E7EB',
                        },
                      },
                    }),
                    ...(!!errors[name] && !isViewMode && errorFieldStyles),
                  }}
                  required={required}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e)
                    if (errors[name]) {
                      clearErrors(name as keyof typeof errors)
                    }
                    trigger(name as keyof typeof errors)
                  }}
                  onBlur={() => {
                    field.onBlur()
                    trigger(name as keyof typeof errors)
                  }}
                />
                {errors[name] && (
                  <FormError
                    error={errors[name]?.message as string}
                    touched={true}
                  />
                )}
              </>
            )}
          />
        </Grid>
      )
    }

    const renderSelectField = (
      name: string,
      configId: string,
      fallbackLabel: string,
      options: { id: number; displayName: string; settingValue: string }[],
      gridMd: number = 6,
      required = false,
      loading = false
    ) => {
      const label = getLabel(configId, currentLanguage, fallbackLabel)
      return (
        <Grid size={{ xs: 12, md: gridMd }}>
          <Controller
            name={name}
            control={control}
            rules={required ? { required: `${label} is required` } : {}}
            defaultValue={''}
            render={({ field }) => (
              <FormControl
                fullWidth
                error={!!errors[name]}
                required={required}
                variant="outlined"
                sx={getFormControlLabelSx(!!errors[name] && !isViewMode)}
              >
                <InputLabel
                  sx={{
                    ...labelSx,
                    color: theme.palette.text.secondary,
                    '&.MuiInputLabel-root': { color: theme.palette.text.secondary },
                    '&.Mui-focused': { color: theme.palette.primary.main },
                    '&.MuiFormLabel-filled': { color: theme.palette.text.primary },
                    ...(!!errors[name] &&
                      !isViewMode && {
                        color: `${theme.palette.error.main} !important`,
                        '&.MuiInputLabel-root': { color: theme.palette.error.main },
                      }),
                  }}
                  required={required}
                >
                  {loading ? `Loading...` : label}
                </InputLabel>
                <Select
                  {...field}
                  input={<OutlinedInput label={loading ? `Loading...` : label} />}
                  label={loading ? `Loading...` : label}
                  required={required}
                  sx={{
                    ...selectStyles,
                    ...valueSx,
                    ...(!!errors[name] && !isViewMode && errorFieldStyles),
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  disabled={loading || isViewMode || isLoadingBudget}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e)
                    if (errors[name]) {
                      clearErrors(name as keyof typeof errors)
                    }
                    trigger(name as keyof typeof errors)
                  }}
                  onBlur={() => {
                    field.onBlur()
                    trigger(name as keyof typeof errors)
                  }}
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
                    error={errors[name]?.message as string}
                    touched={true}
                  />
              </FormControl>
            )}
          />
        </Grid>
      )
    }

    // DateRangeDisplay Component
    const DateRangeDisplay = ({
      startDate,
      endDate,
      onDateChange,
    }: {
      startDate: string
      endDate: string
      onDateChange: (start: string, end: string) => void
    }) => {
      const [isOpen, setIsOpen] = useState(false)
      const [prevStartDate, setPrevStartDate] = useState(startDate)
      const [prevEndDate, setPrevEndDate] = useState(endDate)
      const containerRef = useRef<HTMLDivElement>(null)

      // Auto-close when both dates are selected (only when end date is selected after start date)
      useEffect(() => {
        const endDateChanged = endDate !== prevEndDate
        const startDateWasAlreadySelected = prevStartDate && prevStartDate !== ''

        // Only auto-close if:
        // 1. End date was just selected (changed)
        // 2. Start date was already selected before this change
        // 3. Both dates now exist
        // 4. Picker is currently open
        if (
          endDateChanged &&
          startDateWasAlreadySelected &&
          startDate &&
          endDate &&
          isOpen
        ) {
          setIsOpen(false)
        }

        setPrevStartDate(startDate)
        setPrevEndDate(endDate)
      }, [startDate, endDate, isOpen, prevStartDate, prevEndDate])

      // Close when clicking outside (but not when clicking inside DatePicker calendar)
      useEffect(() => {
        if (!isOpen) return undefined

        const handleClickOutside = (event: MouseEvent) => {
          if (!containerRef.current) return
          
          const target = event.target as Element
          
          // Check if click is inside a MUI DatePicker calendar popper (rendered in portal)
          const isDatePickerPopper = target.closest('.MuiPickersPopper-root, .MuiPickersPopper-paper, [role="dialog"]')
          if (isDatePickerPopper) {
            // Don't close if clicking inside the DatePicker calendar
            return
          }
          
          // Check if click is inside the container (trigger button or popup wrapper)
          if (containerRef.current.contains(target as Node)) {
            // Don't close if clicking the trigger button or inside the popup wrapper
            return
          }
          
          // Click is outside, close the popup
          setIsOpen(false)
        }

        // Use a delay to avoid immediate closing when opening
        const timeoutId = setTimeout(() => {
          document.addEventListener('mousedown', handleClickOutside, true) // Use capture phase
        }, 200)

        return () => {
          clearTimeout(timeoutId)
          document.removeEventListener('mousedown', handleClickOutside, true)
        }
      }, [isOpen])

      return (
        <div ref={containerRef} className="relative">
          <div
            className={`px-3 py-2.5 border rounded-lg text-sm font-medium min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center gap-3 ${
              isDark
                ? 'border-slate-600 bg-slate-800/80 text-slate-200'
                : 'border-gray-300 bg-white text-gray-700'
            }`}
            onClick={() => setIsOpen(!isOpen)}
            style={{
              height: '46px',
              borderRadius: '8px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            <svg
              className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className={`flex-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              {startDate || 'Start Date'} | {endDate || 'End Date'}
            </span>
          </div>

          {isOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-[9999] w-96 max-w-[90vw] right-0"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <DateRangePicker
                startDate={startDate || ''}
                endDate={endDate || ''}
                onChange={onDateChange}
                className={`w-full p-4 border rounded-lg shadow-lg ${
                  isDark
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          )}
        </div>
      )
    }

    const F = BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS
    const Fb = BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS

    return (
      <Card
        sx={{
          ...cardStylesMui,
          width: '84%',
          margin: '0 auto',
          border: isDark ? `1px solid ${alpha('#FFFFFF', 0.2)}` : 'none',
        }}
      >
        <CardContent>
          <Grid container rowSpacing={4} columnSpacing={2}>
            {/* Asset Register Dropdown */}
            {renderSelectField(
              'assetRegisterId',
              F.ASSET_REGISTER,
              Fb.ASSET_REGISTER,
              assetRegisterOptions,
                6,
                false,
              loadingAssetRegisters
            )}

            {/* Management Firm Dropdown */}
            {renderSelectField(
              'managementFirmId',
              F.MANAGEMENT_COMPANY_NAME,
              Fb.MANAGEMENT_COMPANY_NAME,
              managementFirmOptions,
                6,
                false,
              loadingManagementFirms
              )}

            {/* Budget ID */}
              {renderTextField(
              'budgetId',
              F.BUDGET_ID,
              Fb.BUDGET_ID,
              6,
              false,
                true
              )}

            {/* Budget Name */}
              {renderTextField(
              'budgetName',
              F.BUDGET_NAME,
              Fb.BUDGET_NAME,
              6,
              false,
                true
              )}

            {/* Budget Period Date Range */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DateRangeDisplay
                startDate={dateRange.startDate || ''}
                endDate={dateRange.endDate || ''}
                onDateChange={(start: string, end: string) => {
                  console.log('[Step1] Date range changed:', { start, end })
                  
                  // Validate end date is not before start date
                  if (start && end) {
                    const startDateObj = dayjs(start, 'DD-MM-YYYY')
                    const endDateObj = dayjs(end, 'DD-MM-YYYY')
                    if (endDateObj.isValid() && startDateObj.isValid() && endDateObj.isBefore(startDateObj, 'day')) {
                      console.warn('[Step1] End date cannot be before start date')
                      // Clear end date if it's invalid
                      setDateRange({ startDate: start, endDate: '' })
                      return
                    }
                  }
                  
                  setDateRange({ startDate: start, endDate: end })
                  // Format dates and set budgetPeriodCode
                  const formatDateForCode = (dateStr: string) => {
                    if (!dateStr) return ''
                    // Convert DD-MM-YYYY to YYYY-MM-DD for API
                    const [day, month, year] = dateStr.split('-')
                    return `${year}-${month}-${day}`
                  }
                  if (start && end) {
                    const periodCode = `${formatDateForCode(start)} to ${formatDateForCode(end)}`
                    console.log('[Step1] Setting budgetPeriodCode:', periodCode)
                    setValue('budgetPeriodCode', periodCode, { shouldValidate: true, shouldDirty: true })
                  } else if (start) {
                    // If only start date is set, still update the code
                    const periodCode = `${formatDateForCode(start)} to `
                    setValue('budgetPeriodCode', periodCode, { shouldValidate: false, shouldDirty: true })
                  }
                }}
              />
              {errors.budgetPeriodCode && (
                <FormError
                  error={errors.budgetPeriodCode.message as string}
                />
              )}
            </Grid>

            {/* Property Group ID */}
              {renderTextField(
              'propertyGroupId',
              F.MANAGEMENT_FIRM_GROUP_ID,
              Fb.MANAGEMENT_FIRM_GROUP_ID,
              6,
              false,
                true
              )}

            {/* Property Manager Email */}
              {renderTextField(
              'propertyManagerEmail',
              F.MANAGEMENT_FIRM_MANAGER_EMAIL,
              Fb.MANAGEMENT_FIRM_MANAGER_EMAIL,
              6,
              false,
                true
              )}

            {/* Master Community Name */}
              {renderTextField(
              'masterCommunityName',
              F.MASTER_COMMUNITY_NAME,
              Fb.MASTER_COMMUNITY_NAME,
              6,
              false,
                true
              )}

            {/* Master Community Name (Local) */}
              {renderTextField(
              'masterCommunityNameLocale',
              F.MASTER_COMMUNITY_LOCAL_NAME,
              Fb.MASTER_COMMUNITY_LOCAL_NAME,
              6,
                false,
                false
              )}

            {/* Budget Category Dropdown */}
            {/* {renderSelectField(
              'budgetCategoryId',
              BUDGET_LABELS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME,
              'Budget Category',
              budgetCategoryOptions,
              6,
                false,
              loadingBudgetCategories
            )} */}
            </Grid>
          </CardContent>
        </Card>
    )
  }
)

Step1.displayName = 'Step1'

export default Step1
