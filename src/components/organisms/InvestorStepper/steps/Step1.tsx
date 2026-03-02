'use client'

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import { investorIdService } from '../../../../services/api/investorIdService'
import { capitalPartnerService } from '../../../../services/api/capitalPartnerService'
import { useGetEnhanced } from '@/hooks/useApiEnhanced'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { CapitalPartnerResponse } from '@/types/capitalPartner'
import {
  mapStep1ToCapitalPartnerPayload,
  type Step1FormData,
} from '../../../../utils/capitalPartnerMapper'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import {
  useInvestorTypes,
  useInvestorIdTypes,
  useCountries,
} from '../../../../hooks/useApplicationSettings1'
import { useCapitalPartnerLabelsApi } from '@/hooks/useCapitalPartnerLabelsApi'
import { useAppStore } from '@/store'

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { Controller, useFormContext } from 'react-hook-form'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { CapitalPartnerStep1Schema, type CapitalPartnerStep1Data } from '@/lib/validation'
import { FormError } from '../../../atoms/FormError'
import { alpha } from '@mui/material/styles'

interface Step1Props {
  onSaveAndNext?: (data: any) => void
  isEditMode?: boolean
  capitalPartnerId?: number | null
  isViewMode?: boolean
}

export interface Step1Ref {
  /** Returns the owner registry id on success (create or edit); throws on failure. */
  handleSaveAndNext: () => Promise<number>
}

const Step1 = forwardRef<Step1Ref, Step1Props>(
  (
    { onSaveAndNext, isEditMode, capitalPartnerId, isViewMode = false },
    ref
  ) => {
    const {
      control,
      watch,
      setValue,
      trigger,
      setError,
      clearErrors,
      formState: { errors },
    } = useFormContext()

    // Get labels from API
    const { getLabel } = useCapitalPartnerLabelsApi()
    const currentLanguage = useAppStore((state) => state.language)

    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    const textPrimary = isDark ? '#FFFFFF' : '#1E2939'
    const textSecondary = isDark ? '#CBD5E1' : '#6B7280'
    const neutralBorder = isDark ? alpha('#FFFFFF', 0.3) : '#CAD5E2'
    const neutralBorderHover = isDark ? alpha('#FFFFFF', 0.5) : '#CAD5E2'
    const focusBorder = theme.palette.primary.main
    const viewModeBorder = isDark ? alpha('#FFFFFF', 0.2) : '#E5E7EB'
    const viewModeBg = isDark
      ? alpha(theme.palette.background.paper, 0.25)
      : '#F9FAFB'
    const selectIconColor = isDark ? alpha('#FFFFFF', 0.7) : '#666'

    const [investorId, setInvestorId] = useState<string>('')
    const [isGeneratingId, setIsGeneratingId] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const {
      data: investorTypes,
      loading: loadingInvestorTypes,
      error: investorTypesError,
    } = useInvestorTypes()
    const {
      data: idTypes,
      loading: loadingIdTypes,
      error: idTypesError,
    } = useInvestorIdTypes()
    const {
      data: countries,
      loading: loadingCountries,
      error: countriesError,
    } = useCountries()

    // Load existing data when in edit mode
    const {
      data: existingCapitalPartnerData,
      isLoading: isLoadingExistingData,
    } = useGetEnhanced<CapitalPartnerResponse>(
      API_ENDPOINTS.OWNER_REGISTRY.GET_BY_ID(
        (capitalPartnerId || 0).toString()
      ),
      {},
      {
        enabled: Boolean(isEditMode && capitalPartnerId),
        // Disable caching to always fetch fresh data
        gcTime: 0,
        staleTime: 0,
        // Always refetch when component mounts
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
      }
    )

    // Pre-populate form when existing data is loaded (supports ownerRegistry* or capitalPartner* from API; handles wrapped { data } or array response)
    useEffect(() => {
      if (!isEditMode || !existingCapitalPartnerData || isLoadingExistingData) return

      const raw = existingCapitalPartnerData as unknown
      // Normalize: API may return single object, { data/result/content: object }, or array (e.g. list response)
      let existing: Record<string, unknown>
      if (Array.isArray(raw)) {
        existing = (raw[0] as Record<string, unknown>) ?? {}
      } else {
        const obj = raw as Record<string, unknown>
        const fromData = obj?.data as Record<string, unknown> | undefined
        const fromResult = obj?.result as Record<string, unknown> | undefined
        const fromContent = obj?.content as Record<string, unknown> | undefined
        existing = fromData ?? fromResult ?? fromContent ?? obj
      }

      // Owner Type: API may return ownerRegistryTypeDTO, investorTypeDTO, ownerTypeDTO, or string ownerType/ownerRegistryType
      const typeDto = (existing.ownerRegistryTypeDTO ?? existing.ownerTypeDTO ?? existing.investorTypeDTO) as Record<string, unknown> | undefined
      let typeVal = ''
      if (typeDto?.id != null && Array.isArray(investorTypes) && investorTypes.length > 0) {
        const byId = investorTypes.find((o: { id: number }) => o.id === Number(typeDto.id))
        if (byId?.settingValue) typeVal = byId.settingValue
      }
      if (!typeVal && typeDto) {
        typeVal =
          String(typeDto.settingValue ?? (typeDto.languageTranslationId as Record<string, unknown>)?.configValue ?? typeDto.configValue ?? '')
      }
      // Fallback: API may return type as string (ownerType, ownerRegistryType)
      if (!typeVal && Array.isArray(investorTypes) && investorTypes.length > 0) {
        const typeStr = String(existing.ownerType ?? existing.ownerRegistryType ?? '').trim()
        if (typeStr) {
          const bySetting = investorTypes.find((o: { settingValue: string }) => o.settingValue === typeStr)
          if (bySetting?.settingValue) typeVal = bySetting.settingValue
        }
      }
      setValue('investorType', typeVal)

      const refId = String(existing.ownerRegistryId ?? existing.capitalPartnerId ?? '')
      setValue('investorId', refId)

      // Names: API uses ownerRegistryName / ownerRegistryMiddleName / ownerRegistryLastName (flat ownerName etc. are often null)
      const firstName = existing.ownerRegistryName ?? existing.capitalPartnerName ?? existing.ownerName ?? existing.investorFirstName ?? existing.firstName ?? existing.name ?? ''
      const middleName = existing.ownerRegistryMiddleName ?? existing.capitalPartnerMiddleName ?? existing.ownerMiddleName ?? existing.investorMiddleName ?? ''
      const lastName = existing.ownerRegistryLastName ?? existing.capitalPartnerLastName ?? existing.ownerLastName ?? existing.investorLastName ?? ''
      setValue('investorFirstName', String(firstName))
      setValue('investorMiddleName', String(middleName))
      setValue('investorLastName', String(lastName))
      setValue('arabicName', String(existing.ownerRegistryLocaleName ?? existing.ownerLocalName ?? ''))

      const pct = existing.ownerRegistryOwnershipPercentage ?? existing.capitalPartnerOwnershipPercentage ?? existing.ownerOwnershipShare
      setValue('ownership', pct != null ? String(pct) : '')

      // Owner ID Type: documentTypeDTO; prefer matching dropdown by id
      const docTypeDto = existing.documentTypeDTO as Record<string, unknown> | undefined
      let idTypeVal = ''
      if (docTypeDto?.id != null && Array.isArray(idTypes) && idTypes.length > 0) {
        const byId = idTypes.find((o: { id: number }) => o.id === Number(docTypeDto.id))
        if (byId?.settingValue) idTypeVal = byId.settingValue
      }
      if (!idTypeVal && docTypeDto) {
        idTypeVal =
          String(docTypeDto.settingValue ?? (docTypeDto.languageTranslationId as Record<string, unknown>)?.configValue ?? docTypeDto.configValue ?? '')
      }
      setValue('investorIdType', idTypeVal)

      setValue('idNumber', String(existing.ownerRegistryIdNo ?? existing.capitalPartnerIdNo ?? existing.ownerIdNumber ?? ''))

      // ID Expiry Date: API key is idExpiaryDate
      const rawObj = raw as Record<string, unknown>
      const expiryRaw =
        existing.idExpiaryDate ??
        existing.id_expiary_date ??
        rawObj?.idExpiaryDate
      if (expiryRaw != null && expiryRaw !== '') {
        setValue(
          'idExpiaryDate',
          dayjs(expiryRaw as string).isValid() ? dayjs(expiryRaw as string) : null,
          { shouldValidate: true, shouldDirty: true }
        )
      }

      // Nationality: countryOptionDTO; prefer matching dropdown by id
      const countryDto = existing.countryOptionDTO as Record<string, unknown> | undefined
      let countryVal = ''
      if (countryDto?.id != null && Array.isArray(countries) && countries.length > 0) {
        const byId = countries.find((o: { id: number }) => o.id === Number(countryDto.id))
        if (byId?.settingValue) countryVal = byId.settingValue
      }
      if (!countryVal && countryDto) {
        countryVal =
          String(countryDto.settingValue ?? (countryDto.languageTranslationId as Record<string, unknown>)?.configValue ?? countryDto.configValue ?? '')
      }
      setValue('nationality', countryVal)

      setValue('accountContact', String(existing.ownerRegistryTelephoneNo ?? existing.capitalPartnerTelephoneNo ?? ''))
      setValue('mobileNumber', String(existing.ownerRegistryMobileNo ?? existing.capitalPartnerMobileNo ?? existing.ownerMobileNumber ?? ''))
      setValue('email', String(existing.ownerRegistryEmail ?? existing.capitalPartnerEmail ?? existing.ownerEmailAddress ?? ''))
      setInvestorId(refId)
    }, [
      existingCapitalPartnerData,
      isLoadingExistingData,
      isEditMode,
      setValue,
      investorTypes,
      idTypes,
      countries,
    ])

    // Dedicated effect for idExpiaryDate: ensure date shows when API returns it (handles any response shape and sets after paint)
    useEffect(() => {
      if (!isEditMode || !existingCapitalPartnerData || isLoadingExistingData) return
      const raw = existingCapitalPartnerData as unknown as Record<string, unknown>
      const fromData = raw?.data as Record<string, unknown> | undefined
      const fromResult = raw?.result as Record<string, unknown> | undefined
      const fromContent = raw?.content as Record<string, unknown> | undefined
      const entity = fromData ?? fromResult ?? fromContent ?? raw
      const expiryRaw =
        entity?.idExpiaryDate ??
        (entity?.id_expiary_date as string | undefined) ??
        raw?.idExpiaryDate
      if (expiryRaw == null || String(expiryRaw).trim() === '') return
      const parsed = dayjs(expiryRaw as string)
      if (!parsed.isValid()) return
      const rafId = requestAnimationFrame(() => {
        setValue('idExpiaryDate', parsed, { shouldValidate: false, shouldDirty: false })
      })
      return () => cancelAnimationFrame(rafId)
    }, [isEditMode, existingCapitalPartnerData, isLoadingExistingData, setValue])

    React.useEffect(() => {
      const currentId = watch('investorId')
      if (currentId && currentId !== investorId) {
        setInvestorId(currentId)
      }
    }, [watch, investorId])
    const handleGenerateNewId = async () => {
      try {
        setIsGeneratingId(true)
        const newIdResponse = investorIdService.generateNewId()
        setInvestorId(newIdResponse.id)
        // Update RHF state and re-validate so any prior error clears immediately
        setValue('investorId', newIdResponse.id, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        await trigger('investorId')
      } catch {
      } finally {
        setIsGeneratingId(false)
      }
    }
    const handleSaveAndNext = async (): Promise<number> => {
      try {
        setSaveError(null)

        // Build current form data for schema validation and payload mapping
        const formData: Step1FormData = {
          investorType: watch('investorType'),
          investorId: watch('investorId'),
          investorFirstName: watch('investorFirstName'),
          investorMiddleName: watch('investorMiddleName'),
          investorLastName: watch('investorLastName'),
          arabicName: watch('arabicName'),
          ownership: watch('ownership'),
          investorIdType: watch('investorIdType'),
          idNumber: watch('idNumber'),
          idExpiaryDate: watch('idExpiaryDate'),
          nationality: watch('nationality'),
          accountContact: watch('accountContact'),
          mobileNumber: watch('mobileNumber'),
          email: watch('email'),
        }

        const zodResult = CapitalPartnerStep1Schema.safeParse(formData)
        if (!zodResult.success) {
          clearErrors()
          zodResult.error.issues.forEach((issue) => {
            const field = (issue.path?.[0] as string) || ''
            if (field) {
              setError(field as keyof CapitalPartnerStep1Data, {
                type: 'manual',
                message: issue.message,
              })
            }
          })
          await trigger() // validate all fields so every error is shown
          setSaveError('Please fill all required fields correctly.')
          throw new Error('Please fill all required fields correctly.')
        }

        await trigger()

        const payload = mapStep1ToCapitalPartnerPayload(
          formData,
          investorTypes,
          idTypes,
          countries
        )
        let response
        if (isEditMode && capitalPartnerId) {
          const updatePayload = {
            ...payload,
            id: capitalPartnerId,
          }

          if (existingCapitalPartnerData) {
            const raw = existingCapitalPartnerData as unknown
            const existing = Array.isArray(raw)
              ? (raw[0] as Record<string, unknown>)
              : ((raw as Record<string, unknown>)?.data as Record<string, unknown>) ?? (raw as Record<string, unknown>)
            updatePayload.ownerRegistryUnitDTO = existing?.ownerRegistryUnitDTO
            updatePayload.ownerRegistryBankInfoDTOS = existing?.ownerRegistryBankInfoDTOS
            const taskId = (existing?.taskStatusDTO as Record<string, unknown>)?.id
            if (taskId != null) {
              updatePayload.taskStatusDTO = { id: taskId as number }
            }
            updatePayload.deleted = (existing?.deleted as boolean) ?? false
            updatePayload.enabled = (existing?.enabled as boolean) ?? true
          }

          response = await capitalPartnerService.updateCapitalPartner(
            capitalPartnerId,
            updatePayload
          )
        } else {
          // Create new capital partner
          response = await capitalPartnerService.createCapitalPartner(payload)
        }

        // In edit mode we already have capitalPartnerId; use it so we always advance even if API returns empty/different body
        const raw = (response ?? null) as unknown as Record<string, unknown> | null
        const dataObj = raw?.data as Record<string, unknown> | undefined
        const idFromResponse = raw?.id ?? dataObj?.id
        const id = idFromResponse != null ? Number(idFromResponse) : (isEditMode && capitalPartnerId ? capitalPartnerId : null)
        if (id == null && !(isEditMode && capitalPartnerId)) {
          setSaveError('Invalid response: no ID returned from server.')
          throw new Error('Invalid response: no ID returned from server.')
        }
        if (onSaveAndNext) {
          onSaveAndNext({ id: Number(id) })
        }
        return id as number
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'Failed to save data'
        )
        throw err
      }
    }
    useImperativeHandle(
      ref,
      () => ({
        handleSaveAndNext,
      }),
      [handleSaveAndNext]
    )
    const commonFieldStyles = React.useMemo(
      () => ({
        '& .MuiOutlinedInput-root': {
          height: '46px',
          borderRadius: '8px',
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.3)
            : '#FFFFFF',
          '& fieldset': {
            borderColor: neutralBorder,
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: neutralBorderHover,
          },
          '&.Mui-focused fieldset': {
            borderColor: focusBorder,
          },
        },
      }),
      [focusBorder, isDark, neutralBorder, neutralBorderHover, theme]
    )

    const selectStyles = React.useMemo(
      () => ({
        height: '46px',
        '& .MuiOutlinedInput-root': {
          height: '46px',
          borderRadius: '8px',
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.3)
            : '#FFFFFF',
          '& fieldset': {
            borderColor: neutralBorder,
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: neutralBorderHover,
          },
          '&.Mui-focused fieldset': {
            borderColor: focusBorder,
          },
        },
        '& .MuiSelect-icon': {
          color: selectIconColor,
        },
      }),
      [
        focusBorder,
        isDark,
        neutralBorder,
        neutralBorderHover,
        selectIconColor,
        theme,
      ]
    )

    const datePickerStyles = React.useMemo(
      () => ({
        height: '46px',
        '& .MuiOutlinedInput-root': {
          height: '46px',
          borderRadius: '8px',
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.3)
            : '#FFFFFF',
          '& fieldset': {
            borderColor: neutralBorder,
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: neutralBorderHover,
          },
          '&.Mui-focused fieldset': {
            borderColor: focusBorder,
          },
        },
      }),
      [focusBorder, isDark, neutralBorder, neutralBorderHover, theme]
    )

    const getLabelSx = () => ({
      color: textPrimary,
      fontFamily:
        'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: 500,
      fontStyle: 'normal',
      fontSize: '13px',
      letterSpacing: '0.025em',
      marginBottom: '4px',
      '&.Mui-focused': {
        color: theme.palette.primary.main,
      },
      '&.MuiFormLabel-filled': {
        color: textPrimary,
      },
    })

    const valueSx = {
      color: textPrimary,
      fontFamily: 'Outfit',
      fontWeight: 400,
      fontStyle: 'normal',
      fontSize: '14px',
      letterSpacing: 0,
      wordBreak: 'break-word',
    }

    const StyledCalendarIcon = (
      props: React.ComponentProps<typeof CalendarTodayOutlinedIcon>
    ) => (
      <CalendarTodayOutlinedIcon
        {...props}
        sx={{
          width: '18px',
          height: '20px',
          position: 'relative',
          top: '2px',
          left: '3px',
          transform: 'rotate(0deg)',
          opacity: 1,
        }}
      />
    )

    const renderTextField = (
      name: string,
      configId: string,
      fallbackLabel: string,
      defaultValue = '',
      required = false
    ) => {
      const label = getLabel(configId, currentLanguage, fallbackLabel)
      return (
        <Grid key={name} size={{ xs: 12, md: 6 }}>
          <Controller
            name={name}
            control={control}
            defaultValue={defaultValue}
            render={({ field }) => (
              <>
                <TextField
                  {...field}
                  label={label}
                  fullWidth
                  required={required}
                  disabled={isViewMode}
                  error={!!errors[name] && !isViewMode}
                  InputLabelProps={{
                    sx: {
                      ...getLabelSx(),
                      ...(!!errors[name] &&
                        !isViewMode && {
                          color: theme.palette.error.main,
                          '&.Mui-focused': { color: theme.palette.error.main },
                          '&.MuiFormLabel-filled': {
                            color: theme.palette.error.main,
                          },
                        }),
                    },
                  }}
                  InputProps={{
                    sx: {
                      ...valueSx,
                      ...(isViewMode && {
                        backgroundColor: viewModeBg,
                        color: textSecondary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: viewModeBorder,
                        },
                      }),
                    },
                  }}
                  sx={{
                    ...commonFieldStyles,
                    ...(isViewMode && {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: viewModeBorder },
                        '&:hover fieldset': { borderColor: viewModeBorder },
                        '&.Mui-focused fieldset': {
                          borderColor: viewModeBorder,
                        },
                      },
                    }),
                    ...(!!errors[name] &&
                      !isViewMode && {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.error.main,
                            borderWidth: '1px',
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.error.main,
                            borderWidth: '1px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.error.main,
                            borderWidth: '1px',
                          },
                        },
                      }),
                  }}
                />
                <FormError
                  error={errors[name]?.message as string}
                  touched={true}
                />
              </>
            )}
          />
        </Grid>
      )
    }

    const renderInvestorIdField = (
      name: string,
      label: string,
      gridSize: number = 6,
      required: boolean = false
    ) => (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <>
              <TextField
                {...field}
                fullWidth
                label={label}
                value={investorId}
                required={required}
                disabled={isViewMode}
                error={!!errors[name] && !isViewMode}
                onChange={(e) => {
                  setInvestorId(e.target.value)
                  field.onChange(e)
                }}
                InputProps={{
                  endAdornment: !isViewMode ? (
                    <InputAdornment position="end" sx={{ mr: 0 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={handleGenerateNewId}
                        disabled={
                          isGeneratingId || isViewMode || (isEditMode ?? false)
                        }
                        sx={{
                          color: theme.palette.primary.contrastText,
                          borderRadius: '8px',
                          textTransform: 'none',
                          background: theme.palette.primary.main,
                          '&:hover': {
                            background: theme.palette.primary.dark,
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
                        {isGeneratingId ? 'Generating...' : 'Generate ID'}
                      </Button>
                    </InputAdornment>
                  ) : undefined,
                  sx: valueSx,
                }}
                InputLabelProps={{ sx: getLabelSx() }}
                sx={{
                  ...commonFieldStyles,
                  ...(!!errors[name] &&
                    !isViewMode && {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: theme.palette.error.main,
                          borderWidth: '1px',
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.error.main,
                          borderWidth: '1px',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.error.main,
                          borderWidth: '1px',
                        },
                      },
                    }),
                }}
              />
              <FormError
                error={errors[name]?.message as string}
                touched={true}
              />
            </>
          )}
        />
      </Grid>
    )

    // Render function for API-driven dropdowns
    const renderApiSelectField = (
      name: string,
      configId: string,
      fallbackLabel: string,
      options: { id: number; displayName: string; settingValue: string }[],
      gridSize: number = 6,
      _required = false,
      loading = false
    ) => {
      const label = getLabel(configId, currentLanguage, fallbackLabel)
      return (
        <Grid key={name} size={{ xs: 12, md: gridSize }}>
          <Controller
            name={name}
            control={control}
            rules={{}}
            defaultValue={''}
            render={({ field }) => (
              <>
                <FormControl
                  fullWidth
                  error={!!errors[name] && !isViewMode}
                  required={_required}
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: `${textSecondary} !important`,
                    },
                  }}
                >
                  <InputLabel sx={getLabelSx()} shrink>
                    {loading ? `Loading...` : label}
                  </InputLabel>
                  <Select
                    {...field}
                    label={loading ? `Loading...` : label}
                    displayEmpty
                    value={field.value ?? ''}
                    renderValue={(selected) => {
                      if (selected == null || selected === '') {
                        return (
                          <span style={{ color: theme.palette.text.secondary }}>
                            Select...
                          </span>
                        )
                      }
                      const opt = options.find((o) => o.settingValue === selected)
                      return opt ? opt.displayName : String(selected)
                    }}
                    sx={{
                      ...selectStyles,
                      ...valueSx,
                      ...(isViewMode && {
                        backgroundColor: viewModeBg,
                        color: textSecondary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: viewModeBorder,
                        },
                      }),
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: `1px solid ${neutralBorder}`,
                        borderRadius: '6px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: `1px solid ${neutralBorderHover}`,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: `2px solid ${focusBorder}`,
                      },
                      ...(!!errors[name] &&
                        !isViewMode && {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: `1px solid ${theme.palette.error.main}`,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: `1px solid ${theme.palette.error.main}`,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: `1px solid ${theme.palette.error.main}`,
                          },
                        }),
                    }}
                    IconComponent={KeyboardArrowDownIcon}
                    disabled={loading || isViewMode}
                  >
                    {!loading && options.length === 0 && (
                      <MenuItem disabled value="">
                        <em>No options available</em>
                      </MenuItem>
                    )}
                    {options.map((option) => (
                      <MenuItem key={option.id} value={option.settingValue}>
                        {option.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormError
                  error={errors[name]?.message as string}
                  touched={true}
                />
              </>
            )}
          />
        </Grid>
      )
    }

    // Reference: DeveloperStepper Step1 renderDatePickerField – single Controller + DatePicker, error/helperText in slotProps only
    const renderDatePickerField = (
      name: string,
      label: string,
      gridSize: number = 6,
      required = false
    ) => (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <DatePicker
              label={label}
              value={field.value}
              onChange={field.onChange}
              format="DD/MM/YYYY"
              disabled={isViewMode}
              slots={{ openPickerIcon: StyledCalendarIcon }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required,
                  error: !!errors[name] && !isViewMode,
                  helperText: (errors[name]?.message as string) ?? '',
                  sx: {
                    ...datePickerStyles,
                    ...(!!errors[name] &&
                      !isViewMode && {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: theme.palette.error.main },
                          '&:hover fieldset': { borderColor: theme.palette.error.main },
                          '&.Mui-focused fieldset': { borderColor: theme.palette.error.main },
                        },
                      }),
                  },
                  InputLabelProps: { sx: getLabelSx() },
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
    )

    const getFallbackOptions = (key: string) => {
      switch (key) {
        case 'investorType':
          return [
            { id: 1, displayName: 'Individual', settingValue: 'CP_INDIVIDUAL' },
            { id: 2, displayName: 'Company', settingValue: 'CP_COMPANY' },
            { id: 3, displayName: 'Joint', settingValue: 'CP_JOINT' },
          ]
        case 'investorIdType':
          return [
            { id: 1, displayName: 'Passport', settingValue: 'PASSPORT' },
            { id: 2, displayName: 'National ID', settingValue: 'NATIONAL_ID' },
          ]
        case 'nationality':
          return [
            { id: 1, displayName: 'India', settingValue: 'AS_COUNTRY_INDIA' },
            { id: 2, displayName: 'Dubai', settingValue: 'AS_COUNTRY_DUBAI' },
            {
              id: 3,
              displayName: 'Abu Dhabi',
              settingValue: 'AS_COUNTRY_ABU_DHABI',
            },
            {
              id: 4,
              displayName: 'South Africa',
              settingValue: 'AS_COUNTRY_SA',
            },
            { id: 5, displayName: 'USA', settingValue: 'AS_COUNTRY_USA' },
          ]
        default:
          return []
      }
    }

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Card
          sx={{
            boxShadow: 'none',
            backgroundColor: isDark
              ? alpha(theme.palette.background.paper, 0.35)
              : '#FFFFFFBF',
            width: '84%',
            margin: '0 auto',
            color: textPrimary,
          }}
        >
          <CardContent sx={{ color: textPrimary }}>
            {(investorTypesError || idTypesError || countriesError) && (
              <Box
                sx={{
                  mb: 2,
                  p: 1,
                  bgcolor: isDark
                    ? alpha(theme.palette.error.main, 0.15)
                    : '#fef2f2',
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
                }}
              >
                <Typography variant="body2" color="error">
                   Failed to load some dropdown options. Using fallback
                  values.
                </Typography>
              </Box>
            )}
            <Grid container rowSpacing={4} columnSpacing={2}>
              {renderApiSelectField(
                'investorType',
                'CDL_OWNER_TYPE',
                'Owner Registry Type',
                investorTypes?.length
                  ? investorTypes
                  : getFallbackOptions('investorType'),
                6,
                true,
                loadingInvestorTypes
              )}
              {renderInvestorIdField(
                'investorId',
                getLabel('CDL_OWNER_REFID', currentLanguage, 'Owner Registry ID'),
                6,
                true
              )}
              {renderTextField(
                'investorFirstName',
                'CDL_OWNER_FIRSTNAME',
                'Owner Registry Name',
                '',
                true
              )}
              {renderTextField(
                'investorMiddleName',
                'CDL_OWNER_MIDDLENAME',
                'Owner Registry Middle Name'
              )}
              {renderTextField(
                'investorLastName',
                'CDL_OWNER_LASTNAME',
                'Owner Registry Last Name'
              )}
              {renderTextField(
                'arabicName',
                'CDL_OWNER_LOCALE_NAME',
                'Arabic Name'
              )}
              {renderTextField(
                'ownership',
                'CDL_OWNER_OWNERSHIP',
                'Ownership Percentage'
              )}
              {renderApiSelectField(
                'investorIdType',
                'CDL_OWNER_ID_TYPE',
                'Owner Registry ID Type',
                idTypes?.length
                  ? idTypes
                  : getFallbackOptions('investorIdType'),
                6,
                true,
                loadingIdTypes
              )}
              {renderTextField('idNumber', 'CDL_OWNER_DOC_NO', 'ID No.', '', true)}
              {renderDatePickerField(
                'idExpiaryDate',
                getLabel('CDL_OWNER_ID_EXP', currentLanguage, 'ID Expiry Date'),
                6,
                false
              )}
              {renderApiSelectField(
                'nationality',
                'CDL_OWNER_NATIONALITY',
                'Nationality',
                countries?.length
                  ? countries
                  : getFallbackOptions('nationality'),
                6,
                false,
                loadingCountries
              )}
              {renderTextField(
                'accountContact',
                'CDL_OWNER_TELEPHONE',
                'Account Contact Number',
                ''
              )}
              {renderTextField(
                'mobileNumber',
                'CDL_OWNER_MOBILE',
                'Mobile Number',
                ''
              )}
              {renderTextField('email', 'CDL_OWNER_EMAIL', 'Email Address', '')}
            </Grid>
          </CardContent>
        </Card>
      </LocalizationProvider>
    )
  }
)

Step1.displayName = 'Step1'

export default Step1
