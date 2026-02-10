'use client'

import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Box, Card, CardContent, Button } from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { useFormContext } from 'react-hook-form'
import { RightSlideBudgetItemPanel } from '../../../RightSlidePanel/RightSlideBudgetItemPanel'
import { ExpandableDataTable } from '../../../ExpandableDataTable'
import { useTableState } from '@/hooks'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import { 
  useBudgetItems, 
  useDeleteBudgetItem 
} from '@/hooks/budget/useBudgetItems'
import { budgetItemsService } from '@/services/api/budgetApi/budgetItemsService'
import { useBudgetManagementFirmLabelsApi } from '@/hooks/useBudgetManagementFirmLabelsWithCache'
import { useAppStore } from '@/store'
import { BudgetStep2Schema } from '@/lib/validation/budgetSchemas'
import type { BudgetItemResponse } from '@/utils/budgetMapper'

interface Step2Props {
  onSaveAndNext?: () => void
  budgetId?: number | null
  isEditMode?: boolean
  isViewMode?: boolean
}

export interface Step2Ref {
  handleSaveAndNext: () => Promise<void>
}

type BudgetItemTableRow = {
  id: number | string | null
  subCategoryCode: string
  subCategoryName: string
  subCategoryNameLocale: string
  serviceCode: string
  provisionalServiceCode: string
  serviceName: string
  serviceNameLocale: string
  totalBudget: number | string
  availableBudget: number | string
  utilizedBudget: number | string
}

const Step2 = forwardRef<Step2Ref, Step2Props>(
  (
    { onSaveAndNext, budgetId, isViewMode = false },
    ref
  ) => {
    const {
      watch,
      setValue,
      setError,
      clearErrors,
    } = useFormContext()

    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [editMode, setEditMode] = useState<'add' | 'edit'>('add')
    const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItemResponse | null>(null)
    const [selectedBudgetItemIndex, setSelectedBudgetItemIndex] = useState<number | null>(null)

    const confirmDelete = useDeleteConfirmation()
    const deleteMutation = useDeleteBudgetItem()
    const { getLabel } = useBudgetManagementFirmLabelsApi()
    const currentLanguage = useAppStore((state) => state.language) || 'EN'

    // ✅ FIX: Only budgetId is needed for filtering (budgetCategoryId is deprecated for API, but still needed for form)
    const effectiveBudgetId = budgetId
    const budgetCategoryId = watch('budgetCategoryId') // Still needed for RightSlideBudgetItemPanel form

    // Use React Query hook to fetch budget items by budgetId only
    const {
      data: apiBudgetItemsResponse,
      refetch: refetchBudgetItems,
      isLoading: isLoadingBudgetItems,
      isFetching: isFetchingBudgetItems,
      error: budgetItemsError,
    } = useBudgetItems(null, effectiveBudgetId, 0, 1000) // budgetCategoryId is deprecated, pass null

    // Debug logging
    useEffect(() => {
      console.log('[Step2] ===== Budget Items Query State =====')
      console.log('[Step2] budgetCategoryId:', budgetCategoryId, 'Type:', typeof budgetCategoryId)
      console.log('[Step2] effectiveBudgetId:', effectiveBudgetId)
      console.log('[Step2] isLoading:', isLoadingBudgetItems)
      console.log('[Step2] isFetching:', isFetchingBudgetItems)
      console.log('[Step2] hasData:', !!apiBudgetItemsResponse)
      console.log('[Step2] data:', apiBudgetItemsResponse)
      console.log('[Step2] itemsCount:', apiBudgetItemsResponse?.content?.length || 0)
      console.log('[Step2] error:', budgetItemsError)
    }, [budgetCategoryId, effectiveBudgetId, isLoadingBudgetItems, isFetchingBudgetItems, apiBudgetItemsResponse, budgetItemsError])

    // ✅ FIX: Force refetch when budgetId becomes available or changes (budgetCategoryId is no longer needed)
    useEffect(() => {
      const isValid = effectiveBudgetId && !isNaN(effectiveBudgetId) && effectiveBudgetId > 0
      
      console.log('[Step2] ===== Checking if query should run =====')
      console.log('[Step2] effectiveBudgetId:', effectiveBudgetId, 'isValid:', isValid)
      console.log('[Step2] isLoading:', isLoadingBudgetItems, 'isFetching:', isFetchingBudgetItems)
      console.log('[Step2] hasData:', !!apiBudgetItemsResponse)
      console.log('[Step2] itemsCount:', apiBudgetItemsResponse?.content?.length || 0)
      
      if (isValid) {
        // Always refetch when budgetId is valid to ensure we have latest data
        // This is especially important after POST/PUT/DELETE operations
        console.log('[Step2] ✅ budgetId is valid, triggering refetch to get latest data...')
        const timer = setTimeout(() => {
          refetchBudgetItems().then((result) => {
            console.log('[Step2] ✅ Refetch completed:', result.data?.content?.length || 0, 'items')
            console.log('[Step2] Refetch result:', result.data)
          }).catch((error) => {
            console.error('[Step2] ❌ Refetch error:', error)
          })
        }, 300) // Increased delay to ensure backend has processed
        return () => clearTimeout(timer)
      }
      console.log('[Step2] ⚠️ budgetId is not valid, query will not run')
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveBudgetId, refetchBudgetItems])

    // ✅ FIX: Extract items from API response (budgetCategoryId is no longer needed for filtering)
    const items: BudgetItemResponse[] = useMemo(() => {
      console.log('[Step2] ===== Extracting Items =====')
      console.log('[Step2] apiBudgetItemsResponse:', apiBudgetItemsResponse)
      
      if (apiBudgetItemsResponse?.content && apiBudgetItemsResponse.content.length > 0) {
        console.log('[Step2] ✅ Using API response data:', apiBudgetItemsResponse.content.length, 'items')
        
        // Update form with fetched items
        setValue('budgetItems', apiBudgetItemsResponse.content)
        return apiBudgetItemsResponse.content
      }
      // Fallback to form data if no API response
      const formItems = watch('budgetItems') || []
      console.log('[Step2] ⚠️ Using form data (fallback):', formItems.length, 'items')
      return formItems
    }, [apiBudgetItemsResponse, setValue, watch])

    const handleSaveAndNext = useCallback(async () => {
      try {
        // Get form values
        const currentBudgetCategoryId = watch('budgetCategoryId')
        const currentBudgetItems = watch('budgetItems') || []

        // Validate with Zod first
        const formValues = {
          budgetCategoryId: currentBudgetCategoryId,
          budgetItems: currentBudgetItems || [],
        }

        const zodResult = BudgetStep2Schema.safeParse(formValues)
        
          if (!zodResult.success) {
          // Clear all errors first
          const fieldsToValidate: string[] = ['budgetCategoryId']
          currentBudgetItems.forEach((_: unknown, index: number) => {
            fieldsToValidate.push(`budgetItems.${index}.subCategoryCode`)
            fieldsToValidate.push(`budgetItems.${index}.subCategoryName`)
            fieldsToValidate.push(`budgetItems.${index}.serviceCode`)
            fieldsToValidate.push(`budgetItems.${index}.serviceName`)
            fieldsToValidate.push(`budgetItems.${index}.totalBudget`)
          })
          
          clearErrors(fieldsToValidate as unknown as string[])
          
          // Set errors from Zod validation
            zodResult.error.issues.forEach((issue) => {
            const path = issue.path || []
            const fieldPath = path.join('.')
            if (fieldPath) {
              setError(fieldPath as never, {
                  type: 'manual',
                  message: issue.message,
                })
              }
            })
          
          throw new Error('Please fill all required fields correctly')
        }
        
        // If validation passes, proceed to next step
        // Budget items are already saved when created/updated via the panel
        if (onSaveAndNext) {
          onSaveAndNext()
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save budget items'
        throw new Error(errorMessage)
      }
    }, [watch, setError, clearErrors, onSaveAndNext])

    useImperativeHandle(
      ref,
      () => ({
        handleSaveAndNext,
      }),
      [handleSaveAndNext]
    )

    const tableRows: BudgetItemTableRow[] = useMemo(
      () =>
        items.map((item) => ({
          id: item.id ?? null,
          subCategoryCode: item.subCategoryCode || '',
          subCategoryName: item.subCategoryName || '',
          subCategoryNameLocale: item.subCategoryNameLocale || '',
          serviceCode: item.serviceCode || '',
          provisionalServiceCode: item.provisionalServiceCode || '',
          serviceName: item.serviceName || '',
          serviceNameLocale: item.serviceNameLocale || '',
          totalBudget: item.totalBudget ?? 0,
          availableBudget: item.availableBudget ?? 0,
          utilizedBudget: item.utilizedBudget ?? 0,
        })),
      [items]
    )

    const addBudgetItem = () => {
      setEditMode('add')
      setSelectedBudgetItem(null)
      setSelectedBudgetItemIndex(null)
      setIsPanelOpen(true)
    }

    const handleBudgetItemAdded = async (newItem: BudgetItemResponse) => {
      console.log('[Step2] ===== handleBudgetItemAdded =====')
      console.log('[Step2] New item:', newItem)
      console.log('[Step2] New item budgetId:', newItem.budgetDTO?.id)
      console.log('[Step2] effectiveBudgetId:', effectiveBudgetId)
      
      // ✅ FIX: Get budgetId from response (now the primary filter)
      const responseBudgetId = newItem.budgetDTO?.id
      const budgetIdToUse = responseBudgetId || effectiveBudgetId
      
      console.log('[Step2] budgetIdToUse (final):', budgetIdToUse)
      
      if (budgetIdToUse) {
        console.log('[Step2] ✅ Refetching budget items after POST...')
        // Wait for backend to process and mutation to invalidate cache
        await new Promise(resolve => setTimeout(resolve, 1200))
        
        // Force refetch - this will work even if query was disabled
        try {
          // First try React Query refetch
          const result = await refetchBudgetItems()
          console.log('[Step2] ✅ React Query refetch completed:', result.data?.content?.length || 0, 'items')
          console.log('[Step2] Refetch result data:', result.data)
          
          // If refetch didn't work or returned empty, try direct API call
          if (!result.data || !result.data.content || result.data.content.length === 0) {
            console.log('[Step2] ⚠️ React Query refetch returned empty, trying direct API call...')
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // ✅ FIX: Direct API call using budgetId (not categoryId)
            const budgetIdNum = typeof budgetIdToUse === 'string' 
              ? parseInt(budgetIdToUse) 
              : budgetIdToUse
            const directResult = await budgetItemsService.getBudgetItemsByBudgetCategoryId(
              0, // categoryId is deprecated, pass dummy value
              0,
              1000,
              budgetIdNum
            )
            console.log('[Step2] ✅ Direct API call completed:', directResult.content?.length || 0, 'items')
            
            if (directResult.content && directResult.content.length > 0) {
              // Update form with direct API result
              setValue('budgetItems', directResult.content)
              console.log('[Step2] ✅ Updated form with direct API result')
            } else {
              // If still empty, try React Query refetch one more time
              console.log('[Step2] ⚠️ Direct API also returned empty, trying React Query refetch again...')
              await new Promise(resolve => setTimeout(resolve, 1000))
              const retryResult = await refetchBudgetItems()
              console.log('[Step2] ✅ Retry refetch completed:', retryResult.data?.content?.length || 0, 'items')
            }
          }
        } catch (error) {
          console.error('[Step2] ❌ Refetch error:', error)
          // Fallback: add item to local state
          const existing = items || []
          const updatedItems = [...existing, newItem]
          setValue('budgetItems', updatedItems)
        }
      } else {
        console.log('[Step2] ⚠️ No budgetId available, updating form state (fallback)')
        // If no budgetId, update form state
        const existing = items || []
        const existingIndex = existing.findIndex((item) => item.id === newItem.id)
        const updatedItems =
          existingIndex === -1
            ? [...existing, newItem]
            : existing.map((item, idx) => (idx === existingIndex ? newItem : item))
        setValue('budgetItems', updatedItems)
      }
    }

    const handleBudgetItemUpdated = async (updatedItem: BudgetItemResponse, index: number) => {
      // ✅ FIX: Refetch budget items from API using React Query (using budgetId, not budgetCategoryId)
      // The mutation hook already invalidates the cache, but we can also manually refetch
      if (effectiveBudgetId) {
        // Small delay to ensure backend has processed the update
        await new Promise(resolve => setTimeout(resolve, 500))
        await refetchBudgetItems()
      } else {
        // If no budgetId, update form state
        const updatedItems = [...(items || [])]
        const existingIndex = updatedItems.findIndex((item) => item.id === updatedItem.id)
        if (existingIndex !== -1) {
          updatedItems[existingIndex] = updatedItem
        } else if (index >= 0 && index < updatedItems.length) {
          updatedItems[index] = updatedItem
        } else {
          updatedItems.push(updatedItem)
        }
        setValue('budgetItems', updatedItems)
      }
    }

    const handleEdit = (row: BudgetItemTableRow, index: number) => {
      const item = items.find((item) => item.id === row.id) || null
      setEditMode('edit')
      setSelectedBudgetItem(item)
      setSelectedBudgetItemIndex(index)
      setIsPanelOpen(true)
    }

    const handleDelete = (row: BudgetItemTableRow, indexToRemove: number) => {
      confirmDelete({
        itemName: `budget item: ${row.serviceName || row.subCategoryName || 'N/A'}`,
        onConfirm: async () => {
          try {
            const itemId = row.id
            if (itemId && typeof itemId === 'number') {
              await deleteMutation.mutateAsync(itemId)
            }

            // React Query will automatically refetch after mutation
            // But we can also manually refetch if needed
            if (budgetCategoryId) {
              await refetchBudgetItems()
            } else {
              // If no budgetCategoryId, update form state
              const updatedItems = (items || []).filter((item, idx) =>
                itemId !== null && itemId !== undefined
                  ? item.id !== itemId
                  : idx !== indexToRemove
              )
              setValue('budgetItems', updatedItems)
            }
          } catch (error) {
            throw error
          }
        },
      })
    }

    const handleClosePanel = () => {
      setIsPanelOpen(false)
      setEditMode('add')
      setSelectedBudgetItem(null)
      setSelectedBudgetItemIndex(null)
    }

    const tableColumns = [
      {
        key: 'subCategoryCode',
        label: getLabel('CDL_BDG_SUB_CATEGORY_CODE', currentLanguage, 'Sub-Category Code'),
        type: 'text' as const,
        width: 'w-32',
        sortable: true,
      },
      {
        key: 'subCategoryName',
        label: getLabel('CDL_BDG_SUB_CATEGORY_NAME', currentLanguage, 'Sub-Category Name'),
        type: 'text' as const,
        width: 'w-40',
        sortable: true,
      },
      {
        key: 'subCategoryNameLocale',
        label: getLabel('CDL_BDG_SUB_CATEGORY_NAME_LOCALE', currentLanguage, 'Sub-Category Name (Local)'),
        type: 'text' as const,
        width: 'w-40',
        sortable: true,
      },
      {
        key: 'serviceCode',
        label: getLabel('CDL_BDG_SERVICE_CODE', currentLanguage, 'Service Code'),
        type: 'text' as const,
        width: 'w-32',
        sortable: true,
      },
      {
        key: 'provisionalServiceCode',
        label: getLabel('CDL_BDG_PROVISIONAL_SERVICE_CODE', currentLanguage, 'Provisional Service Code'),
        type: 'text' as const,
        width: 'w-40',
        sortable: true,
      },
      {
        key: 'serviceName',
        label: getLabel('CDL_BDG_SERVICE_NAME', currentLanguage, 'Service Name'),
        type: 'text' as const,
        width: 'w-40',
        sortable: true,
      },
      {
        key: 'serviceNameLocale',
        label: getLabel('CDL_BDG_SERVICE_NAME_LOCALE', currentLanguage, 'Service Name (Local)'),
        type: 'text' as const,
        width: 'w-40',
        sortable: true,
      },
      {
        key: 'totalBudget',
        label: getLabel('CDL_BDG_TOTAL_BUDGET', currentLanguage, 'Total Budget'),
        type: 'text' as const,
        width: 'w-28',
        sortable: true,
      },
      {
        key: 'availableBudget',
        label: getLabel('CDL_BDG_AVAILABLE_BUDGET', currentLanguage, 'Available Budget'),
        type: 'text' as const,
        width: 'w-28',
        sortable: true,
      },
      {
        key: 'utilizedBudget',
        label: getLabel('CDL_BDG_UTILIZED_BUDGET', currentLanguage, 'Utilized Budget'),
        type: 'text' as const,
        width: 'w-28',
        sortable: true,
      },
      ...(isViewMode
        ? []
        : [
            {
              key: 'actions',
              label: 'Action',
              type: 'actions' as const,
              width: 'w-20',
            },
          ]),
    ]

    const {
      search,
      paginated,
      startItem,
      endItem,
      page,
      rowsPerPage,
      totalRows,
      totalPages,
      selectedRows,
      expandedRows,
      handleSearchChange,
      handlePageChange,
      handleRowsPerPageChange,
      handleRowSelectionChange,
      handleRowExpansionChange,
    } = useTableState<BudgetItemTableRow>({
      data: tableRows,
      searchFields: [
        'subCategoryCode',
        'subCategoryName',
        'subCategoryNameLocale',
        'serviceCode',
        'provisionalServiceCode',
        'serviceName',
        'serviceNameLocale',
      ],
      initialRowsPerPage: 20,
    })

      return (
        <Card
                  sx={{
            boxShadow: 'none',
            backgroundColor: '#FFFFFFBF',
          width: '94%',
            margin: '0 auto',
          }}
        >
          <CardContent>
          <Box display="flex" justifyContent="end" alignItems="center" mb={4}>
                {!isViewMode && (
                  <Button
                    variant="outlined"
                startIcon={<AddCircleOutlineOutlinedIcon />}
                    onClick={addBudgetItem}
                    sx={{
                  borderRadius: '8px',
                      textTransform: 'none',
                  boxShadow: 'none',
                    fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                    fontStyle: 'normal',
                  fontSize: '16px',
                    lineHeight: '24px',
                    letterSpacing: '0.5px',
                    verticalAlign: 'middle',
                }}
              >
                {getLabel('CDL_BDG_ADD_BUDGET_ITEM', currentLanguage, 'Add Budget Item')}
                  </Button>
                )}
              </Box>
          <ExpandableDataTable<BudgetItemTableRow>
            data={paginated as BudgetItemTableRow[]}
            columns={tableColumns}
            searchState={search}
            onSearchChange={handleSearchChange}
            paginationState={{
              page,
              rowsPerPage,
              totalRows,
              totalPages,
              startItem,
              endItem,
            }}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            selectedRows={selectedRows}
            onRowSelectionChange={handleRowSelectionChange}
            expandedRows={expandedRows}
            onRowExpansionChange={handleRowExpansionChange}
            {...(!isViewMode && {
              onRowEdit: handleEdit,
              onRowDelete: handleDelete,
            })}
            showEditAction={!isViewMode}
            showDeleteAction={!isViewMode}
            showViewAction={false}
          />
          </CardContent>
        <RightSlideBudgetItemPanel
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          onBudgetItemAdded={handleBudgetItemAdded}
          onBudgetItemUpdated={handleBudgetItemUpdated}
          budgetCategoryId={budgetCategoryId}
          budgetId={effectiveBudgetId ?? null}
          mode={editMode}
          {...(selectedBudgetItem && { budgetItemData: selectedBudgetItem })}
          {...(selectedBudgetItemIndex !== null && {
            budgetItemIndex: selectedBudgetItemIndex,
          })}
        />
        </Card>
    )
  }
)

Step2.displayName = 'Step2'

export default Step2
