'use client'

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import {
  useUnitStatuses,
  usePropertyIds,
} from '../../../../hooks/useApplicationSettings1'
import { useCapitalPartnerLabelsApi } from '@/hooks/useCapitalPartnerLabelsApi'
import { useAppStore } from '@/store'
import {
  useRealEstateAssets,
  transformRealEstateAssetsForDropdown,
} from '../../../../hooks/useRealEstateAssets1'
import { useGetEnhanced } from '@/hooks/useApiEnhanced'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import {
  CapitalPartnerUnitResponse,
  CapitalPartnerUnitPurchaseResponse,
} from '@/types/capitalPartner'
import { capitalPartnerUnitService } from '../../../../services/api/capitalPartnerUnitService'
import { capitalPartnerUnitBookingService } from '../../../../services/api/capitalPartnerUnitBookingService'
import { capitalPartnerUnitPurchaseService } from '../../../../services/api/capitalPartnerUnitPurchaseService'
import {
  mapStep2ToCapitalPartnerUnitPayload,
  type Step2FormData,
} from '../../../../utils/capitalPartnerUnitMapper'

import {
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  useTheme,
  alpha,
  Theme,
} from '@mui/material'
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material'
import { Controller, useFormContext } from 'react-hook-form'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { CapitalPartnerStep2Schema } from '@/lib/validation/capitalPartnerSchemas'
import { FormError } from '../../../atoms/FormError'
import {
  commonFieldStyles as sharedCommonFieldStyles,
  selectStyles as sharedSelectStyles,
  datePickerStyles as sharedDatePickerStyles,
  labelSx as sharedLabelSx,
  valueSx as sharedValueSx,
  calendarIconSx as sharedCalendarIconSx,
  cardStyles as sharedCardStyles,
  errorFieldStyles as sharedErrorFieldStyles,
  viewModeInputStyles,
  neutralBorder,
  neutralBorderHover,
} from '../styles'

interface Step2Props {
  onSaveAndNext?: (data: any) => void
  capitalPartnerId?: number | null
  isEditMode?: boolean
  isViewMode?: boolean
}

export interface Step2Ref {
  handleSaveAndNext: () => Promise<void>
}

const Step2 = forwardRef<Step2Ref, Step2Props>(
  (
    { onSaveAndNext, capitalPartnerId, isEditMode, isViewMode = false },
    ref
  ) => {
    const theme = useTheme()
    const textPrimary = theme.palette.mode === 'dark' ? '#FFFFFF' : '#1E2939'
    const textSecondary = theme.palette.mode === 'dark' ? '#CBD5E1' : '#6B7280'
    const primaryHoverBackground =
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.primary.main as string, 0.2)
        : alpha(theme.palette.primary.main, 0.1)
    const {
      control,
      watch,
      setValue,
      formState: { errors },
      setError,
      clearErrors,
      trigger,
    } = useFormContext()

    const { getLabel } = useCapitalPartnerLabelsApi()
    const currentLanguage = useAppStore((state) => state.language)

    const [selectedProject, setSelectedProject] = useState<any>(null)
    const [isFormInitialized, setIsFormInitialized] = useState<boolean>(false)

    useEffect(() => {
      setIsFormInitialized(false)
      setSelectedProject(null)
    }, [isEditMode, capitalPartnerId])

    // Auto-calculate Total Capital Partner Payment
    useEffect(() => {
      const paidInEscrow = watch('paidInEscrow')
      const paidOutEscrow = watch('paidOutEscrow')

      const inEscrowValue = parseFloat(paidInEscrow) || 0
      const outEscrowValue = parseFloat(paidOutEscrow) || 0
      const total = inEscrowValue + outEscrowValue

      // Only set value if it's different to avoid infinite loops
      const currentTotal = watch('totalPaid')
      const calculatedTotal = total > 0 ? total.toString() : ''

      if (currentTotal !== calculatedTotal) {
        setValue('totalPaid', calculatedTotal, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }
    }, [watch('paidInEscrow'), watch('paidOutEscrow'), setValue, watch])
    const { data: unitStatuses, loading: loadingUnitStatuses } =
      useUnitStatuses()
    const { data: propertyIds, loading: loadingPropertyIds } = usePropertyIds()
    const { data: realEstateAssets, loading: loadingProjects } =
      useRealEstateAssets()

    const projectOptions =
      transformRealEstateAssetsForDropdown(realEstateAssets)

    const {
      data: existingUnitData,
      isLoading: isLoadingExistingUnit,
      error: errorLoadingUnit,
    } = useGetEnhanced<CapitalPartnerUnitResponse[]>(
      `${API_ENDPOINTS.OWNER_REGISTRY_UNIT.GET_ALL}?capitalPartnerId.equals=${capitalPartnerId || 0}`,
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

    // Normalize unit API response: may be array or { content/data/result/_embedded } or paginated
    const unitArray = React.useMemo((): CapitalPartnerUnitResponse[] => {
      if (!existingUnitData) return []
      if (Array.isArray(existingUnitData)) return existingUnitData
      const raw = existingUnitData as Record<string, unknown>
      const content = raw?.content as CapitalPartnerUnitResponse[] | undefined
      const data = raw?.data as CapitalPartnerUnitResponse[] | undefined
      const result = raw?.result as CapitalPartnerUnitResponse[] | undefined
      const embedded = raw?._embedded as Record<string, unknown> | undefined
      const embeddedArr = embedded
        ? (Object.values(embedded).flat() as CapitalPartnerUnitResponse[])
        : undefined
      return content ?? data ?? result ?? embeddedArr ?? []
    }, [existingUnitData])

    const unitId = unitArray.length > 0 ? unitArray[0]?.id ?? null : null
    const isUnitDataReady =
      !isLoadingExistingUnit && !errorLoadingUnit && unitArray.length > 0

    const {
      data: existingUnitPurchaseData,
      isLoading: isLoadingExistingPurchase,
    } = useGetEnhanced<CapitalPartnerUnitPurchaseResponse[]>(
      `${API_ENDPOINTS.OWNER_REGISTRY_UNIT_PURCHASE.GET_ALL}?capitalPartnerUnitId.equals=${unitId || 0}`,
      {},
      {
        enabled: Boolean(isEditMode && isUnitDataReady && unitId),
        // Disable caching to always fetch fresh data
        gcTime: 0,
        staleTime: 0,
        // Always refetch when component mounts
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
      }
    )

    const {
      data: existingUnitBookingData,
      isLoading: isLoadingExistingBooking,
    } = useGetEnhanced<any[]>(
      `${API_ENDPOINTS.OWNER_REGISTRY_UNIT_BOOKING.GET_ALL}?capitalPartnerUnitId.equals=${unitId || 0}`,
      {},
      {
        enabled: Boolean(isEditMode && isUnitDataReady && unitId),
        // Disable caching to always fetch fresh data
        gcTime: 0,
        staleTime: 0,
        // Always refetch when component mounts
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
      }
    )

    // Normalize purchase API response: may be array or { content/data/result/_embedded }
    const purchaseArray = React.useMemo((): CapitalPartnerUnitPurchaseResponse[] => {
      if (!existingUnitPurchaseData) return []
      if (Array.isArray(existingUnitPurchaseData)) return existingUnitPurchaseData
      const raw = existingUnitPurchaseData as Record<string, unknown>
      const content = raw?.content as CapitalPartnerUnitPurchaseResponse[] | undefined
      const data = raw?.data as CapitalPartnerUnitPurchaseResponse[] | undefined
      const result = raw?.result as CapitalPartnerUnitPurchaseResponse[] | undefined
      const embedded = raw?._embedded as Record<string, unknown> | undefined
      const embeddedArr = embedded
        ? (Object.values(embedded).flat() as CapitalPartnerUnitPurchaseResponse[])
        : undefined
      return content ?? data ?? result ?? embeddedArr ?? []
    }, [existingUnitPurchaseData])

    // Prefill: run when we have unit data; re-run when purchase data arrives.
    // Only mark initialized after purchase data is applied (or confirmed missing), so purchase fields get filled when the API returns later.
    useEffect(() => {
      if (
        !isEditMode ||
        unitArray.length === 0 ||
        isLoadingExistingUnit
      ) {
        return
      }
      const purchaseData = purchaseArray.length > 0 ? purchaseArray[0] : null
      const purchaseHandled = purchaseData != null || !isLoadingExistingPurchase
      if (isFormInitialized && purchaseHandled) {
        return
      }

      const unitData = unitArray[0]
      if (!unitData) return

      if (projectOptions.length > 0) {
        const projectOption = projectOptions.find(
          (project) => project.projectId === unitData.managementFirmDTO?.mfId
        )
        if (projectOption) {
          setSelectedProject(projectOption)
          const mfId = projectOption.projectId || projectOption.settingValue
          const assetRegister = projectOption.fullAsset?.assetRegisterDTO
          const assetRegisterId = assetRegister?.id != null ? String(assetRegister.id) : ''
          const assetRegisterName = projectOption.developerName ?? assetRegister?.arName ?? ''
          setValue('projectNameDropdown', projectOption.settingValue)
          setValue('projectId', mfId)
          setValue('developerIdInput', projectOption.developerId)
          setValue('developerNameInput', projectOption.developerName)
          setValue('managementFirmId', mfId)
          setValue('assetRegisterIdInput', assetRegisterId)
          setValue('assetRegisterNameInput', assetRegisterName)
        }
      }

      setValue('floor', unitData.floor || '')
      setValue('bedroomCount', unitData.noofBedroom || '')
      setValue('unitNoQaqood', unitData.unitRefId || '')
      let unitStatusVal =
        (unitData.unitStatusDTO as { settingValue?: string; configValue?: string })?.settingValue ??
        (unitData.unitStatusDTO as { settingValue?: string; configValue?: string })?.configValue ??
        ''
      if (!unitStatusVal && unitData.unitStatusDTO?.id != null && unitStatuses?.length) {
        const byId = unitStatuses.find((s: { id: number }) => s.id === Number(unitData.unitStatusDTO?.id))
        if (byId?.settingValue) unitStatusVal = byId.settingValue
      }
      setValue('unitStatus', unitStatusVal)
      setValue('buildingName', unitData.towerName || '')
      setValue('plotSize', unitData.unitPlotSize || '')
      if (propertyIds && propertyIds.length > 0) {
        const propertyIdOption = propertyIds.find(
          (property: { id: number }) => property.id === unitData.propertyIdDTO?.id
        )
        const prop = propertyIdOption as { settingValue?: string; displayName?: string } | undefined
        setValue('propertyId', prop?.settingValue ?? prop?.displayName ?? '')
      }
      setValue('unitIban', unitData.virtualAccNo || '')

      if (purchaseData) {
        setValue(
          'registrationFees',
          purchaseData.ownupUnitRegistrationFee?.toString() || ''
        )
        setValue('agentName', purchaseData.ownupAgentName || '')
        setValue('agentNationalId', purchaseData.ownupAgentId || '')
        setValue(
          'grossSalePrice',
          purchaseData.ownupGrossSaleprice?.toString() || ''
        )
        setValue('VatApplicable', purchaseData.ownupVatApplicable ?? false)
        setValue(
          'SalesPurchaseAgreement',
          purchaseData.ownupSalePurchaseAgreement ?? false
        )
        setValue(
          'ProjectPaymentPlan',
          purchaseData.ownupProjectPaymentPlan ?? false
        )
        setValue('salePrice', purchaseData.ownupSalePrice?.toString() || '')
        setValue('deedNo', purchaseData.ownupDeedNo || '')
        setValue('contractNo', purchaseData.ownupAgreementNo || '')
        setValue(
          'agreementDate',
          purchaseData.ownupAgreementDate
            ? dayjs(purchaseData.ownupAgreementDate)
            : null
        )
        setValue(
          'ModificationFeeNeeded',
          purchaseData.ownupModificationFeeNeeded ?? false
        )
        setValue(
          'ReservationBookingForm',
          purchaseData.ownupReservationBookingForm ?? false
        )
        setValue('OqoodPaid', purchaseData.ownupOqoodPaid ?? false)
        setValue('worldCheck', purchaseData.ownupWorldCheck ?? false)
        setValue(
          'paidInEscrow',
          purchaseData.ownupAmtPaidToDevInEscorw?.toString() || ''
        )
        setValue(
          'paidOutEscrow',
          purchaseData.ownupAmtPaidToDevOutEscorw?.toString() || ''
        )
        setValue(
          'totalPaid',
          purchaseData.ownupTotalAmountPaid?.toString() || ''
        )
        setValue('qaqoodAmount', String(purchaseData.ownupOqoodAmountPaid ?? ''))
        setValue('unitAreaSize', String(purchaseData.ownupUnitAreaSize ?? ''))
        setValue('forfeitAmount', String(purchaseData.ownupForfeitAmount ?? ''))
        setValue('dldAmount', String(purchaseData.ownupDldAmount ?? ''))
        setValue('refundAmount', String(purchaseData.ownupRefundAmount ?? ''))
        setValue(
          'transferredAmount',
          String(purchaseData.ownupTransferredAmount ?? '')
        )
        setValue('unitRemarks', purchaseData.ownupRemarks || '')
      }

      // Only mark initialized after purchase is handled (data set or load finished with none), so we re-run when purchase data arrives
      if (purchaseData != null || !isLoadingExistingPurchase) {
        setIsFormInitialized(true)
      }
    }, [
      isEditMode,
      unitArray,
      purchaseArray,
      isLoadingExistingUnit,
      isLoadingExistingPurchase,
      isFormInitialized,
      setValue,
      projectOptions,
      propertyIds,
      unitStatuses,
    ])
    const handleProjectSelection = (projectId: string) => {
      const selectedProjectData = projectOptions.find(
        (project) => project.settingValue === projectId
      )

      if (selectedProjectData) {
        setSelectedProject(selectedProjectData)
        const mfId = selectedProjectData.projectId || selectedProjectData.settingValue
        const ar = selectedProjectData.fullAsset?.assetRegisterDTO
        const assetRegisterId =
          selectedProjectData.assetRegisterId ||
          (ar?.id != null ? String(ar.id) : '')
        const assetRegisterName =
          selectedProjectData.assetRegisterName ||
          selectedProjectData.developerName ||
          ''

        setValue('projectId', mfId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue('developerIdInput', assetRegisterId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue('developerNameInput', assetRegisterName, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue('managementFirmId', mfId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue('assetRegisterIdInput', assetRegisterId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue('assetRegisterNameInput', assetRegisterName, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        })
        clearErrors([
          'projectId',
          'developerIdInput',
          'developerNameInput',
          'managementFirmId',
          'assetRegisterIdInput',
          'assetRegisterNameInput',
        ] as unknown as any)
      }
    }
    const handleSaveAndNext = async () => {
      try {
        // Validate required fields first so UI shows errors immediately
        // Management Firm / Asset Register fields (909–944) are hidden for now; bypass validation so step can submit
        const requiredValid = await (async () => {
          try {
            const result = CapitalPartnerStep2Schema.safeParse({
              projectNameDropdown: watch('projectNameDropdown') || '_',
              projectId: watch('projectId') || '_',
              developerIdInput: watch('developerIdInput') || '_',
              developerNameInput: watch('developerNameInput') || '_',
              unitNoQaqood: watch('unitNoQaqood'),
              unitStatus: watch('unitStatus'),
              plotSize: watch('plotSize'),
              propertyId: watch('propertyId'),
            })
            if (!result.success) {
              clearErrors()
              result.error.issues.forEach((issue) => {
                const field = (issue.path?.[0] as string) || ''
                if (field) {
                  setError(field as any, {
                    type: 'manual',
                    message: issue.message,
                  })
                }
              })
              await trigger() // show all errors in UI
              return false
            }
            return true
          } catch {
            return false
          }
        })()
        if (!requiredValid) {
          throw new Error('Please fill all required fields')
        }
        if (!capitalPartnerId) {
          throw new Error('Capital Partner ID is required from Step1')
        }
        const formData: Step2FormData = {
          projectNameDropdown: watch('projectNameDropdown') || '_',
          projectId: watch('projectId') || '_',
          developerIdInput: watch('developerIdInput') || '_',
          developerNameInput: watch('developerNameInput') || '_',
          floor: watch('floor'),
          bedroomCount: watch('bedroomCount'),
          unitNoQaqood: watch('unitNoQaqood'),
          unitStatus: watch('unitStatus'),
          buildingName: watch('buildingName'),
          plotSize: watch('plotSize'),
          propertyId: watch('propertyId'),
          unitIban: watch('unitIban'),
          registrationFees: watch('registrationFees'),
          agentName: watch('agentName'),
          agentNationalId: watch('agentNationalId'),
          grossSalePrice: watch('grossSalePrice'),
          VatApplicable: watch('VatApplicable'),
          SalesPurchaseAgreement: watch('SalesPurchaseAgreement'),
          ProjectPaymentPlan: watch('ProjectPaymentPlan'),
          salePrice: watch('salePrice'),
          deedNo: watch('deedNo'),
          contractNo: watch('contractNo'),
          agreementDate: watch('agreementDate'),
          ModificationFeeNeeded: watch('ModificationFeeNeeded'),
          ReservationBookingForm: watch('ReservationBookingForm'),
          OqoodPaid: watch('OqoodPaid'),
          worldCheck: watch('worldCheck'),
          paidInEscrow: watch('paidInEscrow'),
          paidOutEscrow: watch('paidOutEscrow'),
          totalPaid: watch('totalPaid'),
          qaqoodAmount: watch('qaqoodAmount'),
          unitAreaSize: watch('unitAreaSize'),
          forfeitAmount: watch('forfeitAmount'),
          dldAmount: watch('dldAmount'),
          refundAmount: watch('refundAmount'),
          transferredAmount: watch('transferredAmount'),
          unitRemarks: watch('unitRemarks'),
        }

        const zodResult = CapitalPartnerStep2Schema.safeParse(formData)

        if (!zodResult.success) {
          clearErrors()
          zodResult.error.issues.forEach((issue) => {
            const field = (issue.path?.[0] as string) || ''
            if (field) {
              setError(field as any, { type: 'manual', message: issue.message })
            }
          })
          await trigger() // show all errors (including superRefine: buildingName, totalPaid)
          throw new Error('Please fix validation errors')
        } else {
          clearErrors()
        }
        const { unitPayload, bookingPayload, purchasePayload } =
          mapStep2ToCapitalPartnerUnitPayload(
            formData,
            capitalPartnerId,
            unitStatuses,
            selectedProject,
            propertyIds
          )
        let unitResponse
        let existingUnitId = null

        if (isEditMode && unitArray.length > 0) {
          existingUnitId = unitArray[0]?.id
          if (existingUnitId) {
            const updateUnitPayload = {
              ...unitPayload,
              id: existingUnitId,
            }
            unitResponse =
              await capitalPartnerUnitService.updateCapitalPartnerUnit(
                existingUnitId,
                updateUnitPayload
              )
          } else {
            unitResponse =
              await capitalPartnerUnitService.createCapitalPartnerUnit(
                unitPayload
              )
          }
        } else {
          unitResponse =
            await capitalPartnerUnitService.createCapitalPartnerUnit(
              unitPayload
            )
        }

        const unitIdFromResponse =
          unitResponse?.id ??
          (unitResponse as { data?: { id?: number } })?.data?.id
        const finalUnitId = existingUnitId ?? unitIdFromResponse
        if (finalUnitId == null) {
          throw new Error('Failed to get unit ID from save response')
        }

        let bookingResponse = null
        let purchaseResponse = null
        if (Object.keys(bookingPayload).length > 0) {
          const bookingPayloadWithId = {
            ...bookingPayload,
            ownerRegistryUnitDTOS: [
              {
                id: finalUnitId,
              },
            ],
          }

          try {
            bookingResponse =
              await capitalPartnerUnitBookingService.createCapitalPartnerUnitBooking(
                bookingPayloadWithId
              )
          } catch (error) {}
        }
        if (Object.keys(purchasePayload).length > 0) {
          const purchasePayloadWithId = {
            ...purchasePayload,
            ownerRegistryUnitDTO: {
              id: finalUnitId,
              ownerRegistryDTOS: [
                {
                  id: capitalPartnerId,
                },
              ],
            },
          }

          try {
            if (
              isEditMode &&
              purchaseArray.length > 0
            ) {
              const existingPurchaseId = purchaseArray[0]?.id
              if (existingPurchaseId) {
                const updatePurchasePayload = {
                  ...purchasePayloadWithId,
                  id: existingPurchaseId,
                }
                purchaseResponse =
                  await capitalPartnerUnitPurchaseService.updateCapitalPartnerUnitPurchase(
                    existingPurchaseId,
                    updatePurchasePayload
                  )
              } else {
                purchaseResponse =
                  await capitalPartnerUnitPurchaseService.createCapitalPartnerUnitPurchase(
                    purchasePayloadWithId
                  )
              }
            } else {
              purchaseResponse =
                await capitalPartnerUnitPurchaseService.createCapitalPartnerUnitPurchase(
                  purchasePayloadWithId
                )
            }
          } catch (error) {}
        }
        if (onSaveAndNext) {
          onSaveAndNext({ unitResponse, bookingResponse, purchaseResponse })
        }
      } catch (error) {
        throw error
      }
    }
    useImperativeHandle(
      ref,
      () => ({
        handleSaveAndNext,
      }),
      [handleSaveAndNext]
    )
    const fieldStyles = React.useMemo(
      () => (sharedCommonFieldStyles as any)(theme),
      [theme]
    )
    const selectFieldStyles = React.useMemo(
      () => (sharedSelectStyles as any)(theme),
      [theme]
    )
    const dateFieldStyles = React.useMemo(
      () => (sharedDatePickerStyles as any)(theme),
      [theme]
    )
    const labelStyles = React.useMemo(
      () => (sharedLabelSx as any)(theme),
      [theme]
    )
    const valueStyles = React.useMemo(
      () => (sharedValueSx as any)(theme),
      [theme]
    )
    const errorFieldStyles = React.useMemo(
      () => (sharedErrorFieldStyles as any)(theme),
      [theme]
    )
    const cardBaseStyles = React.useMemo(
      () => (sharedCardStyles as any)(theme),
      [theme]
    )
    const viewModeStyles = viewModeInputStyles(theme)
    const neutralBorderColor = neutralBorder(theme)
    const neutralBorderHoverColor = neutralBorderHover(theme)

    const StyledCalendarIcon = React.useCallback(
      (props: React.ComponentProps<typeof CalendarTodayOutlinedIcon>) =>
        (
          <CalendarTodayOutlinedIcon
            {...props}
            sx={(sharedCalendarIconSx as any)(theme as Theme)}
          />
        ) as any,
      [theme]
    )

    const renderTextField = (
      name: string,
      configId: string,
      fallbackLabel: string,
      defaultValue = '',
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
            defaultValue={defaultValue}
            render={({ field }) => (
              <>
                <TextField
                  {...field}
                  label={label}
                  fullWidth
                  disabled={disabled || isViewMode}
                  error={!!errors[name]}
                  InputLabelProps={{ sx: labelStyles }}
                  InputProps={{ sx: valueStyles }}
                  sx={{
                    ...fieldStyles,
                    ...(disabled && {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: viewModeStyles.backgroundColor,
                        '& fieldset': {
                          borderColor: viewModeStyles.borderColor,
                        },
                        '&:hover fieldset': {
                          borderColor: viewModeStyles.borderColor,
                        },
                      },
                    }),
                  }}
                  required={required}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e)
                    if (errors[name]) {
                      clearErrors(name as any)
                    }
                    // re-validate this field to update resolver-based errors
                    trigger(name as any)
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

    const renderApiSelectField = (
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
              <FormControl fullWidth error={!!errors[name]} required={required}>
                <InputLabel sx={labelStyles} required={required}>
                  {loading ? `Loading...` : label}
                </InputLabel>
                <Select
                  {...field}
                  label={loading ? `Loading...` : label}
                  required={required}
                  sx={{
                    ...selectFieldStyles,
                    ...valueStyles,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: `1px solid ${neutralBorderColor}`,
                      borderRadius: '6px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: `1px solid ${neutralBorderHoverColor}`,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: `2px solid ${theme.palette.primary.main}`,
                    },
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                  disabled={loading || isViewMode}
                  value={field.value || ''}
                  onChange={field.onChange}
                >
                  {options.map((option) => (
                    <MenuItem key={option.id} value={option.settingValue}>
                      {option.displayName}
                    </MenuItem>
                  ))}
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

    const renderProjectSelectField = (
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
              <FormControl fullWidth error={!!errors[name]} required={required} variant="outlined">
                <InputLabel id={`${name}-label`} sx={labelStyles} required={required} shrink>
                  {loading ? `Loading...` : label}
                </InputLabel>
                <Select
                  {...field}
                  labelId={`${name}-label`}
                  label={loading ? `Loading...` : label}
                  required={required}
                  displayEmpty
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 'aria-label': label }}
                  sx={[
                    selectFieldStyles,
                    valueStyles,
                    {
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: `1px solid ${neutralBorderColor}`,
                        borderRadius: '6px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: `1px solid ${neutralBorderHoverColor}`,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: `2px solid ${theme.palette.primary.main}`,
                      },
                      '& .MuiSelect-select': {
                        paddingTop: '14px',
                        paddingBottom: '14px',
                        boxSizing: 'border-box',
                      },
                    },
                    isViewMode && {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: viewModeStyles.backgroundColor,
                        '& fieldset': {
                          borderColor: viewModeStyles.borderColor,
                        },
                        '&:hover fieldset': {
                          borderColor: viewModeStyles.borderColor,
                        },
                      },
                      '& .MuiSelect-select': {
                        color: viewModeStyles.textColor,
                      },
                    },
                    !!errors[name] && !isViewMode
                      ? {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: `1px solid ${theme.palette.error.main}`,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: `1px solid ${theme.palette.error.main}`,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: `1px solid ${theme.palette.error.main}`,
                          },
                        }
                      : null,
                  ]}
                  IconComponent={KeyboardArrowDownIcon}
                  disabled={loading || isViewMode}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value as string
                    field.onChange(value)
                    handleProjectSelection(value)
                    if (errors[name]) clearErrors(name as 'projectNameDropdown')
                    trigger(name as 'projectNameDropdown')
                  }}
                  onBlur={() => {
                    field.onBlur()
                    trigger(name as 'projectNameDropdown')
                  }}
                  renderValue={(selected) => {
                    if (selected == null || selected === '') {
                      return (
                        <span style={{ color: theme.palette.text.secondary }}>
                          Select...
                        </span>
                      )
                    }
                    const selectedOption = options.find((opt) => opt.settingValue === selected)
                    return selectedOption ? (
                      <span>{selectedOption.displayName}</span>
                    ) : (
                      <span style={{ color: theme.palette.text.secondary }}>{String(selected)}</span>
                    )
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 },
                    },
                  }}
                >
                  {options.map((option) => (
                    <MenuItem key={option.id} value={option.settingValue}>
                      {option.displayName}
                    </MenuItem>
                  ))}
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

    const getFallbackOptions = (key: string) => {
      switch (key) {
        case 'unitStatus':
          return [
            { id: 1, displayName: 'Active', settingValue: 'ACTIVE' },
            { id: 2, displayName: 'Inactive', settingValue: 'INACTIVE' },
          ]
        case 'propertyId':
          return [
            { id: 1, displayName: 'Property 1', settingValue: '1' },
            { id: 2, displayName: 'Property 2', settingValue: '2' },
            { id: 3, displayName: 'Property 3', settingValue: '3' },
          ]
        default:
          return []
      }
    }
    const renderCheckboxField = (
      name: string,
      configId: string,
      fallbackLabel: string,
      gridSize: number = 6
    ) => {
      const label = getLabel(configId, currentLanguage, fallbackLabel)
      return (
        <Grid key={name} size={{ xs: 12, md: gridSize }}>
          <Controller
            name={name}
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={!!field.value}
                    disabled={isViewMode}
                    onChange={(e) => field.onChange(e.target.checked)}
                    sx={{
                      color: neutralBorderColor,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                }
                label={label}
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontFamily: 'Outfit, sans-serif',
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '24px',
                    letterSpacing: '0.5px',
                    verticalAlign: 'middle',
                    color: textPrimary,
                  },
                }}
              />
            )}
          />
        </Grid>
      )
    }

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/** Inline field errors + a small top banner for save errors. */}
        <Card
          sx={[
            cardBaseStyles,
            {
              width: '84%',
              margin: '0 auto',
            },
          ]}
        >
          <CardContent sx={{ color: valueStyles.color || undefined }}>
            {/* Removed top banner error; rely on inline field errors for consistency with Step 1 */}
            <Grid container rowSpacing={4} columnSpacing={2}>
              {renderProjectSelectField(
                'projectNameDropdown',
                'CDL_OWNER_UNIT_MF_NAME',
                'Management Firm Name',
                projectOptions,
                6,
                true,
                loadingProjects
              )}
              {renderTextField(
                'managementFirmId',
                'CDL_OWNER_UNIT_MF_ID',
                'Management Firm ID*',
                '',
                6,
                !selectedProject || isEditMode,
                true
              )}
              {renderTextField(
                'assetRegisterIdInput',
                'CDL_OWNER_UNIT_AR_ID',
                'Asset Register ID*',
                '',
                6,
                !selectedProject || isEditMode,
                true
              )}
              {renderTextField(
                'assetRegisterNameInput',
                'CDL_OWNER_UNIT_AR_NAME',
                'Asset Register Name',
                '',
                6,
                !selectedProject || isEditMode,
                true
              )} 
              {renderTextField('floor', 'CDL_OWNER_UNIT_FLOOR', 'Floor', '', 3)}
              {renderTextField(
                'bedroomCount',
                'CDL_OWNER_UNIT_NOOF_BED',
                'No. of Bedroom',
                '',
                3
              )}
              {renderTextField(
                'unitNoQaqood',
                'CDL_OWNER_UNIT_NUMBER',
                'Unit no. Qaqood format',
                '',
                3,
                false,
                false
              )}
              {renderApiSelectField(
                'unitStatus',
                'CDL_OWNER_UNIT_STATUS',
                'Unit Status',
                unitStatuses?.length
                  ? unitStatuses
                  : getFallbackOptions('unitStatus'),
                3,
                true,
                loadingUnitStatuses
              )}
              {renderTextField(
                'buildingName',
                'CDL_OWNER_UNIT_BUILDING_NAME',
                'Building Name',
                '',
                6,
                false,
                watch('propertyId') === '3'
              )}
              {renderTextField(
                'plotSize',
                'CDL_OWNER_UNIT_PLOT_SIZE',
                'Plot Size*',
                '',
                6,
                false,
                true
              )}
              {renderApiSelectField(
                'propertyId',
                'CDL_OWNER_UNIT_PROP_NUMBER',
                'Property ID',
                propertyIds?.length
                  ? propertyIds
                  : getFallbackOptions('propertyId'),
                6,
                true,
                loadingPropertyIds
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="unitIban"
                  control={control}
                  defaultValue={''}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      disabled={isViewMode}
                      label={getLabel(
                        'CDL_OWNER_UNIT_IBAN',
                        currentLanguage,
                        'Unit IBAN'
                      )}
                      value={field.value || ''}
                      onChange={field.onChange}
                      InputProps={{
                        endAdornment: !isViewMode ? (
                          <InputAdornment position="end">
                            <Button
                              variant="contained"
                              sx={{
                                minWidth: '100px',
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
                                px: 1,
                              }}
                              onClick={() => {}}
                            >
                              Fetch VA Number
                            </Button>
                          </InputAdornment>
                        ) : undefined,
                        sx: {
                          ...valueStyles,
                          ...(isViewMode && {
                            backgroundColor: viewModeStyles.backgroundColor,
                            color: viewModeStyles.textColor,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: viewModeStyles.borderColor,
                            },
                          }),
                        },
                      }}
                      InputLabelProps={{ sx: labelStyles }}
                      sx={[
                        fieldStyles,
                        isViewMode && {
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: viewModeStyles.backgroundColor,
                            '& fieldset': {
                              borderColor: viewModeStyles.borderColor,
                            },
                            '&:hover fieldset': {
                              borderColor: viewModeStyles.borderColor,
                            },
                          },
                        },
                      ]}
                    />
                  )}
                />
              </Grid>

              {renderTextField(
                'registrationFees',
                'CDL_OWNER_UNIT_REG_FEE',
                'Unit Registration Fees',
                '',
                3,
                false,
                false
              )}
              {renderTextField(
                'agentName',
                'CDL_OWNER_UNIT_AGENT_NAME',
                'Agent Name',
                '',
                3,
                false,
                false
              )}
              {renderTextField(
                'agentNationalId',
                'CDL_OWNER_UNIT_AGENT_ID',
                'Agent National ID',
                '',
                3,
                false,
                false
              )}
              {renderTextField(
                'grossSalePrice',
                'CDL_OWNER_UNIT_GROSS_PRICE',
                'Gross Sale Price',
                '',
                3,
                false,
                false
              )}

              {[
                {
                  name: 'VatApplicable',
                  configId: 'CDL_OWNER_UNIT_VAT_APPLICABLE',
                  fallbackLabel: 'VAT Applicable',
                },
                {
                  name: 'SalesPurchaseAgreement',
                  configId: 'CDL_OWNER_UNIT_SPA',
                  fallbackLabel: 'Sales Purchase Agreement',
                },
                {
                  name: 'ProjectPaymentPlan',
                  configId: 'CDL_OWNER_UNIT_PAYMENT_PLAN',
                  fallbackLabel: 'Project Payment Plan',
                },
              ].map(({ name, configId, fallbackLabel }) => (
                <Grid size={{ xs: 12, md: 4 }} key={name}>
                  <FormControlLabel
                    control={
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            {...field}
                            checked={!!field.value}
                            disabled={isViewMode}
                            onChange={(e) => field.onChange(e.target.checked)}
                            sx={{
                              color:
                                theme.palette.mode === 'dark'
                                  ? alpha('#FFFFFF', 0.4)
                                  : neutralBorderColor,
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              },
                            }}
                          />
                        )}
                      />
                    }
                    label={getLabel(configId, currentLanguage, fallbackLabel)}
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontFamily: 'Outfit, sans-serif',
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '24px',
                        letterSpacing: '0.5px',
                        verticalAlign: 'middle',
                        color: textPrimary,
                      },
                    }}
                  />
                </Grid>
              ))}

              {renderTextField(
                'salePrice',
                'CDL_OWNER_UNIT_NET_PRICE',
                'Sale Price',
                '',
                3
              )}
              {renderTextField(
                'deedNo',
                'CDL_OWNER_UNIT_DEED_REF_NO',
                'Deed No',
                '',
                3
              )}
              {renderTextField(
                'contractNo',
                'CDL_OWNER_UNIT_CONTRACT_NO',
                'Contract No',
                '',
                3
              )}
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="agreementDate"
                  control={control}
                  defaultValue={null}
                  render={({ field }) => (
                    <DatePicker
                      label={getLabel(
                          'CDL_OWNER_UNIT_AGREEMENT_DATE',
                        currentLanguage,
                        'Agreement Date'
                      )}
                      disabled={isViewMode}
                      value={field.value || null}
                      onChange={(newValue) => field.onChange(newValue)}
                      format="DD/MM/YYYY"
                      slots={{
                        openPickerIcon: StyledCalendarIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.agreementDate,
                          sx: (sharedDatePickerStyles as any)(theme as Theme),
                          InputLabelProps: {
                            sx: (sharedLabelSx as any)(theme as Theme),
                          },
                          InputProps: {
                            sx: (sharedValueSx as any)(theme as Theme),
                            style: { height: '46px' },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              {[
                {
                  name: 'ModificationFeeNeeded',
                  configId: 'CDL_OWNER_UNIT_FEE_REQ',
                  fallbackLabel: 'Modification Fee Needed',
                },
                {
                  name: 'ReservationBookingForm',
                  configId: 'CDL_OWNER_UNIT_BOOKING',
                  fallbackLabel: 'Reservation & Booking Form',
                },
                {
                  name: 'OqoodPaid',
                  configId: 'CDL_OWNER_UNIT_OQOOD_PAID',
                  fallbackLabel: 'Oqood Paid',
                },
              ].map(({ name, configId, fallbackLabel }) => (
                <Grid size={{ xs: 12, md: 4 }} key={name}>
                  <FormControlLabel
                    control={
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            {...field}
                            checked={!!field.value}
                            disabled={isViewMode}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        )}
                      />
                    }
                    label={getLabel(configId, currentLanguage, fallbackLabel)}
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
                </Grid>
              ))}
              {renderCheckboxField(
                'worldCheck',
                'CDL_OWNER_UNIT_WORLD_STATUS',
                'World Check',
                6
              )}
              {renderTextField(
                'paidInEscrow',
                'CDL_OWNER_UNIT_WITH_ESCROW',
                'Amount Paid to Build Partner (Within Escrow)',
                '',
                6
              )}
              {renderTextField(
                'paidOutEscrow',
                'CDL_OWNER_UNIT_OUTSIDE_ESCROW',
                'Amount Paid to Build Partner (Outside Escrow)',
                '',
                6
              )}
              {renderTextField(
                'totalPaid',
                  'CDL_OWNER_UNIT_PARTNER_PAYMENT',
                'Total Capital Partner Payment',
                '',
                6,
                true,
                false
              )}
              {renderTextField(
                'qaqoodAmount',
                'CDL_OWNER_UNIT_OQOOD_PAID',
                'Qaqood Amount Paid',
                '',
                3
              )}
              {renderTextField(
                'unitAreaSize',
                'CDL_OWNER_UNIT_AREA',
                'Unit Area Size',
                '',
                3
              )}
              {renderTextField(
                'forfeitAmount',
                'CDL_OWNER_UNIT_FROFEIT_AMT',
                'Forfeit Amount',
                '',
                3
              )}
              {renderTextField(
                'dldAmount',
                'CDL_OWNER_UNIT_DLD_FEE',
                'Dld Amount',
                '',
                3
              )}
              {renderTextField(
                'refundAmount',
                'CDL_OWNER_UNIT_REFUND_AMOUNT',
                'Refund Amount',
                '',
                6
              )}
              {renderTextField(
                'transferredAmount',
                'CDL_OWNER_UNIT_TRANS_AMT',
                'Transferred Amount',
                '',
                6
              )}
              {renderTextField(
                'unitRemarks',
                'CDL_OWNER_UNIT_REMARKS',
                'Remarks',
                '',
                12
              )}
            </Grid>
          </CardContent>
        </Card>
      </LocalizationProvider>
    )
  }
)

Step2.displayName = 'Step2'

export default Step2
