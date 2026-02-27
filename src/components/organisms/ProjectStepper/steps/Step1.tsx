'use client'

import React from 'react'
import {
  Box,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  InputAdornment,
  Autocomplete,
  Paper,
  useTheme,
  alpha,
} from '@mui/material'

import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useFormContext, Controller } from 'react-hook-form'
import { ProjectDetailsData } from '../types'
// import { useProjectLabels } from '@/hooks/useProjectLabels'
// import { useBuildPartnerAssetLabels } from '@/hooks/useBuildPartnerAssetLabels'
import { useBuildPartnerAssetLabelsWithUtils } from '@/hooks/useBuildPartnerAssetLabels'
import { useBuildPartners } from '@/hooks/useBuildPartners'
import {
  useProjectTypes,
  useProjectStatuses,
  useProjectCurrencies,
  useBankAccountStatuses,
  useBlockedPaymentTypes,
} from '@/hooks/useProjectDropdowns'
import { idService } from '@/services/api/developerIdService'
import {
  commonFieldStyles,
  selectStyles,
  errorFieldStyles,
  datePickerStyles,
  labelSx,
  valueSx,
  cardStyles,
  calendarIconSx,
} from '../styles'
import {
  step1ValidationSchema,
  validateStep1Field,
} from '../validation/step1ZodSchema'

interface Step1Props {
  initialData?: Partial<ProjectDetailsData>
  isViewMode?: boolean
  projectId?: string | undefined
}

const Step1: React.FC<Step1Props> = React.memo(
  ({ initialData, isViewMode = false, projectId }) => {
    const theme = useTheme()
    const {
      control,
      watch,
      setValue,
      getValues,
      setError,
      trigger,
      formState: { errors },
    } = useFormContext<ProjectDetailsData>()
    const [isGeneratingmfId, setIsGeneratingmfId] = React.useState(false)

    // Check if we're in edit mode (editing existing project)
    const isEditMode = React.useMemo(() => !!projectId, [projectId])

    // Phase 2: Use our new label utility hook
    // const { getLabel, hasError } = useProjectLabels()
    /**
     * TODO Delete this variable hasError
     */
    const hasError = false
    const { getLabel } = useBuildPartnerAssetLabelsWithUtils()
    const language = 'EN'
    const { data: developersData, isLoading: isDevelopersLoading } =
      useBuildPartners(0, 100)

    const { data: projectTypesData, isLoading: isProjectTypesLoading } =
      useProjectTypes()

    const { data: projectStatusesData, isLoading: isProjectStatusesLoading } =
      useProjectStatuses()

    const {
      data: projectCurrenciesData,
      isLoading: isProjectCurrenciesLoading,
    } = useProjectCurrencies()

    const {
      data: bankAccountStatusesData,
      isLoading: isBankAccountStatusesLoading,
    } = useBankAccountStatuses()

    const {
      data: blockedPaymentTypesData,
      isLoading: isBlockedPaymentTypesLoading,
    } = useBlockedPaymentTypes()

    const handleDeveloperChange = (selectedCif: string) => {
      const selectedDeveloper = developersData?.content?.find(
        (dev) => dev.arCifrera === selectedCif
      )

      if (selectedDeveloper) {
        // Check if this is a "No CIF - No Name" entry
        const isNoCif =
          !selectedCif ||
          selectedCif.trim() === '' ||
          selectedCif.toLowerCase().includes('no cif') ||
          !selectedDeveloper.arCifrera ||
          selectedDeveloper.arCifrera.trim() === ''

        if (isNoCif) {
          // Clear all auto-filled fields for "No CIF - No Name" entries
          setValue('assetRegisterDTO.id', null as any)
          setValue('assetRegisterDTO.arCifrera', '')
          setValue('assetRegisterDTO.arName', '')
          setValue('assetRegisterDTO.arMasterName', '')
        } else {
          // Populate fields normally for valid CIF entries
          setValue('assetRegisterDTO.id', selectedDeveloper.id)
          setValue('assetRegisterDTO.arCifrera', selectedCif)
          setValue('assetRegisterDTO.arName', selectedDeveloper.arName || '')

          // Set Master Build Partner Asset Name from arMasterName
          if (!getValues('assetRegisterDTO.arMasterName')) {
            setValue(
              'assetRegisterDTO.arMasterName',
              selectedDeveloper.arMasterName || ''
            )
          }
        }
      } else {
        // If no developer found, clear all fields
        setValue('assetRegisterDTO.id', null as any)
        setValue('assetRegisterDTO.arCifrera', '')
        setValue('assetRegisterDTO.arName', '')
        setValue('assetRegisterDTO.arMasterName', '')
      }
    }

    const buildPartnerId = watch('assetRegisterDTO.id')

    const setMfCifFromBuildPartnerId = React.useCallback(() => {
      const currentBuildPartnerId =
        buildPartnerId || getValues('assetRegisterDTO.id')

      const developersList = (developersData as any)?.content || []

      if (currentBuildPartnerId && developersList.length > 0) {
        const normalizedId =
          typeof currentBuildPartnerId === 'string'
            ? parseInt(currentBuildPartnerId, 10)
            : Number(currentBuildPartnerId)

        const matchingDeveloper = developersList.find((dev: any) => {
          const devId =
            typeof dev.id === 'string' ? parseInt(dev.id, 10) : Number(dev.id)
          return devId === normalizedId
        })

        if (matchingDeveloper?.arCifrera) {
          const currentarCifrera = getValues('assetRegisterDTO.arCifrera')

          if (
            !currentarCifrera ||
            currentarCifrera === '' ||
            currentarCifrera !== matchingDeveloper.arCifrera
          ) {
            const valueToSet = String(matchingDeveloper.arCifrera || '')

            setValue('assetRegisterDTO.arCifrera', valueToSet, {
              shouldValidate: false,
              shouldDirty: false,
              shouldTouch: false,
            })

            if (matchingDeveloper.arName) {
              setValue('assetRegisterDTO.arName', matchingDeveloper.arName, {
                shouldValidate: false,
                shouldDirty: false,
              })
            }
          }
        }
      }
    }, [buildPartnerId, developersData, setValue, getValues])

    const buildPartnerOptions = React.useMemo(() => {
      const developersList = (developersData as any)?.content || []

      if (!developersList || developersList.length === 0) {
        return []
      }

      const seen = new Set<number>()
      const options: Array<{
        value: string
        label: string
        buildPartner: any
      }> = []

      for (const developer of developersList) {
        if (
          !developer ||
          !developer.id ||
          (!developer.arCifrera && !developer.arName)
        ) {
          continue
        }

        if (seen.has(developer.id)) {
          continue
        }
        seen.add(developer.id)

        const displayLabel = `${developer.arCifrera || 'No CIF'} - ${developer.arName || 'No Name'}`

        options.push({
          value: developer.arCifrera || '',
          label: displayLabel,
          buildPartner: developer,
        })
      }

      return options
    }, [developersData])

    const sanitizedData = React.useMemo(() => {
      if (!projectId || !initialData) return {}
      return initialData
    }, [initialData, projectId])
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        ;(window as any).step1Validation = async () => {
          const formData = getValues()
          const result = step1ValidationSchema.safeParse(formData)

          if (!result.success) {
            // Set errors in the form
            const errors: Record<string, any> = {}
            result.error.issues.forEach((err: any) => {
              const path = err.path.join('.')
              errors[path] = { message: err.message }
            })
            setError('root', { message: 'Validation failed' })
            Object.keys(errors).forEach((key) => {
              setError(key as any, { message: errors[key].message })
            })
            return { isValid: false, errors }
          }

          return { isValid: true, errors: {} }
        }
      }
    }, [getValues, setError])

    // Function to generate new REA ID
    const handleGeneratemfId = async () => {
      try {
        setIsGeneratingmfId(true)
        const newIdResponse = idService.generateNewId('REA')
        setValue('mfId', newIdResponse.id)
        // Trigger validation to clear any existing errors
        await trigger('mfId')
      } catch (error) {
      } finally {
        setIsGeneratingmfId(false)
      }
    }

    const retention = watch('mfRetentionPercent')
    const additionalRetention = watch('mfAdditionalRetentionPercent')
    React.useEffect(() => {
      // Only calculate if at least one retention value is provided
      const retentionStr = String(retention || '').trim()
      const additionalRetentionStr = String(additionalRetention || '').trim()

      // If both are empty, clear the aggregate retention field
      if (!retentionStr && !additionalRetentionStr) {
        setValue('mfTotalRetentionPercent', '')
        return
      }

      const retentionNum = parseFloat(retentionStr) || 0
      const additionalRetentionNum = parseFloat(additionalRetentionStr) || 0
      const total = retentionNum + additionalRetentionNum

      // Only set if there's an actual value to calculate
      if (total > 0) {
        setValue('mfTotalRetentionPercent', total.toFixed(2))
      } else {
        setValue('mfTotalRetentionPercent', '')
      }
    }, [retention, additionalRetention, setValue])

    React.useEffect(() => {
      const developersList = (developersData as any)?.content || []
      const currentBuildPartnerId =
        buildPartnerId || getValues('assetRegisterDTO.id')
      const currentarCifrera = getValues('assetRegisterDTO.arCifrera')

      if (
        developersList.length > 0 &&
        currentBuildPartnerId &&
        (!currentarCifrera || currentarCifrera === '')
      ) {
        const timeoutId = setTimeout(() => {
          setMfCifFromBuildPartnerId()

          setTimeout(() => {
            const afterSet = getValues('assetRegisterDTO.arCifrera')
            if (!afterSet || afterSet === '') {
              setMfCifFromBuildPartnerId()
            }
          }, 200)
        }, 300)

        return () => {
          clearTimeout(timeoutId)
        }
      }
      return undefined
    }, [developersData, buildPartnerId, setMfCifFromBuildPartnerId, getValues])

    React.useEffect(() => {
      const currentBuildPartnerId = buildPartnerId
      const currentarCifrera = getValues('assetRegisterDTO.arCifrera')
      const developersList = (developersData as any)?.content || []

      if (
        currentBuildPartnerId &&
        (!currentarCifrera || currentarCifrera === '') &&
        developersList.length > 0
      ) {
        const timeoutId = setTimeout(() => {
          setMfCifFromBuildPartnerId()
        }, 500)

        return () => clearTimeout(timeoutId)
      }
      return undefined
    }, [buildPartnerId, developersData, setMfCifFromBuildPartnerId, getValues])

    const StyledCalendarIcon = (
      props: React.ComponentProps<typeof CalendarTodayOutlinedIcon>
    ) => <CalendarTodayOutlinedIcon {...props} sx={calendarIconSx(theme)} />

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Card sx={cardStyles(theme)}>
          <CardContent>
            {/* Phase 4: Simple loading and error states */}

            {hasError && (
              <Box
                sx={{
                  mb: 2,
                  p: 1,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.error.main, 0.15)
                      : '#fef2f2',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.error.main}`,
                }}
              >
                <Typography variant="body2" color="error">
                  Labels loading failed, using fallbacks
                </Typography>
              </Box>
            )}

            <Grid container rowSpacing={4} columnSpacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfId"
                  control={control}
                  {...(sanitizedData?.mfId !== undefined && {
                    defaultValue: sanitizedData.mfId,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfId', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isGeneratingmfId || isViewMode || isEditMode}
                      label={getLabel(
                        'CDL_MF_REFID',
                        language,
                        'System Reference ID'
                      )}
                      error={!!errors.mfId}
                      helperText={errors.mfId?.message}
                      required={true}
                      InputLabelProps={{
                        sx: labelSx(theme),
                        shrink: !!field.value,
                      }}
                      InputProps={{
                        sx: valueSx(theme),
                        endAdornment: (
                          <InputAdornment position="end" sx={{ mr: 0 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<RefreshIcon />}
                              onClick={handleGeneratemfId}
                              disabled={
                                isGeneratingmfId || isViewMode || isEditMode
                              }
                              sx={{
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                textTransform: 'none',
                                background: '#2563EB',
                                '&:hover': {
                                  background: '#1D4ED8',
                                },
                                minWidth: '100px',
                                height: '32px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 500,
                                fontStyle: 'normal',
                                fontSize: '11px',
                                lineHeight: '14px',
                                letterSpacing: '0.3px',
                                px: 1,
                              }}
                            >
                              {isGeneratingmfId
                                ? 'Generating...'
                                : 'Generate ID'}
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                      sx={
                        errors.mfId
                          ? (errorFieldStyles as any)(theme)
                          : (commonFieldStyles as any)(theme)
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="assetRegisterDTO.arCifrera"
                  control={control}
                  {...(sanitizedData?.assetRegisterDTO?.arCifrera !==
                    undefined && {
                    defaultValue: sanitizedData.assetRegisterDTO.arCifrera,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('assetRegisterDTO.arCifrera', value),
                  }}
                  render={({ field }) => {
                    // Find the selected option by matching arCifrera value
                    const currentarCifrera = field.value
                    const currentBuildPartnerId = watch('assetRegisterDTO.id')

                    // Find the selected option - prioritize exact CIF match
                    const selectedOption =
                      buildPartnerOptions.find((opt) => {
                        // First priority: match by arCifrera value
                        if (
                          currentarCifrera &&
                          opt.value === currentarCifrera
                        ) {
                          return true
                        }
                        // Second priority: match by ID if available
                        if (
                          currentBuildPartnerId &&
                          opt.buildPartner?.id === currentBuildPartnerId
                        ) {
                          return true
                        }
                        return false
                      }) || null

                    return (
                      <Autocomplete
                        key={`autocomplete-${currentarCifrera || currentBuildPartnerId || 'empty'}`}
                        value={selectedOption}
                        onChange={(_event, newValue) => {
                          if (newValue) {
                            const arCifrera = newValue.value || ''
                            const partnerId = newValue.buildPartner?.id

                            field.onChange(arCifrera)

                            setValue('assetRegisterDTO.id', partnerId, {
                              shouldDirty: true,
                              shouldTouch: false,
                            })

                            handleDeveloperChange(arCifrera)

                            trigger('assetRegisterDTO.arCifrera')
                            trigger('assetRegisterDTO.id')
                          } else {
                            field.onChange('')
                            setValue('assetRegisterDTO.id', null as any, {
                              shouldDirty: true,
                              shouldTouch: false,
                            })
                            setValue('assetRegisterDTO.arName', '', {
                              shouldDirty: true,
                              shouldTouch: false,
                            })
                            setValue('assetRegisterDTO.arMasterName', '', {
                              shouldDirty: true,
                              shouldTouch: false,
                            })
                          }
                        }}
                        options={buildPartnerOptions}
                        getOptionLabel={(option) => option.label || ''}
                        isOptionEqualToValue={(option, value) => {
                          if (!option || !value) return false
                          if (
                            option.value &&
                            value.value &&
                            option.value === value.value
                          ) {
                            return true
                          }
                          if (
                            option.buildPartner?.id &&
                            value.buildPartner?.id &&
                            option.buildPartner.id === value.buildPartner.id
                          ) {
                            return true
                          }
                          return false
                        }}
                        renderOption={(props, option) => (
                          <li
                            {...props}
                            key={option.buildPartner?.id || option.value}
                          >
                            {option.label}
                          </li>
                        )}
                        loading={isDevelopersLoading}
                        disabled={isViewMode || isDevelopersLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={getLabel(
                              'CDL_MF_AR_CIF',
                              language,
                              'Asset Registry CIF/Name'
                            )}
                            error={!!errors.assetRegisterDTO?.arCifrera}
                            helperText={
                              errors.assetRegisterDTO?.arCifrera?.message
                            }
                            required={!isViewMode}
                            size="medium"
                            InputLabelProps={{ sx: (labelSx as any)(theme) }}
                            InputProps={{
                              ...params.InputProps,
                              sx: (valueSx as any)(theme),
                            }}
                            sx={
                              errors.assetRegisterDTO?.arCifrera
                                ? (errorFieldStyles as any)(theme)
                                : (commonFieldStyles as any)(theme)
                            }
                          />
                        )}
                        PaperComponent={({ children, ...props }: any) => (
                          <Paper
                            {...props}
                            sx={{
                              borderRadius: '12px',
                              boxShadow:
                                theme.palette.mode === 'dark'
                                  ? '0 10px 25px rgba(0, 0, 0, 0.5)'
                                  : '0 10px 25px rgba(0, 0, 0, 0.1)',
                              border:
                                theme.palette.mode === 'dark'
                                  ? `1px solid ${alpha('#FFFFFF', 0.2)}`
                                  : '1px solid #E5E7EB',
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? alpha(theme.palette.background.paper, 0.95)
                                  : '#FFFFFF',
                              marginTop: '8px',
                              maxHeight: '300px',
                            }}
                          >
                            {children}
                          </Paper>
                        )}
                        sx={
                          {
                            '& .MuiAutocomplete-inputRoot': {
                              ...(selectStyles(theme) as any),
                              '& .MuiOutlinedInput-notchedOutline': {
                                border: errors.assetRegisterDTO?.arCifrera
                                  ? `1px solid ${theme.palette.error.main}`
                                  : theme.palette.mode === 'dark'
                                    ? `1px solid ${alpha('#FFFFFF', 0.3)}`
                                    : '1px solid #d1d5db',
                                borderRadius: '6px',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                border: errors.assetRegisterDTO?.arCifrera
                                  ? `1px solid ${theme.palette.error.main}`
                                  : theme.palette.mode === 'dark'
                                    ? `1px solid ${alpha('#FFFFFF', 0.5)}`
                                    : '1px solid #9ca3af',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                {
                                  border: errors.assetRegisterDTO?.arCifrera
                                    ? `2px solid ${theme.palette.error.main}`
                                    : `2px solid ${theme.palette.primary.main}`,
                                },
                            },
                          } as any
                        }
                      />
                    )
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="assetRegisterDTO.arCifrera"
                  control={control}
                  {...(sanitizedData?.assetRegisterDTO?.arCifrera !==
                    undefined && {
                    defaultValue: sanitizedData.assetRegisterDTO.arCifrera,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('assetRegisterDTO.arCifrera', value),
                  }}
                  render={({ field }) => {
                    return (
                      <TextField
                        {...field}
                        value={field.value || ''}
                        fullWidth
                        disabled={true}
                        label={getLabel(
                          'CDL_MF_AR_ID',
                          language,
                          'Asset Registry ID (RERA)'
                        )}
                        required={true}
                        InputLabelProps={{
                          sx: labelSx(theme),
                          shrink: !!field.value,
                        }}
                        InputProps={{ sx: valueSx(theme) }}
                        sx={(commonFieldStyles as any)(theme)}
                        helperText="Auto-filled when Asset Registry is selected"
                      />
                    )
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="assetRegisterDTO.arName"
                  control={control}
                  {...(sanitizedData?.assetRegisterDTO?.arName !== undefined && {
                    defaultValue: sanitizedData.assetRegisterDTO.arName,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      fullWidth
                      disabled={true}
                      label={getLabel(
                        'CDL_MF_AR_NAME',
                        language,
                        'Master Asset Registry  Name '
                      )}
                      required={true}
                      InputLabelProps={{
                        sx: labelSx(theme),
                        shrink: !!field.value,
                      }}
                      InputProps={{ sx: valueSx(theme) }}
                      sx={(commonFieldStyles as any)(theme)}
                      helperText="Auto-filled when Management Firm is selected"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="assetRegisterDTO.arMasterName"
                  control={control}
                  defaultValue={
                    sanitizedData?.assetRegisterDTO?.arMasterName || ''
                  }
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('assetRegisterDTO.arMasterName', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      fullWidth
                      disabled={true}
                      label={getLabel(
                        'CDL_MF_BPA_NAME',
                        language,
                        'Master Management Firm Name'
                      )}
                      error={!!errors.assetRegisterDTO?.arMasterName}
                      helperText={
                        errors.assetRegisterDTO?.arMasterName?.message ||
                        'Auto-filled when Management Firm is selected'
                      }
                      InputLabelProps={{
                        sx: labelSx(theme),
                        shrink: !!field.value,
                      }}
                      InputProps={{ sx: valueSx(theme) }}
                      sx={
                        errors.assetRegisterDTO?.arMasterName
                          ? errorFieldStyles(theme)
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfReraNumber"
                  control={control}
                  {...(sanitizedData?.mfReraNumber !== undefined && {
                    defaultValue: sanitizedData.mfReraNumber,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfReraNumber', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode || isEditMode}
                      label={getLabel(
                        'CDL_MF_REGNO',
                        language,
                        'Project RERA Number'
                      )}
                      required={true}
                      error={!!errors.mfReraNumber}
                      helperText={errors.mfReraNumber?.message}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfReraNumber
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfName"
                  control={control}
                  {...(sanitizedData?.mfName !== undefined && {
                    defaultValue: sanitizedData.mfName,
                  })}
                  rules={{
                    validate: (value: any) => {
                      const result = validateStep1Field('mfName', value)
                      return result
                    },
                  }}
                  render={({ field }) => {
                    const hasError = !!errors.mfName
                    return (
                      <TextField
                        {...field}
                        fullWidth
                        disabled={isViewMode}
                        label={getLabel('CDL_MF_NAME', language, 'Asset Name')}
                        error={hasError}
                        helperText={errors.mfName?.message}
                        required={true}
                        InputLabelProps={{ sx: labelSx }}
                        InputProps={{ sx: valueSx(theme) }}
                        sx={
                          hasError
                            ? errorFieldStyles(theme)
                            : commonFieldStyles(theme)
                        }
                      />
                    )
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfTypeDTO.id"
                  control={control}
                  {...(sanitizedData?.mfTypeDTO?.id !== undefined && {
                    defaultValue: sanitizedData.mfTypeDTO.id,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfTypeDTO.id', value),
                  }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.mfTypeDTO?.id}
                      required
                    >
                      <InputLabel sx={labelSx(theme)}>
                        {getLabel('CDL_MF_TYPE', language, 'Asset Type')}
                      </InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        disabled={isViewMode || isProjectTypesLoading}
                        label={getLabel('CDL_MF_TYPE', language, 'Asset Type')}
                        IconComponent={KeyboardArrowDownIcon}
                        // sx={{ ...selectStyles, ...valueSx }}
                        sx={{
                          ...selectStyles(theme),
                          ...valueSx(theme),
                          '& .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.3)}`
                                : '1px solid #d1d5db',
                            borderRadius: '6px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.5)}`
                                : '1px solid #9ca3af',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: `2px solid ${theme.palette.primary.main}`,
                          },
                        }}
                      >
                        {isProjectTypesLoading ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          projectTypesData?.map((projectType) => (
                            <MenuItem
                              key={projectType.id}
                              value={projectType.id}
                            >
                              {projectType.configValue}
                            </MenuItem>
                          )) || []
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 12 }}>
                <Controller
                  name="mfLocation"
                  control={control}
                  {...(sanitizedData?.mfLocation !== undefined && {
                    defaultValue: sanitizedData.mfLocation,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfLocation', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_LOCATION',
                        language,
                        'Asset Location'
                      )}
                      error={!!errors.mfLocation}
                      helperText={errors.mfLocation?.message}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfLocation
                          ? (errorFieldStyles as any)(theme)
                          : (commonFieldStyles as any)(theme)
                      }
                      required={true}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="mfCif"
                  control={control}
                  {...(sanitizedData?.mfCif !== undefined && {
                    defaultValue: sanitizedData.mfCif,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfCif', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_CIF',
                        language,
                        'Project Account CIF'
                      )}
                      error={!!errors.mfCif}
                      helperText={errors.mfCif?.message}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfCif
                          ? (errorFieldStyles as any)(theme)
                          : (commonFieldStyles as any)(theme)
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="mfStatusDTO.id"
                  control={control}
                  {...(sanitizedData?.mfStatusDTO?.id !== undefined && {
                    defaultValue: sanitizedData.mfStatusDTO.id,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfStatusDTO.id', value),
                  }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.mfStatusDTO?.id}
                      required
                    >
                      <InputLabel sx={labelSx(theme)}>
                        {getLabel('CDL_MF_STATUS', language, 'Project Status')}
                      </InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        disabled={isViewMode || isProjectStatusesLoading}
                        label={getLabel(
                          'CDL_MF_STATUS',
                          language,
                          'Project Status'
                        )}
                        IconComponent={KeyboardArrowDownIcon}
                        sx={{
                          ...selectStyles(theme),
                          ...valueSx(theme),
                          '& .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.3)}`
                                : '1px solid #d1d5db',
                            borderRadius: '6px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.5)}`
                                : '1px solid #9ca3af',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: `2px solid ${theme.palette.primary.main}`,
                          },
                        }}
                      >
                        {isProjectStatusesLoading ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          projectStatusesData?.map((projectStatus) => (
                            <MenuItem
                              key={projectStatus.id}
                              value={projectStatus.id}
                            >
                              {projectStatus.configValue}
                            </MenuItem>
                          )) || []
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="mfAccountStatusDTO.id"
                  control={control}
                  {...(sanitizedData?.mfAccountStatusDTO?.id !== undefined && {
                    defaultValue: sanitizedData.mfAccountStatusDTO.id,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfAccountStatusDTO.id', value),
                  }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.mfAccountStatusDTO?.id}
                      required
                    >
                      <InputLabel sx={labelSx(theme)}>
                        {getLabel(
                          'CDL_MF_ACC_STATUS',
                          language,
                          'Project Account Status'
                        )}
                      </InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        disabled={isViewMode || isBankAccountStatusesLoading}
                        label={getLabel(
                          'CDL_MF_ACC_STATUS',
                          language,
                          'Project Account Status'
                        )}
                        IconComponent={KeyboardArrowDownIcon}
                        sx={{
                          ...selectStyles(theme),
                          ...valueSx(theme),
                          '& .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.3)}`
                                : '1px solid #d1d5db',
                            borderRadius: '6px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.5)}`
                                : '1px solid #9ca3af',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: `2px solid ${theme.palette.primary.main}`,
                          },
                        }}
                      >
                        {isBankAccountStatusesLoading ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          bankAccountStatusesData?.map((status: any) => (
                            <MenuItem key={status.id} value={status.id}>
                              {status.configValue}
                            </MenuItem>
                          )) || []
                        )}
                      </Select>
                      {errors.mfAccountStatusDTO?.id && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.75 }}
                        >
                          {errors.mfAccountStatusDTO.id.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfAccoutStatusDate"
                  control={control}
                  {...(sanitizedData?.mfAccoutStatusDate !== undefined && {
                    defaultValue: sanitizedData.mfAccoutStatusDate,
                  })}
                  render={({ field }) => (
                    <DatePicker
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_ACC_STATUS_DATE',
                        language,
                        'Project Account Status Date'
                      )}
                      value={field.value || null}
                      onChange={field.onChange}
                      format="DD/MM/YYYY"
                      slots={{
                        openPickerIcon: StyledCalendarIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.mfAccoutStatusDate,
                          helperText: errors.mfAccoutStatusDate?.message,
                          sx: errors.mfAccoutStatusDate
                            ? errorFieldStyles(theme)
                            : (datePickerStyles as any)(theme),
                          InputLabelProps: { sx: labelSx(theme) },
                          InputProps: {
                            sx: valueSx(theme),
                            style: { height: '46px' },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfRegistrationDate"
                  control={control}
                  {...(sanitizedData?.mfRegistrationDate !== undefined && {
                    defaultValue: sanitizedData.mfRegistrationDate,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfRegistrationDate', value),
                  }}
                  render={({ field }) => (
                    <DatePicker
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_REG_DATE',
                        language,
                        'Project Registration Date'
                      )}
                      value={field.value || null}
                      onChange={field.onChange}
                      format="DD/MM/YYYY"
                      slots={{
                        openPickerIcon: StyledCalendarIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.mfRegistrationDate,
                          helperText: errors.mfRegistrationDate?.message,
                          sx: errors.mfRegistrationDate
                            ? errorFieldStyles(theme)
                            : (datePickerStyles as any)(theme),
                          InputLabelProps: { sx: labelSx(theme) },
                          InputProps: {
                            sx: valueSx(theme),
                            style: { height: '46px' },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfStartDate"
                  control={control}
                  {...(sanitizedData?.mfStartDate !== undefined && {
                    defaultValue: sanitizedData.mfStartDate,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfStartDate', value),
                  }}
                  render={({ field }) => (
                    <DatePicker
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_EST_DATE',
                        language,
                        'Project Start Date Est.*'
                      )}
                      value={field.value || null}
                      onChange={field.onChange}
                      format="DD/MM/YYYY"
                      slots={{
                        openPickerIcon: StyledCalendarIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.mfStartDate,
                          helperText: errors.mfStartDate?.message,
                          sx: errors.mfStartDate
                            ? errorFieldStyles
                            : datePickerStyles,
                          InputLabelProps: { sx: labelSx },
                          InputProps: {
                            sx: valueSx,
                            style: { height: '46px' },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfCompletionDate"
                  control={control}
                  {...(sanitizedData?.mfCompletionDate !== undefined && {
                    defaultValue: sanitizedData.mfCompletionDate,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfCompletionDate', value),
                  }}
                  render={({ field }) => (
                    <DatePicker
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_EST_COMPLETION_DATE',
                        language,
                        'Project Completion Date*'
                      )}
                      value={field.value || null}
                      onChange={field.onChange}
                      format="DD/MM/YYYY"
                      slots={{
                        openPickerIcon: StyledCalendarIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.mfCompletionDate,
                          helperText: errors.mfCompletionDate?.message,
                          sx: errors.mfCompletionDate
                            ? errorFieldStyles
                            : datePickerStyles,
                          InputLabelProps: { sx: labelSx },
                          InputProps: {
                            sx: valueSx,
                            style: { height: '46px' },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfRetentionPercent"
                  control={control}
                  {...(sanitizedData?.mfRetentionPercent !== undefined && {
                    defaultValue: sanitizedData.mfRetentionPercent,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfRetentionPercent', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_PRIMARY_RETENTION',
                        language,
                        'Retention %'
                      )}
                      error={!!errors.mfRetentionPercent}
                      helperText={errors.mfRetentionPercent?.message}
                      required={true}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfRetentionPercent
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfAdditionalRetentionPercent"
                  control={control}
                  {...(sanitizedData?.mfAdditionalRetentionPercent !==
                    undefined && {
                    defaultValue: sanitizedData.mfAdditionalRetentionPercent,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field(
                        'mfAdditionalRetentionPercent',
                        value
                      ),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_SECONDARY_RETENTION',
                        language,
                        'Additional Retention %'
                      )}
                      error={!!errors.mfAdditionalRetentionPercent}
                      helperText={errors.mfAdditionalRetentionPercent?.message}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfAdditionalRetentionPercent
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfTotalRetentionPercent"
                  control={control}
                  {...(sanitizedData?.mfTotalRetentionPercent !==
                    undefined && {
                    defaultValue: sanitizedData.mfTotalRetentionPercent,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_AGG_RETENTION',
                        language,
                        'Total Retention %'
                      )}
                      InputLabelProps={{
                        sx: labelSx(theme),
                        shrink: !!field.value,
                      }}
                      InputProps={{ sx: valueSx }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="mfRetentionEffectiveDate"
                  control={control}
                  defaultValue={
                    sanitizedData?.mfRetentionEffectiveDate || null
                  }
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfRetentionEffectiveDate', value),
                  }}
                  render={({ field }) => (
                    <DatePicker
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_RETENTION_START_DATE',
                        language,
                        'Retention Effective Start Date'
                      )}
                      value={field.value || null}
                      onChange={field.onChange}
                      format="DD/MM/YYYY"
                      slots={{
                        openPickerIcon: StyledCalendarIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.mfRetentionEffectiveDate,
                          helperText: errors.mfRetentionEffectiveDate?.message,
                          sx: errors.mfRetentionEffectiveDate
                            ? errorFieldStyles
                            : datePickerStyles,
                          InputLabelProps: { sx: labelSx },
                          InputProps: {
                            sx: valueSx,
                            style: { height: '46px' },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfManagementExpenses"
                  control={control}
                  {...(sanitizedData?.mfManagementExpenses !== undefined && {
                    defaultValue: sanitizedData.mfManagementExpenses,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfManagementExpenses', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_MGMT_EXPENSES',
                        language,
                        'Asset Management Expenses'
                      )}
                      error={!!errors.mfManagementExpenses}
                      helperText={errors.mfManagementExpenses?.message}
                      required={true}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfManagementExpenses
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfMarketingExpenses"
                  control={control}
                  {...(sanitizedData?.mfMarketingExpenses !== undefined && {
                    defaultValue: sanitizedData.mfMarketingExpenses,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfMarketingExpenses', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_MARKETING_COST',
                        language,
                        'Marketing Expenses'
                      )}
                      error={!!errors.mfMarketingExpenses}
                      helperText={errors.mfMarketingExpenses?.message}
                      required={true}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfMarketingExpenses
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfRealEstateBrokerExp"
                  control={control}
                  {...(sanitizedData?.mfRealEstateBrokerExp !== undefined &&
                    sanitizedData?.mfRealEstateBrokerExp !== null && {
                      defaultValue: sanitizedData.mfRealEstateBrokerExp,
                    })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_BROK_FEES',
                        language,
                        'Real Estate Broker Expense'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfAdvertisementExp"
                  control={control}
                  {...(sanitizedData?.mfAdvertisementExp !== undefined && {
                    defaultValue: sanitizedData.mfAdvertisementExp,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_ADVTG_COST',
                        language,
                        'Advertising Expense'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfLandOwnerName"
                  control={control}
                  {...(sanitizedData?.mfLandOwnerName !== undefined && {
                    defaultValue: sanitizedData.mfLandOwnerName,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_LANDOWNER_NAME',
                        language,
                        'Land Owner Name'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfPercentComplete"
                  control={control}
                  {...(sanitizedData?.mfPercentComplete !== undefined && {
                    defaultValue: sanitizedData.mfPercentComplete,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_ASST_COMP_PER',
                        language,
                        'Project Completion Percentage'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <Controller
                  name="mfConstructionCostCurrencyDTO.id"
                  control={control}
                  {...(sanitizedData?.mfConstructionCostCurrencyDTO?.id !==
                    undefined &&
                    sanitizedData?.mfConstructionCostCurrencyDTO?.id !==
                      null && {
                      defaultValue:
                        sanitizedData.mfConstructionCostCurrencyDTO.id,
                    })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field(
                        'mfConstructionCostCurrencyDTO.id',
                        value
                      ),
                  }}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      error={!!errors.mfConstructionCostCurrencyDTO?.id}
                      required
                    >
                      <InputLabel sx={labelSx(theme)}>
                        {getLabel('CDL_MF_TRAN_CUR', language, 'Currency')}
                      </InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        disabled={isViewMode || isProjectCurrenciesLoading}
                        label={getLabel(
                          'CDL_MF_TRAN_CUR',
                          language,
                          'Currency'
                        )}
                        IconComponent={KeyboardArrowDownIcon}
                        sx={{
                          ...selectStyles(theme),
                          ...valueSx(theme),
                          '& .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.3)}`
                                : '1px solid #d1d5db',
                            borderRadius: '6px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border:
                              theme.palette.mode === 'dark'
                                ? `1px solid ${alpha('#FFFFFF', 0.5)}`
                                : '1px solid #9ca3af',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: `2px solid ${theme.palette.primary.main}`,
                          },
                        }}
                      >
                        {isProjectCurrenciesLoading ? (
                          <MenuItem disabled>Loading...</MenuItem>
                        ) : (
                          projectCurrenciesData?.map((currency: any) => (
                            <MenuItem key={currency.id} value={currency.id}>
                              {currency.configValue}
                            </MenuItem>
                          )) || []
                        )}
                      </Select>
                      {errors.mfConstructionCostCurrencyDTO?.id && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.75 }}
                        >
                          {errors.mfConstructionCostCurrencyDTO.id.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="mfConstructionCost"
                  control={control}
                  {...(sanitizedData?.mfConstructionCost !== undefined && {
                    defaultValue: sanitizedData.mfConstructionCost,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_ACT_COST',
                        language,
                        'Actual Construction Cost'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfNoOfUnits"
                  control={control}
                  {...(sanitizedData?.mfNoOfUnits !== undefined && {
                    defaultValue: sanitizedData.mfNoOfUnits,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_TOTAL_UNIT',
                        language,
                        'No. of Units'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="mfRemarks"
                  control={control}
                  {...(sanitizedData?.mfRemarks !== undefined && {
                    defaultValue: sanitizedData.mfRemarks,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel('CDL_MF_ADD_NOTES', language, 'Remarks')}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="mfSpecialApproval"
                  control={control}
                  {...(sanitizedData?.mfSpecialApproval !== undefined && {
                    defaultValue: sanitizedData.mfSpecialApproval,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_SP_REG_APPROVAL',
                        language,
                        'Special Approval 123456'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfBlockPaymentTypeDTO.id"
                  control={control}
                  {...(sanitizedData?.mfBlockPaymentTypeDTO?.id !==
                    undefined &&
                    sanitizedData?.mfBlockPaymentTypeDTO?.id !== null && {
                      defaultValue: sanitizedData.mfBlockPaymentTypeDTO.id,
                    })}
                  render={({ field }) => {
                    return (
                      <FormControl
                        fullWidth
                        error={!!errors.mfBlockPaymentTypeDTO?.id}
                      >
                        <InputLabel sx={labelSx(theme)}>
                          {getLabel(
                            'CDL_MF_RES_PAYMENT_TYPE',
                            language,
                            'Payment Type to be Blocked'
                          )}
                        </InputLabel>
                        <Select
                          {...field}
                          value={field.value || ''}
                          disabled={isViewMode || isBlockedPaymentTypesLoading}
                          label={getLabel(
                            'CDL_MF_RES_PAYMENT_TYPE',
                            language,
                            'Payment Type to be Blocked'
                          )}
                          IconComponent={KeyboardArrowDownIcon}
                          sx={{
                            ...selectStyles(theme),
                            ...valueSx(theme),
                            '& .MuiOutlinedInput-notchedOutline': {
                              border:
                                theme.palette.mode === 'dark'
                                  ? `1px solid ${alpha('#FFFFFF', 0.3)}`
                                  : '1px solid #d1d5db',
                              borderRadius: '6px',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border:
                                theme.palette.mode === 'dark'
                                  ? `1px solid ${alpha('#FFFFFF', 0.5)}`
                                  : '1px solid #9ca3af',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: `2px solid ${theme.palette.primary.main}`,
                            },
                          }}
                        >
                          {isBlockedPaymentTypesLoading ? (
                            <MenuItem disabled>Loading...</MenuItem>
                          ) : (
                            blockedPaymentTypesData?.map((paymentType: any) => (
                              <MenuItem
                                key={paymentType.id}
                                value={paymentType.id}
                              >
                                {paymentType.configValue}
                              </MenuItem>
                            )) || []
                          )}
                        </Select>
                      </FormControl>
                    )
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfManagedBy"
                  control={control}
                  {...(sanitizedData?.mfManagedBy !== undefined && {
                    defaultValue: sanitizedData.mfManagedBy,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_ASS_MANAGER',
                        language,
                        'Managed By'
                      )}
                      error={!!errors.mfManagedBy}
                      helperText={errors.mfManagedBy?.message}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfManagedBy
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfBackupUser"
                  control={control}
                  {...(sanitizedData?.mfBackupUser !== undefined && {
                    defaultValue: sanitizedData.mfBackupUser,
                  })}
                  rules={{
                    validate: (value: any) =>
                      validateStep1Field('mfBackupUser', value),
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_BACKUP_MANAGER',
                        language,
                        'Backup Manager'
                      )}
                      error={!!errors.mfBackupUser}
                      helperText={errors.mfBackupUser?.message}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={
                        errors.mfBackupUser
                          ? errorFieldStyles
                          : commonFieldStyles
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfRelationshipManagerName"
                  control={control}
                  {...(sanitizedData?.mfRelationshipManagerName !==
                    undefined && {
                    defaultValue: sanitizedData.mfRelationshipManagerName,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_RM',
                        language,
                        'Relationship Manager'
                      )}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              variant="contained"
                              size="small"
                              disabled={isViewMode}
                              sx={{
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                textTransform: 'none',
                                background: '#2563EB',
                                '&:hover': {
                                  background: '#1D4ED8',
                                },
                                minWidth: '100px',
                                height: '32px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 500,
                                fontStyle: 'normal',
                                fontSize: '11px',
                                lineHeight: '14px',
                                letterSpacing: '0.3px',
                                px: 1,
                              }}
                              onClick={() => {
                                // Add your fetch logic here
                              }}
                            >
                              Fetch Details
                            </Button>
                          </InputAdornment>
                        ),
                        sx: valueSx,
                      }}
                      InputLabelProps={{ sx: labelSx }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfAssestRelshipManagerName"
                  control={control}
                  {...(sanitizedData?.mfAssestRelshipManagerName !==
                    undefined && {
                    defaultValue: sanitizedData.mfAssestRelshipManagerName,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_ARM',
                        language,
                        'Asset Relationship Manager'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mfTeamLeadName"
                  control={control}
                  {...(sanitizedData?.mfTeamLeadName !== undefined && {
                    defaultValue: sanitizedData.mfTeamLeadName,
                  })}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_MF_TL',
                        language,
                        'Team Leader Name12345'
                      )}
                      InputLabelProps={{ sx: (labelSx as any)(theme) }}
                      InputProps={{ sx: (valueSx as any)(theme) }}
                      sx={commonFieldStyles}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </LocalizationProvider>
    )
  }
)

export default Step1
