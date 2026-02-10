'use client'

import dynamic from 'next/dynamic'
import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { PermissionAwareDataTable } from '@/components/organisms/PermissionAwareDataTable'
import { PageActionButtons } from '@/components/molecules/PageActionButtons'
import { useTableState } from '@/hooks/useTableState'
import { useBudgetCategories } from '@/hooks/budget/useBudgetCategory'
import { useDeleteBudgetCategory } from '@/hooks/budget/useBudgetCategory'
import { useBudgetLabelsWithCache } from '@/hooks/budget/useBudgetCategoryLabelsWithCache'
import { getBudgetLabel } from '@/constants/mappings/budgetLabels'
import { useAppStore } from '@/store'
import { GlobalLoading } from '@/components/atoms'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import type { BudgetCategoryUIData } from '@/services/api/budgetApi/budgetCategoryService'
import { useSidebarConfig } from '@/hooks/useSidebarConfig'

const BudgetPageClient = dynamic(() => Promise.resolve(BudgetPageImpl), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
      <GlobalLoading fullHeight />
    </div>
  ),
})

interface BudgetTableRow extends BudgetCategoryUIData, Record<string, unknown> {
  id: number
}

const EMPTY_PLACEHOLDER = '-'

const emptyToPlaceholder = (value: unknown): string => {
  if (value == null) return EMPTY_PLACEHOLDER
  const s = String(value).trim()
  return s === '' ? EMPTY_PLACEHOLDER : s
}

const transformToTableRow = (item: BudgetCategoryUIData): BudgetTableRow => ({
  ...item,
  id: item.id,
  chargeType: emptyToPlaceholder(item.chargeType),
  serviceChargeGroupName: emptyToPlaceholder(item.serviceChargeGroupName),
  categoryName: emptyToPlaceholder(item.categoryName),
  serviceName: emptyToPlaceholder(item.serviceName),
  provisionalBudgetCode: emptyToPlaceholder(item.provisionalBudgetCode),
})

const ErrorMessage: React.FC<{ error: Error; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800/80 rounded-2xl px-4">
    <div className="w-full max-w-md text-center">
      <div className="mb-8">
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full dark:bg-red-900/30">
          <svg
            className="w-12 h-12 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Failed to load budget categories
        </h1>
        <p className="mb-4 text-gray-600 break-words whitespace-pre-wrap dark:text-gray-400">
          {error.message || 'An error occurred while loading the data. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
)

function BudgetPageImpl() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const currentLanguage = useAppStore((state) => state.language) ?? 'EN'

  const { data: apiResponse, isLoading, error, refetch } = useBudgetCategories(0, 1000)
  const deleteMutation = useDeleteBudgetCategory()
  const confirmDelete = useDeleteConfirmation()
  const { getLabel } = useBudgetLabelsWithCache()
  const { getLabelResolver } = useSidebarConfig()
  const BudgetPageTitle = getLabelResolver
  ? getLabelResolver('CDL_BDG_PAGE_TITLE', 'Budget Categories')
  : 'Budget Categories'

  const budgetData = useMemo(() => {
    if (apiResponse?.content) {
      return apiResponse.content.map(transformToTableRow) as BudgetTableRow[]
    }
    return []
  }, [apiResponse])

  const getLabelDynamic = useCallback(
    (configId: string): string => {
      const fallback = getBudgetLabel(configId)
      return getLabel(configId, currentLanguage, fallback)
    },
    [currentLanguage, getLabel]
  )

  const tableColumns = [
    {
      key: 'chargeType',
      label: getLabelDynamic('CDL_BDG_LIST_TABLE_CHARGE_TYPE'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'serviceChargeGroupName',
      label: getLabelDynamic('CDL_BDG_LIST_TABLE_GROUP_NAME'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'categoryName',
      label: getLabelDynamic('CDL_BDG_LIST_TABLE_CATEGORY_NAME'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'serviceName',
      label: getLabelDynamic('CDL_BDG_LIST_TABLE_SERVICE_NAME'),
      type: 'text' as const,
      width: 'w-56',
      sortable: true,
    },
    {
      key: 'provisionalBudgetCode',
      label: getLabelDynamic('CDL_BDG_LIST_TABLE_PROVISIONAL_CODE'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'actions',
      label: getLabelDynamic('CDL_BDG_LIST_TABLE_ACTIONS'),
      type: 'actions' as const,
      width: 'w-20',
    },
  ]

  const {
    search,
    paginated,
    totalRows,
    totalPages,
    startItem,
    endItem,
    page,
    rowsPerPage,
    handleSearchChange,
    handlePageChange,
    handleRowsPerPageChange,
    selectedRows,
    expandedRows,
    handleRowSelectionChange,
    handleRowExpansionChange,
    handleSort,
    sortConfig,
  } = useTableState({
    data: budgetData,
    searchFields: [
      'chargeType',
      'serviceChargeGroupName',
      'categoryName',
      'serviceName',
      'provisionalBudgetCode',
    ],
    initialRowsPerPage: 20,
  })

  const handleRowDelete = (row: BudgetTableRow) => {
    if (isDeleting) return
    confirmDelete({
      itemName: `budget category: ${row.categoryName} - ${row.serviceName}`,
      itemId: row.id.toString(),
      onConfirm: async () => {
        try {
          setIsDeleting(true)
          await deleteMutation.mutateAsync(row.id)
          refetch()
        } catch (err) {
          throw err
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const handleRowView = (row: BudgetTableRow) => {
    router.push(`/budgets/budget/${row.id}/step/1?mode=view`)
  }

  const handleRowEdit = (row: BudgetTableRow) => {
    router.push(`/budgets/budget/${row.id}/step/1?editing=true`)
  }

  const handleAddNew = () => {
    router.push('/budgets/budget/new')
  }

  const pageTitle = getLabelDynamic('CDL_BDG_PAGE_TITLE')
  const pageSubtitle = getLabelDynamic('CDL_BDG_PAGE_SUBTITLE')
  const newButtonLabel = getLabelDynamic('CDL_BDG_LIST_NEW_BUTTON')
  const emptyStateLabel = getLabelDynamic('CDL_BDG_LIST_EMPTY_STATE')

  return (
    <DashboardLayout title={BudgetPageTitle}>
      <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
        {isLoading ? (
          <GlobalLoading fullHeight />
        ) : error ? (
          <ErrorMessage error={error as Error} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/75 dark:bg-gray-800/80 dark:border-gray-700 rounded-t-2xl">
              <PageActionButtons
                entityType="developer"
                showButtons={{
                  addNew: true,
                  uploadDetails: false,
                  downloadTemplate: false,
                }}
                customActionButtons={[
                  {
                    label: newButtonLabel,
                    onClick: handleAddNew,
                  },
                ]}
              />
            </div>
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-auto">
                {budgetData.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
                    {emptyStateLabel}
                  </div>
                ) : (
                  <PermissionAwareDataTable<BudgetTableRow>
                    data={paginated}
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
                    onRowDelete={handleRowDelete}
                    onRowView={handleRowView}
                    onRowEdit={handleRowEdit}
                    deletePermissions={['*']}
                    viewPermissions={['*']}
                    editPermissions={['*']}
                    updatePermissions={['*']}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function BudgetPage() {
  return <BudgetPageClient />
}
