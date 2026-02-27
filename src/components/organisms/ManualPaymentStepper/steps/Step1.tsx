import React, { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { useManualPaymentData } from '../ManualPaymentDataProvider'
import { idService } from '../../../../services/api/developerIdService'
import { useManualPaymentLabelsWithCache } from '../../../../hooks/useManualPaymentLabelsWithCache'
import { MANUAL_PAYMENT_LABELS } from '../../../../constants/mappings/manualPaymentLabels'
import { useRealEstateAssets } from '@/hooks/useRealEstateAssets'
// State for developer names

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Autocomplete,
  Paper,
} from '@mui/material'
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { Controller, useFormContext } from 'react-hook-form'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { fundEgressService } from '../../../../services/api/fundEgressService'
import { BudgetService, budgetManagementService } from '@/services/api/budgetApi/budgetManagementService'
import { BudgetCategoryService } from '@/services/api/budgetApi/budgetCategoryService'
// import { toast } from 'react-hot-toast' // Not used in this component
import { FormError } from '../../../atoms/FormError'
import { getFieldMaxLength } from '@/lib/validation'

const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}

interface Step1Props {
  savedId?: string | null
  isEditMode?: boolean
  onDataLoaded?: () => void
  isReadOnly?: boolean
  refreshKey?: number
}

const Step1 = ({
  savedId,
  isEditMode,
  onDataLoaded,
  isReadOnly = false,
  refreshKey,
}: Step1Props) => {
  // Form context
  const { control, setValue, watch, trigger } = useFormContext()

  // Get dynamic labels
  const { getLabel } = useManualPaymentLabelsWithCache('EN')
  const isDarkMode = useIsDarkMode()

  // Get shared data from provider
  const sharedData = useManualPaymentData()

  // State for payment reference ID generation
  const [paymentRefId, setPaymentRefId] = useState<string>('')
  const [isGeneratingId, setIsGeneratingId] = useState<boolean>(false)

  // Extract data from shared provider
  const {
    paymentTypes,
    paymentSubTypes,
    currencies,
    depositModes,
    paymentModes,
    transferTypes,
    buildAssetAccountStatuses,
    boolYnOptions,
    buildPartners,
    accountBalances,
  } = sharedData

  // Destructure account balance functions
  const {
    balances,
    loadingStates,
    errors: accountErrors,
    fetchBalance,
  } = accountBalances

  // State to store additional developer/project data from prepopulated data
  const [additionalDeveloperNames, setAdditionalDeveloperNames] = useState<
    string[]
  >([])
  const [additionalProjectAssets, setAdditionalProjectAssets] = useState<
    { id: number; mfName: string; mfId: string }[]
  >([])

  // Budget Details state
  const [budgetOptions, setBudgetOptions] = useState<
    { id: number; displayName: string; dto?: unknown }[]
  >([])
  const [budgetCategoryOptions, setBudgetCategoryOptions] = useState<
    { id: number; displayName: string; dto?: unknown }[]
  >([])
  const [budgetDetailsOptions, setBudgetDetailsOptions] = useState<
    { id: number; displayName: string; dto?: unknown }[]
  >([])
  const [budgetItemsData, setBudgetItemsData] = useState<any[]>([])
  const [loadingBudgets, setLoadingBudgets] = useState(false)
  const [loadingBudgetCategories, setLoadingBudgetCategories] = useState(false)
  const [loadingBudgetDetails, setLoadingBudgetDetails] = useState(false)

  // Build partners - fetch all at once (no pagination needed)
  // Remove pagination logic since we're fetching 1000 items in one call
  // Preserve exact order from API response - no sorting, no filtering
  const [allBuildPartners, setAllBuildPartners] = useState<any[]>(
    buildPartners.data || []
  )

  // Initialize with shared data - preserve API response order
  useEffect(() => {
    if (buildPartners.data && buildPartners.data.length > 0) {
      // Set directly from API response to preserve exact order
      setAllBuildPartners(buildPartners.data)
    }
  }, [buildPartners.data])

  // Watch selected developer name to get build partner ID
  const selectedDeveloperName = watch('developerName')
  const selectedBuildPartner = useMemo(() => {
    if (!selectedDeveloperName) return null
    return allBuildPartners.find(
      (bp: any) => bp.arName === selectedDeveloperName
    )
  }, [selectedDeveloperName, allBuildPartners])

  // Get the build partner ID for API calls (numeric ID, not arDeveloperId)
  // This ID (e.g., 3325) will be used in the API call: buildPartnerId.equals=3325
  const selectedBuildPartnerId = useMemo(() => {
    if (!selectedBuildPartner) return undefined

    // Verify the build partner has a valid numeric ID
    const id = selectedBuildPartner.id
    if (!id || typeof id !== 'number') {
      return undefined
    }

    // Verify the ID exists in the build partners list
    // If not found, the selected build partner might be stale/invalid
    const existsInList = allBuildPartners.some((bp: any) => bp.id === id)
    if (!existsInList && allBuildPartners.length > 0) {
      // Clear invalid selection if the build partner doesn't exist in the list
      return undefined
    }

    return id
  }, [selectedBuildPartner, allBuildPartners])

  // Get arDeveloperId for display in the text field (e.g., "DEV-20251013-105916-YXUM1")
  const selectedBuildPartnerDeveloperId = useMemo(() => {
    return selectedBuildPartner?.arDeveloperId || ''
  }, [selectedBuildPartner])

  // Clear developer name selection if the build partner ID doesn't exist in the list
  useEffect(() => {
    if (
      selectedDeveloperName &&
      selectedBuildPartnerId === undefined &&
      allBuildPartners.length > 0
    ) {
      // The selected build partner name doesn't match any valid build partner
      // Clear the selection to prevent API calls with invalid IDs
      const existsByName = allBuildPartners.some(
        (bp: any) => bp.arName === selectedDeveloperName
      )
      if (!existsByName) {
        setValue('developerName', '', {
          shouldDirty: false,
          shouldTouch: false,
        })
        setValue('developerId', '', { shouldDirty: false, shouldTouch: false })
      }
    }
  }, [
    selectedDeveloperName,
    selectedBuildPartnerId,
    allBuildPartners,
    setValue,
  ])

  // Fetch filtered assets based on selected build partner
  // API will only include buildPartnerId.equals filter when a build partner is selected
  const filteredRealEstateAssets = useRealEstateAssets(
    0,
    100,
    selectedBuildPartnerId
  )

  // Clear additional assets when build partner is deselected
  // NOTE: No need to call refetch() here - useRealEstateAssets hook automatically
  // refetches when buildPartnerId changes, so calling refetch() causes duplicate API calls
  useEffect(() => {
    if (!selectedBuildPartnerId) {
      // Clear additional assets when build partner is deselected
      setAdditionalProjectAssets([])
    }
  }, [selectedBuildPartnerId])

  // Clear additional project assets when API response is empty (content: [])
  useEffect(() => {
    if (
      selectedBuildPartnerId &&
      !filteredRealEstateAssets.loading &&
      Array.isArray(filteredRealEstateAssets.assets) &&
      filteredRealEstateAssets.assets.length === 0 &&
      !isEditMode
    ) {
      // Clear additional assets when API returns empty array (unless in edit mode)
      setAdditionalProjectAssets([])
    }
  }, [
    filteredRealEstateAssets.assets,
    filteredRealEstateAssets.loading,
    selectedBuildPartnerId,
    isEditMode,
  ])

  // Fetch budgets on mount
  useEffect(() => {
    let cancelled = false
    setLoadingBudgets(true)
    BudgetService.getBudgets(0, 100)
      .then((res) => {
        if (cancelled || !res?.content) return
        setBudgetOptions(
          res.content.map((x: { id: number; budgetName: string }) => ({
            id: x.id,
            displayName: x.budgetName ?? String(x.id),
            settingValue: String(x.id),
            dto: x,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setBudgetOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingBudgets(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch budget categories on mount
  useEffect(() => {
    let cancelled = false
    setLoadingBudgetCategories(true)
    BudgetCategoryService.getBudgetCategories(0, 1000)
      .then((res) => {
        if (cancelled || !res?.content) return
        setBudgetCategoryOptions(
          res.content.map((x: { id: number; serviceName?: string; categoryName?: string }) => ({
            id: x.id,
            displayName: (x.serviceName || x.categoryName) ?? String(x.id),
            settingValue: String(x.id),
            dto: x,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setBudgetCategoryOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingBudgetCategories(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedBudgetId = watch('budgetDetails')

  // Fetch budget items when budget (budgetDetails) is selected
  useEffect(() => {
    if (!selectedBudgetId) {
      setBudgetDetailsOptions([])
      setBudgetItemsData([])
      return
    }
    const budgetId =
      typeof selectedBudgetId === 'string'
        ? parseInt(selectedBudgetId, 10)
        : Number(selectedBudgetId)
    if (isNaN(budgetId) || budgetId <= 0) {
      setBudgetDetailsOptions([])
      setBudgetItemsData([])
      return
    }
    let cancelled = false
    setLoadingBudgetDetails(true)
    // Primary: getBudgetItemsByBudgetCategoryId (uses budgetId.equals); fallback: getAllBudgetItems with filter
    const fetchItems = (): Promise<{ content: unknown[] }> =>
      budgetManagementService
        .getBudgetItemsByBudgetCategoryId(0, 0, 1000, budgetId)
        .then((res) => {
          if (cancelled) return { content: [] }
          const raw = res as { content?: unknown[] }
          const content = Array.isArray(raw?.content) ? raw.content : []
          return { content }
        })
        .catch(() => {
          if (cancelled) return { content: [] }
          return budgetManagementService
            .getAllBudgetItems(0, 1000, { 'budgetId.equals': String(budgetId) })
            .then((r) => {
              const raw = r as { content?: unknown[] }
              const content = Array.isArray(raw?.content) ? raw.content : []
              return { content }
            })
        })

    fetchItems().then(({ content }) => {
      if (cancelled || !Array.isArray(content)) {
        setBudgetDetailsOptions([])
        setBudgetItemsData([])
        return
      }
      setBudgetItemsData(content)
      setBudgetDetailsOptions(
        content.map((x: unknown) => {
          const item = x as Record<string, unknown>
          const id = Number(item.id)
          const displayName =
            [item.serviceName, item.subCategoryName, item.serviceNameLocale, item.serviceCode]
              .find((v) => v != null && String(v).trim() !== '') as string | undefined
            || `Item ${id}`
          return {
            id,
            displayName: String(displayName).trim(),
            settingValue: String(id),
            dto: item,
          }
        })
      )
    }).finally(() => {
      if (!cancelled) setLoadingBudgetDetails(false)
    })

    return () => {
      cancelled = true
    }
  }, [selectedBudgetId])

  // When budget is cleared, clear budget items and dependent fields
  useEffect(() => {
    if (!selectedBudgetId) {
      setValue('budgetItems', '')
      setValue('budgetSubCategory', '')
      setValue('budgetServiceName', '')
      setValue('categoryCode', '')
      setValue('subCategoryCode', '')
      setValue('serviceCode', '')
      setValue('provisionalBudgetId', '')
      setValue('availableBudgetAmount', '')
      setValue('utilizedBudgetAmount', '')
      setValue('invoiceBudgetAmount', '')
      setValue('budgetItemDTO', undefined)
      setValue('budgetCategoryDTO', undefined)
      setValue('budgetDTO', undefined)
    }
  }, [selectedBudgetId, setValue])

  const selectedBudgetItemId = watch('budgetItems')

  // Auto-fill budget fields when a budget item is selected
  useEffect(() => {
    if (!selectedBudgetItemId || !budgetItemsData.length) return
    const itemId =
      typeof selectedBudgetItemId === 'string'
        ? parseInt(selectedBudgetItemId, 10)
        : Number(selectedBudgetItemId)
    if (isNaN(itemId)) return
    const item = budgetItemsData.find((i: { id: number }) => i.id === itemId)
    if (!item) return

    const bc = item.budgetCategoryDTO
    const bd = item.budgetDTO
    setValue('budgetSubCategory', item.subCategoryName ?? '')
    setValue('budgetServiceName', item.serviceName ?? '')
    setValue('categoryCode', bc?.categoryCode ?? '')
    setValue('subCategoryCode', item.subCategoryCode ?? '')
    setValue('serviceCode', item.serviceCode ?? '')
    setValue('provisionalBudgetId', item.provisionalServiceCode ?? '')
    setValue('availableBudgetAmount', String(item.availableBudget ?? ''))
    setValue('utilizedBudgetAmount', String(item.utilizedBudget ?? ''))
    setValue('invoiceBudgetAmount', String(item.totalBudget ?? ''))
    setValue('budgetItemDTO', item)
    setValue('budgetCategoryDTO', bc ? { id: bc.id } : undefined)
    setValue('budgetDTO', bd ? { id: bd.id } : undefined)
  }, [selectedBudgetItemId, budgetItemsData, setValue])

  // Memoize developer names from all build partners data + any additional names
  const developerNames = useMemo(() => {
    const baseNames =
      allBuildPartners && allBuildPartners.length > 0
        ? allBuildPartners
            .map((bp: any) => bp.arName)
            .filter((name: string | null) => !!name)
        : []

    // Combine base names with additional names, removing duplicates
    const allNames = [...baseNames, ...additionalDeveloperNames]
    return [...new Set(allNames)].filter(Boolean)
  }, [allBuildPartners, additionalDeveloperNames])

  // Memoize build partner options for Autocomplete
  // Use exact API response fields - arName for display, id for value
  // Preserve exact sequence as returned by API (no sorting, no filtering except invalid entries)
  const buildPartnerOptions = useMemo(() => {
    if (!allBuildPartners || allBuildPartners.length === 0) {
      return []
    }

    const seen = new Set<number>() // Track by numeric ID to prevent duplicates
    const options: Array<{ value: string; label: string; buildPartner: any }> =
      []

    // Iterate in exact order from API response
    for (const bp of allBuildPartners) {
      // Only filter out completely invalid entries (no id or no name)
      if (!bp || !bp.id || !bp.arName) {
        continue
      }

      // Prevent duplicates by ID (keep first occurrence, skip later ones)
      if (seen.has(bp.id)) {
        continue
      }
      seen.add(bp.id)

      // Add option in exact API response order
      options.push({
        value: bp.id.toString(), // Use numeric ID as value
        label: bp.arName, // Use arName directly from API response
        buildPartner: bp, // Store full API response object
      })
    }

    // Return options in exact same order as API response
    return options
  }, [allBuildPartners])

  // Memoize project assets - only show assets when build partner is selected
  // If no build partner is selected (assetRegisterDTO is null), return empty array
  const projectAssets = useMemo(() => {
    // If no build partner is selected, return empty array (project dropdown should be disabled)
    if (!selectedBuildPartner || !selectedBuildPartnerId) {
      return []
    }

    // If a build partner is selected, use filtered assets from API
    // Only include assets if API response has content (not empty)
    const baseAssets = Array.isArray(filteredRealEstateAssets.assets)
      ? filteredRealEstateAssets.assets
      : []

    // Only include additional assets if they're valid and baseAssets exist
    // Or if we're in edit mode and need to preserve prepopulated assets
    const shouldIncludeAdditional = baseAssets.length > 0 || isEditMode

    // Combine base assets with additional assets, removing duplicates by ID
    const allAssets = shouldIncludeAdditional
      ? [...baseAssets, ...additionalProjectAssets]
      : baseAssets

    const uniqueAssets = allAssets.reduce((acc: any[], asset: any) => {
      // Validate asset has required fields before adding
      // Filter out invalid assets (null, undefined, missing id or name, or placeholder values)
      if (
        asset &&
        asset.id &&
        typeof asset.id === 'number' &&
        asset.mfName &&
        typeof asset.mfName === 'string' &&
        asset.mfName.trim() !== '' &&
        asset.mfName.toLowerCase() !== 'new project' && // Filter out placeholder "new project"
        !acc.find((a: any) => a.id === asset.id)
      ) {
        acc.push(asset)
      }
      return acc
    }, [])

    return uniqueAssets
  }, [
    selectedBuildPartner,
    selectedBuildPartnerId,
    filteredRealEstateAssets.assets,
    additionalProjectAssets,
    isEditMode,
  ])

  // State to track if prepopulation has been attempted
  const [prepopulationAttempted, setPrepopulationAttempted] =
    useState<boolean>(false)

  // Extract prepopulation into a stable callback so we can reuse on refreshKey changes
  const prepopulateData = React.useCallback(async () => {
    if (isEditMode && savedId) {
      if (isEditMode && savedId && !prepopulationAttempted) {
        try {
          const savedData = await fundEgressService.getFundEgressById(savedId)

          // Map the saved data to form format - comprehensive field mapping
          const formData = {
            // Basic Payment Information
            tasReference: savedData.fePaymentRefNumber || '',

            // Developer Information
            developerName: savedData.assetRegisterDTO?.arName || '',
            developerId: savedData.assetRegisterDTO?.id?.toString() || '',

            // Project Information
            projectName: savedData.managementFirmDTO?.id?.toString() || '',
            projectId: (savedData.managementFirmDTO as any)?.mfCif || '',

            // Narrations and Remarks
            narration1: savedData.feNarration1 || '',
            narration2: savedData.feNarration2 || '',
            remarks: savedData.feRemark || '',

            // Payment Type Information (use expenseTypeDTO instead of voucherPaymentTypeDTO)
            paymentType:
              (savedData.expenseTypeDTO as any)?.id?.toString() ||
              savedData.voucherPaymentTypeDTO?.id?.toString() ||
              '',
            paymentSubType:
              (savedData.expenseSubTypeDTO as any)?.id?.toString() ||
              savedData.voucherPaymentSubTypeDTO?.id?.toString() ||
              '',

            // Regular approval ref (maps to feReraApprovedRefNo)
            paymentType1: savedData.feReraApprovedRefNo || '',

            // Payment Details (map to actual Step 1 field names)
            paymentMode: savedData.paymentModeDTO?.id?.toString() || '',
            invoiceCurrency: savedData.invoiceCurrencyDTO?.id?.toString() || '',
            // UI field name for Payment Currency is totalAmountPaid1
            totalAmountPaid1:
              savedData.paymentCurrencyDTO?.id?.toString() || '',
            // UI field name for Charge Mode is bankCharges
            bankCharges: savedData.chargedCodeDTO?.id?.toString() || '',
            // UI field name for Transaction Type is engineerFeePayment
            engineerFeePayment:
              savedData.transactionTypeDTO?.id?.toString() || '',

            // Financial Fields
            invoiceRef: savedData.feInvoiceRefNo || '',
            invoiceValue: savedData.feInvoiceValue?.toString() || '',
            invoiceDate: (() => {
              // More robust check: ensure it's a non-empty string
              const invoiceDate = savedData.feInvoiceDate
              if (
                invoiceDate != null &&
                typeof invoiceDate === 'string' &&
                invoiceDate.trim() !== ''
              ) {
                try {
                  const date = dayjs(invoiceDate.trim())
                  if (date.isValid()) {
                    return date
                  } else {
                    console.warn('feInvoiceDate is invalid:', invoiceDate)
                  }
                } catch (e) {
                  console.warn('Failed to parse feInvoiceDate:', invoiceDate, e)
                }
              }
              return null
            })(),
            paymentDate: (() => {
              // Prioritize fePaymentExecutionDate if it exists and is valid
              // More robust check: ensure it's a non-empty string
              const executionDate = savedData.fePaymentExecutionDate
              if (
                executionDate != null &&
                typeof executionDate === 'string' &&
                executionDate.trim() !== ''
              ) {
                try {
                  const date = dayjs(executionDate.trim())
                  if (date.isValid()) {
                    return date
                  } else {
                    console.warn(
                      'fePaymentExecutionDate is invalid:',
                      executionDate
                    )
                  }
                } catch (e) {
                  console.warn(
                    'Failed to parse fePaymentExecutionDate:',
                    executionDate,
                    e
                  )
                }
              }
              // Fallback to fePaymentDate
              const paymentDate = savedData.fePaymentDate
              if (
                paymentDate != null &&
                typeof paymentDate === 'string' &&
                paymentDate.trim() !== ''
              ) {
                try {
                  const date = dayjs(paymentDate.trim())
                  if (date.isValid()) {
                    return date
                  }
                } catch (e) {
                  console.warn('Failed to parse fePaymentDate:', paymentDate, e)
                }
              }
              console.warn(
                'No valid payment date found. fePaymentExecutionDate:',
                savedData.fePaymentExecutionDate,
                'fePaymentDate:',
                savedData.fePaymentDate
              )
              return null
            })(),
            paymentAmount: savedData.fePaymentAmount?.toString() || '',
            totalAmountPaid: savedData.feTotalAmountPaid?.toString() || '',

            // Account Balances (prepopulate the read-only balance fields)
            subConstructionAccount:
              savedData.feCurBalInEscrowAcc !== undefined &&
              savedData.feCurBalInEscrowAcc !== null
                ? String(savedData.feCurBalInEscrowAcc)
                : '',
            retentionAccount:
              savedData.feSubConsAccBalance !== undefined &&
              savedData.feSubConsAccBalance !== null
                ? String(savedData.feSubConsAccBalance)
                : '',
            retentionAccount1:
              savedData.feCorporateAccBalance !== undefined &&
              savedData.feCorporateAccBalance !== null
                ? String(savedData.feCorporateAccBalance)
                : '',
            retentionAccount2:
              savedData.feCurBalInRetentionAcc !== undefined &&
              savedData.feCurBalInRetentionAcc !== null
                ? String(savedData.feCurBalInRetentionAcc)
                : '',

            // Debit/Credit Amounts
            debitCreditToEscrow: savedData.feDebitFromEscrow?.toString() || '',
            debitFromRetention:
              savedData.feDebitFromRetention?.toString() || '',

            // Engineer Fee Information (using correct field names)
            engineerApprovedAmount:
              savedData.feEngineerApprovedAmt?.toString() || '',
            // UI field: EngineerFeesPayment
            EngineerFeesPayment:
              savedData.feCorporatePaymentEngFee?.toString() || '',

            // Additional Financial Fields (using correct field names)
            totalEligibleAmount:
              savedData.feTotalEligibleAmtInv?.toString() || '',
            amountPaid: savedData.feAmtPaidAgainstInv?.toString() || '',
            // Capital Limit Exceeded
            amountPaid1: savedData.feCapExcedded || '',
            currentEligibleAmount: savedData.feCurEligibleAmt?.toString() || '',
            totalPayoutAmount: savedData.feTotalPayoutAmt?.toString() || '',
            amountInTransit: savedData.feAmountInTransit?.toString() || '',
            // Indicative Rate (UI field name is vatCapExceeded3)
            vatCapExceeded3: savedData.feIndicativeRate?.toString() || '',
            // UI fields for amounts below
            uploadDocuments: savedData.feAmountToBeReleased?.toString() || '',
            uploadDocuments1: savedData.feBeneVatPaymentAmt?.toString() || '',
            // Corporate Certification Fees → vatCapExceeded4
            vatCapExceeded4: savedData.feCorpCertEngFee?.toString() || '',

            // Deal Reference No.
            delRefNo: savedData.feDealRefNo || '',
            // PPC Number
            ppcNo: savedData.fePpcNumber?.toString() || '',

            // Payout to be made from CBS
            uploadDocuments2:
              (savedData.payoutToBeMadeFromCbsDTO as any)?.id?.toString() || '',

            // Boolean Flags
            corporateAmount: !!savedData.feCorporatePayment,
            specialRate: !!savedData.feSpecialRate,
            EngineerFeePaymentNeeded: !!savedData.feIsEngineerFee,
            forFeit: savedData.feForFeit ? 'true' : 'false',
            refundToUnitHolder: savedData.feRefundToUnitHolder
              ? 'true'
              : 'false',
            transferToOtherUnit: savedData.feTransferToOtherUnit
              ? 'true'
              : 'false',
            feDocVerified: savedData.feDocVerified || false,

            // Forfeit Amount
            forFeitAmt: savedData.feForFeitAmt?.toString() || '',

            // Date Fields
            unitTransferAppDate:
              savedData.feUnitTransferAppDate &&
              savedData.feUnitTransferAppDate !== ''
                ? dayjs(savedData.feUnitTransferAppDate)
                : null,
            paymentSubType1:
              savedData.feReraApprovedDate &&
              savedData.feReraApprovedDate !== ''
                ? dayjs(savedData.feReraApprovedDate)
                : null, // Regular approval date
            engineerFeePayment1: (() => {
              // Prioritize fePaymentExecutionDate if it exists and is valid
              const executionDate = savedData.fePaymentExecutionDate
              if (
                executionDate != null &&
                typeof executionDate === 'string' &&
                executionDate.trim() !== ''
              ) {
                try {
                  const date = dayjs(executionDate.trim())
                  if (date.isValid()) {
                    return date
                  }
                } catch (e) {
                  // Fall through to feBeneDateOfPayment
                }
              }
              // Fallback to feBeneDateOfPayment (original field)
              if (
                savedData.feBeneDateOfPayment &&
                savedData.feBeneDateOfPayment !== ''
              ) {
                try {
                  const date = dayjs(savedData.feBeneDateOfPayment)
                  if (date.isValid()) {
                    return date
                  }
                } catch (e) {
                  // Invalid date
                }
              }
              return null
            })(),
            // Bank Charges (numeric input field)
            engineerFeePayment2: savedData.fbbankCharges?.toString() || '',

            // Payment execution date and account numbers
            escrowAccount: savedData.escrowAccountNumber || '',
            corporateAccount: savedData.constructionAccountNumber || '',
            corporateAccount1: savedData.corporateAccountNumber || '',
            corporateAccount2: savedData.retentionAccountNumber || '',

            // Budget details (from API response; keys may exist even if not on FundEgressData type)
            budgetDetails:
              (savedData as any).budgetDTO?.id?.toString() ??
              (savedData as any).feBudgetDetails ??
              '',
            budgetCategory:
              (savedData as any).budgetCategoryDTO?.id?.toString() ??
              (savedData as any).feBudgetCategory ??
              '',
            budgetItems:
              (savedData as any).budgetItemDTO?.id?.toString() ??
              (savedData as any).feBudgetItems ??
              '',
            budgetSubCategory: (savedData as any).feBudgetSubCategory ?? '',
            budgetServiceName: (savedData as any).feBudgetServiceName ?? '',
            categoryCode: (savedData as any).feCategoryCode ?? '',
            subCategoryCode: (savedData as any).feSubCategoryCode ?? '',
            serviceCode: (savedData as any).feServiceCode ?? '',
            provisionalBudgetId: (savedData as any).feProvisionalBudgetId ?? '',
            availableBudgetAmount:
              (savedData as any).feAvailableBudgetAmount != null
                ? String((savedData as any).feAvailableBudgetAmount)
                : '',
            utilizedBudgetAmount:
              (savedData as any).feUtilizedBudgetAmount != null
                ? String((savedData as any).feUtilizedBudgetAmount)
                : '',
            invoiceBudgetAmount:
              (savedData as any).feInvoiceBudgetAmount != null
                ? String((savedData as any).feInvoiceBudgetAmount)
                : '',
            provisionalBudget:
              (savedData as any).feProvisionalBudget === true ||
              (savedData as any).feProvisionalBudget === 'true'
                ? true
                : '',
            hoaExemption:
              (savedData as any).feHoaException === true ||
              (savedData as any).feHoaException === 'true'
                ? true
                : '',
            budgetDTO: (savedData as any).budgetDTO ?? undefined,
            budgetCategoryDTO: (savedData as any).budgetCategoryDTO ?? undefined,
            budgetItemDTO: (savedData as any).budgetItemDTO ?? undefined,
          }

          // Pre-populate Build Partner/Project Account Status
          try {
            const accountStatusDTO = (savedData.managementFirmDTO as any)
              ?.mfAccountStatusDTO

            if (
              accountStatusDTO &&
              Array.isArray(buildAssetAccountStatuses.data) &&
              buildAssetAccountStatuses.data.length > 0
            ) {
              // Try to match by ID first (most reliable)
              let matched = null
              if (accountStatusDTO.id) {
                matched = buildAssetAccountStatuses.data.find(
                  (opt: any) =>
                    opt?.id === accountStatusDTO.id ||
                    String(opt?.id) === String(accountStatusDTO.id)
                )
              }

              // If no ID match, try to match by label/value
              if (!matched) {
                const statusLabel =
                  accountStatusDTO?.languageTranslationId?.configValue ||
                  accountStatusDTO?.settingValue ||
                  accountStatusDTO?.name ||
                  accountStatusDTO?.configValue ||
                  ''

                if (statusLabel) {
                  matched = buildAssetAccountStatuses.data.find(
                    (opt: any) =>
                      opt?.languageTranslationId?.configValue === statusLabel ||
                      opt?.settingValue === statusLabel ||
                      opt?.name === statusLabel ||
                      opt?.configValue === statusLabel
                  )
                }
              }

              if (matched?.id) {
                setValue('projectStatus', String(matched.id), {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: false,
                })
              }
            }
          } catch (error) {
            console.error('Error prepopulating projectStatus:', error)
          }

          // Add developer name to additional names if not in current list
          if (
            formData.developerName &&
            !developerNames.includes(formData.developerName)
          ) {
            setAdditionalDeveloperNames((prev) => [
              ...prev,
              formData.developerName,
            ])
          }

          // Add project asset to additional assets if not in current list (by ID)
          if (savedData.managementFirmDTO && formData.projectName) {
            const projectId = parseInt(formData.projectName)
            const existingAsset = projectAssets.find(
              (asset: any) => asset.id === projectId
            )

            if (!existingAsset) {
              const newAsset = {
                id: savedData.managementFirmDTO.id,
                mfName: savedData.managementFirmDTO.mfName,
                mfId: savedData.managementFirmDTO.mfId,
              }
              setAdditionalProjectAssets((prev) => [...prev, newAsset])
            }
          }

          // Set form values - force update even if field exists
          Object.entries(formData).forEach(([key, value]) => {
            if (value) {
              // Only set non-empty values
              setValue(key as any, value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: false,
              })

              if (key === 'tasReference') {
                setPaymentRefId(value)
              }
            }
          })

          // Always set budget-related fields (including empty) so edit mode reflects saved data
          const budgetKeys = [
            'budgetDetails', 'budgetCategory', 'budgetItems', 'budgetSubCategory', 'budgetServiceName',
            'categoryCode', 'subCategoryCode', 'serviceCode', 'provisionalBudgetId',
            'availableBudgetAmount', 'utilizedBudgetAmount', 'invoiceBudgetAmount',
            'provisionalBudget', 'hoaExemption', 'budgetDTO', 'budgetCategoryDTO', 'budgetItemDTO',
          ] as const
          budgetKeys.forEach((key) => {
            const val = formData[key as keyof typeof formData]
            const isDto = key === 'budgetDTO' || key === 'budgetCategoryDTO' || key === 'budgetItemDTO'
            setValue(key, isDto ? val : (val ?? ''), {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            })
          })

          // Debug: Log payment date values
          if (savedData.fePaymentExecutionDate || savedData.fePaymentDate) {
          }

          // Mark prepopulation as attempted to prevent multiple attempts
          setPrepopulationAttempted(true)

          if (onDataLoaded) {
            onDataLoaded()
          }
        } catch (error) {
          setPrepopulationAttempted(true) // Still mark as attempted to prevent retries

          // Still notify parent even if there's an error, to stop loading state
          if (onDataLoaded) {
            onDataLoaded()
          }
        }
      }
    }
  }, [
    isEditMode,
    savedId,
    prepopulationAttempted,
    developerNames,
    projectAssets,
    onDataLoaded,
    setValue,
    trigger,
  ])

  // Handle data prepopulation when in edit mode
  useEffect(() => {
    // Run prepopulation when:
    // 1. We're in edit mode
    // 2. We have a saved ID
    // 3. We haven't attempted prepopulation yet
    // 4. Either initial data is loaded OR we have some data to work with
    if (isEditMode && savedId && !prepopulationAttempted) {
      // Wait a bit for shared data to load, but don't wait forever
      const timeoutId = setTimeout(
        () => {
          prepopulateData()
        },
        sharedData.isInitialLoading ? 1000 : 100
      ) // 1s if loading, 100ms if data ready

      return () => clearTimeout(timeoutId)
    }

    // Return empty cleanup function if conditions not met
    return () => {}
  }, [
    isEditMode,
    savedId,
    setValue,
    sharedData.isInitialLoading,
    prepopulationAttempted,
    onDataLoaded,
    prepopulateData,
  ])

  // Refresh-from-API when coming back to Step 1 (refreshKey changes)
  useEffect(() => {
    if (!isEditMode || !savedId) return
    // Reset and refetch on step re-entry
    setPrepopulationAttempted(false)
    const t = setTimeout(
      () => {
        prepopulateData()
      },
      sharedData.isInitialLoading ? 1000 : 0
    )
    return () => clearTimeout(t)
  }, [refreshKey])

  // Reset prepopulation flag and additional data when savedId changes
  useEffect(() => {
    setPrepopulationAttempted(false)
    setAdditionalDeveloperNames([])
    setAdditionalProjectAssets([])
  }, [savedId])

  // Function to generate new payment reference ID
  const handleGeneratePaymentRefId = async () => {
    try {
      setIsGeneratingId(true)
      const newIdResponse = idService.generateNewId('PAY')
      const newId = newIdResponse.id

      // Update both state and form value
      setPaymentRefId(newId)
      setValue('tasReference', newId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      // Ensure validation errors are cleared immediately
      await trigger('tasReference' as any)
    } catch (error) {
      throw error
    } finally {
      setIsGeneratingId(false)
    }
  }

  // Watch for developer name changes and auto-populate developer ID
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'developerName') {
        if (value.developerName) {
          const selectedPartner = allBuildPartners.find(
            (bp: any) => bp.arName === value.developerName
          )
          if (selectedPartner) {
            setValue('developerId', selectedPartner.id?.toString() || '', {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
            // Clear any existing validation error for developerId immediately
            trigger('developerId' as any)

            // Clear projectName, projectId, and projectStatus when developer changes
            // to ensure only assets for the new build partner are shown
            setValue('projectName', '', {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
            setValue('projectId', '', {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
            setValue('projectStatus', '', {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
          }
        } else {
          // When developer name is cleared, also clear developer ID and project fields
          setValue('developerId', '', {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
          setValue('projectName', '', {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
          setValue('projectId', '', {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
          setValue('projectStatus', '', {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
        }
      }

      // Watch for project name changes and auto-populate project ID and status
      if (name === 'projectName') {
        // Always update when projectName changes, even if empty
        if (value.projectName) {
          // Use the latest projectAssets from the current render
          const currentProjectAssets = projectAssets

          // Convert projectName to number for comparison
          const projectNameId =
            typeof value.projectName === 'string'
              ? parseInt(value.projectName, 10)
              : Number(value.projectName)

          const selectedAsset = currentProjectAssets.find(
            (asset: any) =>
              asset.id === projectNameId ||
              String(asset.id) === String(value.projectName)
          )

          if (selectedAsset) {
            // Always update projectId, even if it already has a value
            if (selectedAsset.mfCif) {
              setValue('projectId', selectedAsset.mfCif, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
              trigger('projectId' as any)
            } else {
              // Clear if no CIF available
              setValue('projectId', '', {
                shouldDirty: true,
                shouldTouch: false,
                shouldValidate: false,
              })
            }

            // Always update projectStatus, even if it already has a value
            if (selectedAsset.mfAccountStatusDTO?.id) {
              setValue(
                'projectStatus',
                String(selectedAsset.mfAccountStatusDTO.id),
                {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                }
              )
              trigger('projectStatus' as any)
            } else {
              // Clear if no status available
              setValue('projectStatus', '', {
                shouldDirty: true,
                shouldTouch: false,
                shouldValidate: false,
              })
            }
          } else {
            // Asset not found - clear dependent fields
            setValue('projectId', '', {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
            setValue('projectStatus', '', {
              shouldDirty: true,
              shouldTouch: false,
              shouldValidate: false,
            })
          }
        } else {
          // Project name cleared - clear dependent fields
          setValue('projectId', '', {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
          setValue('projectStatus', '', {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue, allBuildPartners, projectAssets, trigger])

  // Re-attempt ID population when build partners data becomes available
  useEffect(() => {
    const currentDeveloperName = watch('developerName')
    const currentProjectName = watch('projectName')

    // Try to populate developer ID if we have a name but no ID
    if (
      currentDeveloperName &&
      !watch('developerId') &&
      allBuildPartners.length > 0
    ) {
      const selectedPartner = allBuildPartners.find(
        (bp: any) => bp.arName === currentDeveloperName
      )
      if (selectedPartner) {
        setValue('developerId', selectedPartner.id?.toString() || '', {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        })
        trigger('developerId' as any)
      }
    }

    // Always update project ID and status when projectAssets change and projectName is selected
    if (currentProjectName && projectAssets.length > 0) {
      // Convert to number for comparison
      const projectNameId =
        typeof currentProjectName === 'string'
          ? parseInt(currentProjectName, 10)
          : Number(currentProjectName)

      const selectedAsset = projectAssets.find(
        (asset: any) =>
          asset.id === projectNameId ||
          String(asset.id) === String(currentProjectName)
      )

      if (selectedAsset) {
        // Always update projectId, even if it already has a value
        const currentProjectId = watch('projectId')
        if (selectedAsset.mfCif && currentProjectId !== selectedAsset.mfCif) {
          setValue('projectId', selectedAsset.mfCif, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
          trigger('projectId' as any)
        }

        // Always update projectStatus, even if it already has a value
        const currentProjectStatus = watch('projectStatus')
        const expectedStatus = selectedAsset.mfAccountStatusDTO?.id
          ? String(selectedAsset.mfAccountStatusDTO.id)
          : ''

        if (expectedStatus && currentProjectStatus !== expectedStatus) {
          setValue('projectStatus', expectedStatus, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
          trigger('projectStatus' as any)
        }
      }
    }
  }, [projectAssets, watch, setValue, trigger])

  // Initialize payment reference ID from form value and keep in sync
  React.useEffect(() => {
    const currentId = watch('tasReference')
    if (currentId !== paymentRefId) {
      setPaymentRefId(currentId || '')
    }
  }, [watch, paymentRefId])

  // Update form value when paymentRefId state changes (for generate button)
  React.useEffect(() => {
    const currentFormValue = watch('tasReference')
    if (paymentRefId && paymentRefId !== currentFormValue) {
      setValue('tasReference', paymentRefId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      })
    }
  }, [paymentRefId, watch, setValue])

  // Common styles for form components
  const commonFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: '46px',
      borderRadius: '8px',
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      color: isDarkMode ? '#F9FAFB' : '#111827',
      '& fieldset': {
        borderColor: isDarkMode ? '#334155' : '#CAD5E2',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#475569' : '#CAD5E2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2563EB',
      },
      '&.Mui-error fieldset': {
        borderColor: '#DC2626',
        borderWidth: '2px',
      },
      '& input': {
        color: isDarkMode ? '#F9FAFB' : '#111827',
      },
      '& .MuiInputBase-input': {
        color: isDarkMode ? '#F9FAFB' : '#111827',
      },
    },
  }

  const selectStyles = {
    height: '48px',
    '& .MuiOutlinedInput-root': {
      height: '48px',
      borderRadius: '12px',
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      color: isDarkMode ? '#F9FAFB' : '#111827',
      boxShadow: isDarkMode
        ? '0 1px 3px rgba(15, 23, 42, 0.4)'
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: isDarkMode ? '#334155' : '#E2E8F0',
        borderWidth: '1.5px',
        transition: 'border-color 0.2s ease-in-out',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#475569' : '#3B82F6',
        boxShadow: isDarkMode
          ? '0 2px 8px rgba(59, 130, 246, 0.2)'
          : '0 2px 8px rgba(59, 130, 246, 0.15)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2563EB',
        borderWidth: '2px',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.15)',
      },
      '&.Mui-error fieldset': {
        borderColor: '#DC2626',
        borderWidth: '2px',
        boxShadow: 'none',
      },
    },
    '& .MuiSelect-icon': {
      color: isDarkMode ? '#94A3B8' : '#64748B',
      fontSize: '20px !important',
      transition: 'color 0.2s ease-in-out',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    '&:hover .MuiSelect-icon': {
      color: '#3B82F6',
    },
    '&.Mui-focused .MuiSelect-icon': {
      color: '#2563EB',
    },
  }

  const datePickerStyles = {
    height: '46px',
    '& .MuiOutlinedInput-root': {
      height: '46px',
      borderRadius: '8px',
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      color: isDarkMode ? '#F9FAFB' : '#111827',
      '& fieldset': {
        borderColor: isDarkMode ? '#334155' : '#CAD5E2',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#475569' : '#CAD5E2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2563EB',
      },
      '&.Mui-error fieldset': {
        borderColor: '#DC2626',
        borderWidth: '2px',
      },
      '& input': {
        color: isDarkMode ? '#F9FAFB' : '#111827',
      },
    },
  }

  const labelSx = {
    color: isDarkMode ? '#9CA3AF' : '#374151',
    fontFamily:
      'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '13px',
    letterSpacing: '0.025em',
    marginBottom: '4px',
    '&.Mui-focused': {
      color: '#2563EB',
    },
    '&.Mui-error': {
      color: '#DC2626',
    },
    '&.MuiFormLabel-filled': {
      color: isDarkMode ? '#9CA3AF' : '#374151',
    },
  }

  const valueSx = {
    color: isDarkMode ? '#F9FAFB' : '#111827',
    fontFamily:
      'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 400,
    fontStyle: 'normal',
    fontSize: '14px',
    letterSpacing: '0.01em',
    wordBreak: 'break-word',
    '& .MuiSelect-select': {
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
    },
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
    label: string,
    gridSize = 6,
    defaultValue = '',
    isRequired = false,
    disabled = false
  ) => {
    return (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          defaultValue={defaultValue}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label={label}
              fullWidth
              error={!!error}
              helperText={error?.message}
              disabled={disabled || isReadOnly}
              required={isRequired && !isReadOnly}
              InputLabelProps={{ sx: labelSx }}
              InputProps={{ sx: valueSx }}
              sx={commonFieldStyles}
              onChange={(e) => {
                const value = e.target.value
                const maxLen = getFieldMaxLength(name)
                // Let user type freely but trigger validation on over-limit for fields with max length
                if (maxLen && value.length > maxLen) {
                  field.onChange(value)
                  // Trigger schema validation immediately so Zod shows "Max 15 characters"
                  // @ts-ignore
                  ;(control as any)._formState && control
                  trigger(name as any)
                } else {
                  field.onChange(value)
                }
              }}
            />
          )}
        />
      </Grid>
    )
  }

  const renderDeveloperNameField = () => {
    const label = getLabel(
      MANUAL_PAYMENT_LABELS.FORM_FIELDS.ASSET_REGISTER_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.ASSET_REGISTER_NAME
    )

    return (
      <Grid key="developerName" size={{ xs: 12, md: 6 }}>
        <Controller
          name="developerName"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => {
            // Find option by matching - prioritize ID matching for accuracy
            const currentDeveloperId = watch('developerId')
            const currentDeveloperName = field.value

            // Find the selected option - prioritize ID matching (most reliable)
            const selectedOption =
              buildPartnerOptions.find((opt) => {
                // First priority: match by numeric ID if available
                if (
                  currentDeveloperId &&
                  opt.value === currentDeveloperId.toString()
                ) {
                  return true
                }
                // Second priority: match by name if no ID match
                if (currentDeveloperName) {
                  return (
                    opt.label === currentDeveloperName ||
                    opt.buildPartner?.arName === currentDeveloperName
                  )
                }
                return false
              }) || null

            // Debug: Log selection changes
            // if (selectedOption && process.env.NODE_ENV === 'development') {
            //   console.log('🔍 Selected Option:', {
            //     id: selectedOption.value,
            //     name: selectedOption.label,
            //     currentDeveloperId,
            //     currentDeveloperName,
            //   })
            // }

            return (
              <Autocomplete
                key={`autocomplete-${currentDeveloperId || currentDeveloperName || 'empty'}`}
                value={selectedOption}
                onChange={(_event, newValue) => {
                  if (newValue) {
                    // Store arName in developerName field and numeric id in developerId field
                    // Use exact fields from API response
                    const arName =
                      newValue.buildPartner?.arName || newValue.label || ''
                    const partnerId =
                      newValue.buildPartner?.id?.toString() ||
                      newValue.value ||
                      ''

                    // Update both fields immediately
                    field.onChange(arName) // Store name for display and matching
                    // Store numeric ID (from API response) so mapper can use it directly
                    setValue('developerId', partnerId, {
                      shouldDirty: true,
                      shouldTouch: false,
                    })
                    // Trigger validation to ensure form state is updated
                    trigger('developerName' as any)
                    trigger('developerId' as any)

                    // Clear project fields when build partner changes to show fresh assets
                    if (arName !== field.value) {
                      setValue('projectName', '', {
                        shouldDirty: true,
                        shouldTouch: false,
                      })
                      setValue('projectId', '', {
                        shouldDirty: true,
                        shouldTouch: false,
                      })
                      setValue('projectStatus', '', {
                        shouldDirty: true,
                        shouldTouch: false,
                      })
                    }
                  } else {
                    // Clear both fields when selection is cleared
                    field.onChange('')
                    setValue('developerId', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                    })
                    setValue('projectName', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                    })
                    setValue('projectId', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                    })
                    setValue('projectStatus', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                    })
                  }
                }}
                options={buildPartnerOptions}
                getOptionLabel={(option) => option.label || ''}
                isOptionEqualToValue={(option, value) => {
                  // Compare by value (numeric ID) first, then by label
                  if (!option || !value) return false
                  // Primary comparison: by value (numeric ID)
                  if (
                    option.value &&
                    value.value &&
                    option.value === value.value
                  ) {
                    return true
                  }
                  // Fallback: by label (name)
                  if (
                    option.label &&
                    value.label &&
                    option.label === value.label
                  ) {
                    return true
                  }
                  return false
                }}
                // Use renderOption to ensure unique keys
                renderOption={(props, option) => (
                  <li
                    {...props}
                    key={
                      option.value || option.buildPartner?.id || option.label
                    }
                  >
                    {option.label}
                  </li>
                )}
                loading={
                  buildPartners.loading || filteredRealEstateAssets.loading
                }
                disabled={isReadOnly}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={label}
                    error={!!error}
                    helperText={error?.message}
                    required={!isReadOnly}
                    size="medium"
                    InputLabelProps={{ sx: labelSx }}
                    InputProps={{
                      ...params.InputProps,
                      sx: valueSx,
                    }}
                    sx={commonFieldStyles}
                  />
                )}
                ListboxProps={
                  {
                    // Removed pagination scroll - fetching all 1000 items at once
                  }
                }
                PaperComponent={({ children, ...props }: any) => (
                  <Paper
                    {...props}
                    sx={{
                      borderRadius: '12px',
                      boxShadow: isDarkMode
                        ? '0 12px 32px rgba(15, 23, 42, 0.7)'
                        : '0 10px 25px rgba(0, 0, 0, 0.1)',
                      border: isDarkMode
                        ? '1px solid #2E3A4F'
                        : '1px solid #E5E7EB',
                      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                      marginTop: '8px',
                      maxHeight: '300px',
                    }}
                  >
                    {children}
                  </Paper>
                )}
                sx={{
                  '& .MuiAutocomplete-inputRoot': {
                    ...selectStyles,
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: isDarkMode
                        ? '1px solid #334155'
                        : '1px solid #d1d5db',
                      borderRadius: '6px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: isDarkMode
                        ? '1px solid #475569'
                        : '1px solid #9ca3af',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #2563eb',
                    },
                  },
                }}
              />
            )
          }}
        />
      </Grid>
    )
  }

  const renderDeveloperIdField = () => {
    const label = getLabel(
      MANUAL_PAYMENT_LABELS.FORM_FIELDS.DEVELOPER_ID,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.DEVELOPER_ID
    )

    return (
      <Grid key="developerId" size={{ xs: 12, md: 6 }}>
        <Controller
          name="developerId"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => {
            // Display arDeveloperId in the text field, but keep numeric id in form value
            const displayValue =
              selectedBuildPartnerDeveloperId || field.value || ''

            return (
              <TextField
                {...field}
                value={displayValue} // Display arDeveloperId
                label={label}
                fullWidth
                error={!!error}
                helperText={error?.message}
                disabled={true} // Always disabled - auto-populated
                required={true}
                InputLabelProps={{ sx: labelSx }}
                InputProps={{ sx: valueSx }}
                sx={commonFieldStyles}
              />
            )
          }}
        />
      </Grid>
    )
  }

  const renderSelectField = (
    name: string,
    label: string,
    options: any[],
    gridSize = 6,
    isRequired = true,
    isLoading = false,
    disabled = false
  ) => {
    return (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          defaultValue={''}
          render={({ field, fieldState: { error } }) => (
            <FormControl
              fullWidth
              error={!!error}
              aria-invalid={!!error}
              required={isRequired && !isReadOnly}
            >
              <InputLabel sx={labelSx} required={isRequired && !isReadOnly}>
                {label}
              </InputLabel>
              <Select
                {...field}
                label={label}
                value={field.value ?? ''}
                sx={{
                  ...selectStyles,
                  ...valueSx,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #9ca3af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '2px solid #2563eb',
                  },
                }}
                disabled={disabled || isLoading || isReadOnly}
                IconComponent={KeyboardArrowDownIcon}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '12px',
                      boxShadow: isDarkMode
                        ? '0 14px 28px rgba(15, 23, 42, 0.7)'
                        : '0 10px 25px rgba(0, 0, 0, 0.1)',
                      border: isDarkMode
                        ? '1px solid #2E3A4F'
                        : '1px solid #E5E7EB',
                      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                      marginTop: '8px',
                      minHeight: '120px',
                      maxHeight: '300px',
                      overflow: 'auto',
                      '& .MuiMenuItem-root': {
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontFamily:
                          'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        color: isDarkMode ? '#F8FAFC' : '#374151',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: isDarkMode ? '#273248' : '#F3F4F6',
                          color: isDarkMode ? '#FFFFFF' : '#111827',
                        },
                        '&.Mui-selected': {
                          backgroundColor: isDarkMode ? '#303E5F' : '#EBF4FF',
                          color: isDarkMode ? '#FFFFFF' : '#2563EB',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: isDarkMode ? '#364566' : '#DBEAFE',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  -- Select --
                </MenuItem>
                {options.map((option, index) => {
                  const optionValue = String(
                    option.settingValue ?? option.id ?? option.value ?? ''
                  )
                  const optionLabel =
                    option.displayName ??
                    option.name ??
                    (typeof option === 'string' ? option : optionValue || `Option ${index + 1}`)
                  return (
                    <MenuItem
                      key={option.id ?? option.value ?? `option-${index}`}
                      value={optionValue}
                      sx={{
                        fontSize: '14px',
                        fontFamily:
                          'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        color: '#374151',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: '#F3F4F6',
                          color: '#111827',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#EBF4FF',
                          color: '#2563EB',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: '#DBEAFE',
                          },
                        },
                      }}
                    >
                      {optionLabel}
                    </MenuItem>
                  )
                })}
              </Select>
              <FormError error={error?.message || ''} touched={true} />
            </FormControl>
          )}
        />
      </Grid>
    )
  }

  const renderProjectNameField = () => {
    const label = getLabel(
      MANUAL_PAYMENT_LABELS.FORM_FIELDS.MANAGEMENT_FIRM_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.MANAGEMENT_FIRM_NAME
    )

    return (
      <Grid key="projectName" size={{ xs: 12, md: 6 }}>
        <Controller
          name="projectName"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => (
            <FormControl
              fullWidth
              error={!!error}
              aria-invalid={!!error}
              required={!isReadOnly}
            >
              <InputLabel sx={labelSx} required={!isReadOnly}>
                {label}
              </InputLabel>
              <Select
                {...field}
                label={label}
                onChange={(e) => {
                  const newValue = e.target.value
                  field.onChange(newValue) // Update the form field

                  // Immediately update dependent fields
                  if (newValue) {
                    const projectNameId =
                      typeof newValue === 'string'
                        ? parseInt(newValue, 10)
                        : Number(newValue)

                    const selectedAsset = projectAssets.find(
                      (asset: any) =>
                        asset.id === projectNameId ||
                        String(asset.id) === String(newValue)
                    )

                    if (selectedAsset) {
                      // Update projectId immediately
                      if (selectedAsset.mfCif) {
                        setValue('projectId', selectedAsset.mfCif, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                        trigger('projectId' as any)
                      } else {
                        setValue('projectId', '', {
                          shouldDirty: true,
                          shouldTouch: false,
                          shouldValidate: false,
                        })
                      }

                      // Update projectStatus immediately
                      if (selectedAsset.mfAccountStatusDTO?.id) {
                        setValue(
                          'projectStatus',
                          String(selectedAsset.mfAccountStatusDTO.id),
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          }
                        )
                        trigger('projectStatus' as any)
                      } else {
                        setValue('projectStatus', '', {
                          shouldDirty: true,
                          shouldTouch: false,
                          shouldValidate: false,
                        })
                      }
                    } else {
                      // Clear dependent fields when asset not found
                      setValue('projectId', '', {
                        shouldDirty: true,
                        shouldTouch: false,
                        shouldValidate: false,
                      })
                      setValue('projectStatus', '', {
                        shouldDirty: true,
                        shouldTouch: false,
                        shouldValidate: false,
                      })
                    }
                  } else {
                    // Clear dependent fields when project is cleared
                    setValue('projectId', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                      shouldValidate: false,
                    })
                    setValue('projectStatus', '', {
                      shouldDirty: true,
                      shouldTouch: false,
                      shouldValidate: false,
                    })
                  }
                }}
                sx={{
                  ...selectStyles,
                  ...valueSx,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #9ca3af',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '2px solid #2563eb',
                  },
                }}
                disabled={!selectedBuildPartnerId || isReadOnly}
                IconComponent={KeyboardArrowDownIcon}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '12px',
                      boxShadow: isDarkMode
                        ? '0 14px 28px rgba(15, 23, 42, 0.7)'
                        : '0 10px 25px rgba(0, 0, 0, 0.1)',
                      border: isDarkMode
                        ? '1px solid #2E3A4F'
                        : '1px solid #E5E7EB',
                      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                      marginTop: '8px',
                      minHeight: '120px',
                      maxHeight: '300px',
                      overflow: 'auto',
                      '& .MuiMenuItem-root': {
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontFamily:
                          'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        color: isDarkMode ? '#F8FAFC' : '#374151',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: isDarkMode ? '#273248' : '#F3F4F6',
                          color: isDarkMode ? '#FFFFFF' : '#111827',
                        },
                        '&.Mui-selected': {
                          backgroundColor: isDarkMode ? '#303E5F' : '#EBF4FF',
                          color: isDarkMode ? '#FFFFFF' : '#2563EB',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: isDarkMode ? '#364566' : '#DBEAFE',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  -- Select --
                </MenuItem>
                {projectAssets.map((asset) => (
                  <MenuItem
                    key={asset.id}
                    value={asset.id}
                    sx={{
                      fontSize: '14px',
                      fontFamily:
                        'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#374151',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: '#F3F4F6',
                        color: '#111827',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#EBF4FF',
                        color: '#2563EB',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#DBEAFE',
                        },
                      },
                    }}
                  >
                    {asset.mfName}
                  </MenuItem>
                ))}
              </Select>
              <FormError error={error?.message || ''} touched={true} />
            </FormControl>
          )}
        />
      </Grid>
    )
  }

  const renderDatePickerField = (
    name: string,
    label: string,
    gridSize: number = 6,
    isRequired = false
  ) => {
    return (
      <Grid key={name} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={name}
          control={control}
          defaultValue={null}
          render={({ field, fieldState: { error } }) => (
            <DatePicker
              label={label}
              value={field.value}
              onChange={field.onChange}
              format="DD/MM/YYYY"
              disabled={isReadOnly}
              slots={{
                openPickerIcon: StyledCalendarIcon,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  helperText: error?.message,
                  sx: datePickerStyles,
                  required: isRequired && !isReadOnly,
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
    )
  }

  const renderTextFieldWithButton = (
    name: string,
    label: string,
    buttonText: string,
    gridSize: number = 6,
    isRequired: boolean = false
  ) => (
    <Grid key={name} size={{ xs: 12, md: gridSize }}>
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            fullWidth
            label={label}
            error={!!error}
            helperText={error?.message}
            disabled={isReadOnly}
            required={isRequired && !isReadOnly}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<RefreshIcon />}
                    disabled={isReadOnly}
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
                    onClick={() => {}}
                  >
                    {buttonText}
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
  )

  const renderCheckboxField = (
    name: string,
    label?: string,
    gridSize: number = 6
  ) => (
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
                disabled={isReadOnly}
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

  const renderPaymentRefIdField = (
    name: string,
    label: string,
    gridSize: number = 6,
    isRequired: boolean = false
  ) => (
    <Grid key={name} size={{ xs: 12, md: gridSize }}>
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            fullWidth
            label={label}
            value={field.value || paymentRefId} // Use form value first, fallback to state
            disabled={isReadOnly} // Disable in view mode
            onChange={(e) => {
              const newValue = e.target.value
              setPaymentRefId(newValue)
              field.onChange(newValue) // Update form value
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 0 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleGeneratePaymentRefId}
                    disabled={isGeneratingId || isReadOnly}
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
                    {isGeneratingId ? 'Generating...' : 'Generate ID'}
                  </Button>
                </InputAdornment>
              ),
              sx: valueSx,
            }}
            error={!!error}
            helperText={error?.message}
            required={isRequired && !isReadOnly}
            InputLabelProps={{ sx: labelSx }}
            sx={commonFieldStyles}
          />
        )}
      />
    </Grid>
  )

  const renderAccountBalanceField = (
    accountKey: string,
    accountFieldName: string,
    accountLabel: string,
    balanceFieldName: string,
    balanceLabel: string,
    gridSize: number = 6,
    isRequired: boolean = false
  ) => (
    <>
      <Grid key={accountFieldName} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={accountFieldName}
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              fullWidth
              label={accountLabel}
              disabled={isReadOnly} // Disable in view mode
              error={!!error}
              helperText={error?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<RefreshIcon />}
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
                      onClick={async () => {
                        const isValid = await trigger(accountFieldName as any, {
                          shouldFocus: true,
                        })
                        if (!isValid) return
                        if (field.value) {
                          fetchBalance(accountKey, field.value)
                        }
                      }}
                      disabled={
                        loadingStates[accountKey] || !field.value || isReadOnly
                      }
                    >
                      {loadingStates[accountKey]
                        ? 'Loading...'
                        : 'Fetch Account Balance'}
                    </Button>
                  </InputAdornment>
                ),
                sx: valueSx,
              }}
              required={isRequired && !isReadOnly}
              InputLabelProps={{ sx: labelSx }}
              sx={commonFieldStyles}
            />
          )}
        />
      </Grid>
      <Grid key={balanceFieldName} size={{ xs: 12, md: gridSize }}>
        <Controller
          name={balanceFieldName}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={balanceLabel}
              value={
                balances[accountKey]
                  ? `${balances[accountKey]?.currencyCode} ${balances[accountKey]?.details?.transferLimits?.creditTransfer || '0'}`
                  : field.value
              }
              onChange={(e) => field.onChange(e)}
              disabled={true}
              InputLabelProps={{ sx: labelSx }}
              InputProps={{ sx: valueSx }}
              sx={{
                ...commonFieldStyles,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F5F5F5',
                  '& fieldset': {
                    borderColor: isDarkMode ? '#1E293B' : '#E0E0E0',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#1E293B' : '#E0E0E0',
                  },
                },
              }}
            />
          )}
        />
        {accountErrors[accountKey] && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, ml: 1.75 }}
          >
            {String(accountErrors[accountKey])}
          </Typography>
        )}
      </Grid>
    </>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card
        sx={{
          boxShadow: 'none',
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFFBF',
          width: '84%',
          margin: '0 auto',
          border: isDarkMode ? '1px solid #334155' : 'none',
        }}
      >
        <CardContent sx={{ color: isDarkMode ? '#F9FAFB' : 'inherit' }}>
          <Grid container rowSpacing={4} columnSpacing={2}>
            {renderPaymentRefIdField(
              'tasReference',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TAS_REFERENCE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.TAS_REFERENCE
              ),
              6,
              true
            )}

            {renderDeveloperNameField()}
            {renderDeveloperIdField()}
            {renderProjectNameField()}
            {renderTextField(
              'projectId',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PROJECT_ID,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PROJECT_ID
              ),
              6,
              '',
              true,
              true // Disable - auto-populated from project name
            )}
            {renderSelectField(
              'projectStatus',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PROJECT_STATUS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PROJECT_STATUS
              ),
              buildAssetAccountStatuses.data,
              6,
              true,
              false,
              true // Disable - auto-populated from project name
            )}
            {renderAccountBalanceField(
              'escrow',
              'escrowAccount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.ESCROW_ACCOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.ESCROW_ACCOUNT
              ),
              'subConstructionAccount',
              'Current Balance in Escrow Account*',
              6,
              true
            )}
            {renderAccountBalanceField(
              'subConstruction',
              'corporateAccount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.SUB_CONSTRUCTION_ACCOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .SUB_CONSTRUCTION_ACCOUNT
              ),
              'retentionAccount',
              'Current Balance in Sub Construction Account*',
              6,
              true
            )}
            {renderAccountBalanceField(
              'corporate',
              'corporateAccount1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CORPORATE_ACCOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.CORPORATE_ACCOUNT
              ),
              'retentionAccount1',
              'Current Balance in Corporate Account*',
              6,
              true
            )}
            {renderAccountBalanceField(
              'retention',
              'corporateAccount2',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.RETENTION_ACCOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.RETENTION_ACCOUNT
              ),
              'retentionAccount2',
              'Current Balance in Retention Account*',
              6,
              true
            )}

            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '0.15px',
                  verticalAlign: 'middle',
                }}
              >
                {getLabel(
                  MANUAL_PAYMENT_LABELS.SECTION_TITLES.EXPENSE_TYPE,
                  'EN',
                  MANUAL_PAYMENT_LABELS.FALLBACKS.SECTION_TITLES.EXPENSE_TYPE
                )}
              </Typography>
            </Grid>

            {renderSelectField(
              'paymentType',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PAYMENT_TYPE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PAYMENT_TYPE
              ),
              paymentTypes.data || [],
              6,
              true
            )}
            {renderSelectField(
              'paymentSubType',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PAYMENT_SUB_TYPE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PAYMENT_SUB_TYPE
              ),
              paymentSubTypes.data || [],
              6,
              false
            )}
            {renderTextField(
              'paymentType1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.REGULAR_APPROVAL_REF,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.REGULAR_APPROVAL_REF
              ),
              6,
              '',
              true
            )}
            {renderDatePickerField(
              'paymentSubType1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.REGULAR_APPROVAL_DATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .REGULAR_APPROVAL_DATE
              ),
              6,
              true
            )}
            {renderTextField(
              'invoiceRef',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.INVOICE_REF,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.INVOICE_REF
              ),
              3,
              '',
              true
            )}
            {renderSelectField(
              'invoiceCurrency',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.INVOICE_CURRENCY,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.INVOICE_CURRENCY
              ),
              currencies.data || [],
              3,
              true
            )}
            {renderTextField(
              'invoiceValue',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.INVOICE_VALUE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.INVOICE_VALUE
              ),
              3,
              '',
              true
            )}
            {renderDatePickerField(
              'invoiceDate',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.INVOICE_DATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.INVOICE_DATE
              ),
              3
            )}

            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '0.15px',
                  verticalAlign: 'middle',
                }}
              >
                {getLabel(
                  MANUAL_PAYMENT_LABELS.SECTION_TITLES.AMOUNT_DETAILS,
                  'EN',
                  MANUAL_PAYMENT_LABELS.FALLBACKS.SECTION_TITLES.AMOUNT_DETAILS
                )}
              </Typography>
            </Grid>

            {renderTextField(
              'engineerApprovedAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.ENGINEER_APPROVED_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .ENGINEER_APPROVED_AMOUNT
              )
            )}
            {renderTextField(
              'totalEligibleAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TOTAL_ELIGIBLE_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .TOTAL_ELIGIBLE_AMOUNT
              )
            )}
            {renderTextField(
              'amountPaid',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.AMOUNT_PAID,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.AMOUNT_PAID
              )
            )}
            {renderTextField(
              'amountPaid1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CAP_EXCEEDED,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.CAP_EXCEEDED
              )
            )}
            {renderTextField(
              'totalAmountPaid',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TOTAL_AMOUNT_PAID,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.TOTAL_AMOUNT_PAID
              ),
              3
            )}
            {renderSelectField(
              'totalAmountPaid1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PAYMENT_CURRENCY,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PAYMENT_CURRENCY
              ),
              currencies.data,
              3
            )}
            {renderTextField(
              'debitCreditToEscrow',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.DEBIT_CREDIT_ESCROW,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.DEBIT_CREDIT_ESCROW
              ),
              3
            )}
            {renderTextField(
              'currentEligibleAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CURRENT_ELIGIBLE_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .CURRENT_ELIGIBLE_AMOUNT
              ),
              3
            )}
            {renderTextField(
              'debitFromRetention',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.DEBIT_FROM_RETENTION,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.DEBIT_FROM_RETENTION
              ),
              3
            )}
            {renderTextField(
              'totalPayoutAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TOTAL_PAYOUT_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.TOTAL_PAYOUT_AMOUNT
              ),
              3
            )}
            {renderTextField(
              'amountInTransit',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.AMOUNT_IN_TRANSIT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.AMOUNT_IN_TRANSIT
              ),
              3
            )}
            {renderTextField(
              'vatCapExceeded',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.VAT_CAP_EXCEEDED,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.VAT_CAP_EXCEEDED
              ),
              3
            )}
            {renderCheckboxField(
              'specialRate',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.SPECIAL_RATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.SPECIAL_RATE
              ),
              3
            )}
            {renderCheckboxField(
              'corporateAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CORPORATE_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.CORPORATE_AMOUNT
              ),
              3
            )}
            {renderTextField(
              'delRefNo',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.DEAL_REF_NO,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.DEAL_REF_NO
              ),
              3,
              '',
              true
            )}
            {renderTextField(
              'ppcNo',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PPC_NUMBER,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PPC_NUMBER
              ),
              3
            )}
            {renderTextFieldWithButton(
              'vatCapExceeded3',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.INDICATIVE_RATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.INDICATIVE_RATE
              ),
              'Get Exchange Rate',
              6,
              true
            )}
            {renderTextField(
              'vatCapExceeded4',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CORPORATE_CERTIFICATION_FEES,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .CORPORATE_CERTIFICATION_FEES
              )
            )}

            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '0.15px',
                  verticalAlign: 'middle',
                }}
              >
                {getLabel(
                  MANUAL_PAYMENT_LABELS.SECTION_TITLES.NARRATION,
                  'EN',
                  MANUAL_PAYMENT_LABELS.FALLBACKS.SECTION_TITLES.NARRATION
                )}
              </Typography>
            </Grid>

            {renderTextField(
              'narration1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.NARRATION_1,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.NARRATION_1
              )
            )}
            {renderTextField(
              'narration2',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.NARRATION_2,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.NARRATION_2
              )
            )}
            {renderTextField(
              'remarks',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.REMARKS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.REMARKS
              ),
              12
            )}

            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '0.15px',
                  verticalAlign: 'middle',
                }}
              >
                {getLabel(
                  MANUAL_PAYMENT_LABELS.PAYMENT_TYPES.OTHERS,
                  'EN',
                  'Others'
                )}
              </Typography>
            </Grid>
            {/* 
            {renderTextField(
              'unitNo',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.UNIT_NO,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.UNIT_NO
              )
            )}
            {renderTextField(
              'towerName',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TOWER_NAME,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.TOWER_NAME
              )
            )}
            {renderTextField(
              'unitStatus',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.UNIT_STATUS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.UNIT_STATUS
              )
            )}
            {renderTextField(
              'amountReceived',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.AMOUNT_RECEIVED,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.AMOUNT_RECEIVED
              )
            )}
            {renderCheckboxField(
              'Forfeit',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.FORFEIT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.FORFEIT
              ),
              4
            )}
            {renderCheckboxField(
              'Refundtounitholder',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.REFUND_TO_UNIT_HOLDER,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .REFUND_TO_UNIT_HOLDER
              ),
              4
            )}
            {renderCheckboxField(
              'Transfertootherunit',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TRANSFER_TO_OTHER_UNIT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .TRANSFER_TO_OTHER_UNIT
              ),
              4
            )}
            {renderTextField(
              'forfeitAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.FORFEIT_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.FORFEIT_AMOUNT
              ),
              4
            )}
            {renderTextField(
              'regulatorApprovalRef',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.REGULATOR_APPROVAL_REF,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .REGULATOR_APPROVAL_REF
              ),
              4,
              '',
              false
            )} */}
            {renderDatePickerField(
              'paymentDate',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.REGULATOR_APPROVAL_DATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .REGULATOR_APPROVAL_DATE
              ),
              4,
              false
            )}

            {renderSelectField(
              'bankCharges',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CHARGE_MODE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.CHARGE_MODE
              ),
              depositModes.data,
              6,
              true
            )}
            {renderSelectField(
              'paymentMode',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PAYMENT_MODE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PAYMENT_MODE
              ),
              paymentModes.data,
              6,
              false
            )}
            {renderSelectField(
              'engineerFeePayment',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.TRANSACTION_TYPE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.TRANSACTION_TYPE
              ),
              transferTypes.data,
              6,
              false
            )}
            {renderTextField(
              'uploadDocuments',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.AMOUNT_TO_BE_RELEASED,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .AMOUNT_TO_BE_RELEASED
              )
            )}
            {renderDatePickerField(
              'engineerFeePayment1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PAYMENT_DATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PAYMENT_DATE
              )
            )}
            {renderTextField(
              'uploadDocuments1',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.VAT_PAYMENT_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.VAT_PAYMENT_AMOUNT
              )
            )}
            {renderCheckboxField(
              'EngineerFeePaymentNeeded',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.ENGINEER_FEE_PAYMENT_NEEDED,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .ENGINEER_FEE_PAYMENT_NEEDED
              )
            )}
            {renderTextField(
              'EngineerFeesPayment',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.ENGINEER_FEES_PAYMENT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS
                  .ENGINEER_FEES_PAYMENT
              )
            )}
            {renderTextField(
              'engineerFeePayment2',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.BANK_CHARGES,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.BANK_CHARGES
              )
            )}
            {renderSelectField(
              'uploadDocuments2',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PAYMENT_FROM_CBS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PAYMENT_FROM_CBS
              ),
              boolYnOptions.data || [],
              6,
              true
            )}
            {/* BUDGET DETAILS START */}
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '0.15px',
                  verticalAlign: 'middle',
                }}
              >
                {getLabel(
                  MANUAL_PAYMENT_LABELS.SECTION_TITLES.BUDGET_DETAILS,
                  'EN',
                  MANUAL_PAYMENT_LABELS.FALLBACKS.SECTION_TITLES.BUDGET_DETAILS
                )}
              </Typography>
            </Grid>
            {renderSelectField(
              'budgetDetails',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.BUDGET_DETAILS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_DETAILS
              ),
              budgetOptions,
              6,
              false,
              loadingBudgets
            )}
            {renderSelectField(
              'budgetCategory',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.BUDGET_CATEGORY,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_CATEGORY
              ),
              budgetCategoryOptions,
              6,
              false,
              loadingBudgetCategories
            )}
            {renderSelectField(
              'budgetItems',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.BUDGET_ITEMS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_ITEMS
              ),
              budgetDetailsOptions,
              6,
              false,
              loadingBudgetDetails
            )}
            {renderTextField(
              'budgetSubCategory',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.BUDGET_SUB_CATEGORY,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_SUB_CATEGORY
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'budgetServiceName',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.BUDGET_SERVICE_NAME,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_SERVICE_NAME
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'categoryCode',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.CATEGORY_CODE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.CATEGORY_CODE
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'subCategoryCode',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.SUB_CATEGORY_CODE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.SUB_CATEGORY_CODE
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'serviceCode',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.SERVICE_CODE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.SERVICE_CODE
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'provisionalBudgetId',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PROVISIONAL_BUDGET_CODE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PROVISIONAL_BUDGET_CODE
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'availableBudgetAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.AVAILABLE_BUDGET_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.AVAILABLE_BUDGET_AMOUNT
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'utilizedBudgetAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.UTILIZED_BUDGET_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.UTILIZED_BUDGET_AMOUNT
              ),
              6,
              '',
              false,
              true
            )}
            {renderTextField(
              'invoiceBudgetAmount',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.INVOICE_BUDGET_AMOUNT,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.INVOICE_BUDGET_AMOUNT
              ),
              6,
              '',
              false,
              true
            )}
            {renderCheckboxField(
              'provisionalBudget',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.PROVISIONAL_BUDGET,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.PROVISIONAL_BUDGET
              ),
              3
            )}
            {renderCheckboxField(
              'hoaExemption',
              getLabel(
                MANUAL_PAYMENT_LABELS.FORM_FIELDS.HOA_EXEMPTION,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.FORM_FIELDS.HOA_EXEMPTION
              ),
              3
            )}
            {/* BUDGET DETAILS END */}
            {renderCheckboxField(
              'feDocVerified',
              'Please review the Surety Bond details and documents before submitting the payment. *',
              6
            )}
          </Grid>
        </CardContent>
      </Card>
    </LocalizationProvider>
  )
}

export default Step1
