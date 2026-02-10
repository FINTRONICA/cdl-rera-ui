'use client'

import dynamic from 'next/dynamic'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { PermissionAwareDataTable } from '@/components/organisms/PermissionAwareDataTable'
import { PageActionButtons } from '@/components/molecules/PageActionButtons'
import { useTableState } from '@/hooks/useTableState'
import {
  useBudgetManagement,
  useDeleteBudgetManagement,
} from '@/hooks/budget/useBudgetManagement'
import { useBudgetManagementLabelsWithCache as useBudgetManagementFirmLabelsApi } from '@/hooks/budget/useBudgetManagementLabelsWithCache'
import { useAppStore } from '@/store'
import { GlobalLoading } from '@/components/atoms'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import type { BudgetUIData } from '@/services/api/budgetApi/budgetManagementService'
import { useSidebarConfig } from '@/hooks/useSidebarConfig'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'

const BudgetFirmPageClient = dynamic(() => Promise.resolve(BudgetFirmPageImpl), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
      <GlobalLoading fullHeight />
    </div>
  ),
})

interface BudgetFirmTableRow extends Omit<BudgetUIData, 'totalCostDisplay'>, Record<string, unknown> {
  id: number
  totalCostDisplay?: number | string
}

const EMPTY_PLACEHOLDER = '-'

const emptyToPlaceholder = (value: unknown): string => {
  if (value == null) return EMPTY_PLACEHOLDER
  const s = String(value).trim()
  return s === '' ? EMPTY_PLACEHOLDER : s
}

const transformToTableRow = (item: BudgetUIData): BudgetFirmTableRow => ({
  ...item,
  id: item.id,
  managementFirmGroupName: emptyToPlaceholder(item.managementFirmGroupName),
  budgetPeriodRange: emptyToPlaceholder(item.budgetPeriodRange),
  managementCompanyName: emptyToPlaceholder(item.managementCompanyName),
  serviceChargeGroupName: emptyToPlaceholder(item.serviceChargeGroupName),
  totalCostDisplay: item.totalCostDisplay ?? EMPTY_PLACEHOLDER,
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
          Failed to load budgets
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

function BudgetFirmPageImpl() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const currentLanguage = useAppStore((state) => state.language) ?? 'EN'

  const { data: apiResponse, isLoading, error, refetch } = useBudgetManagement(0, 1000)
  const deleteMutation = useDeleteBudgetManagement()
  const confirmDelete = useDeleteConfirmation()
  const { getLabel } = useBudgetManagementFirmLabelsApi()
  const { getLabelResolver } = useSidebarConfig()
  const BudgetFirmPageTitle = getLabelResolver
    ? getLabelResolver('budget-management-firm', 'Budget Management Firm')
    : 'Budget Management Firm'

  const budgetData = useMemo(() => {
    if (apiResponse?.content) {
      return apiResponse.content.map(transformToTableRow) as BudgetFirmTableRow[]
    }
    return []
  }, [apiResponse])

  const F = BUDGET_MANAGEMENT_FIRM_LABELS.LIST.TABLE_HEADERS
  const Fb = BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.LIST.TABLE_HEADERS
  const Ff = BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS
  const FfFallback = BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS

  const tableColumns = [
    {
      key: 'managementFirmGroupName',
      label: getLabel(F.MANAGEMENT_FIRM, currentLanguage, Fb.MANAGEMENT_FIRM),
      type: 'text' as const,
      width: 'w-56',
      sortable: true,
    },
    {
      key: 'budgetPeriodRange',
      label: getLabel(F.BUDGET_PERIOD, currentLanguage, Fb.BUDGET_PERIOD),
      type: 'text' as const,
      width: 'w-44',
    },
    {
      key: 'managementCompanyName',
      label: getLabel(Ff.MANAGEMENT_COMPANY_NAME, currentLanguage, FfFallback.MANAGEMENT_COMPANY_NAME),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'serviceChargeGroupName',
      label: getLabel(Ff.SERVICE_CHARGE_GROUP_NAME, currentLanguage, FfFallback.SERVICE_CHARGE_GROUP_NAME),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'totalCostDisplay',
      label: getLabel(F.TOTAL_COST, currentLanguage, Fb.TOTAL_COST),
      type: 'text' as const,
      width: 'w-36',
      sortable: true,
    },
    {
      key: 'actions',
      label: getLabel(F.ACTIONS, currentLanguage, Fb.ACTIONS),
      type: 'actions' as const,
      width: 'w-26',
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
      'managementFirmGroupName',
      'budgetPeriodRange',
      'managementCompanyName',
      'serviceChargeGroupName',
      'budgetName',
      'budgetId',
    ],
    initialRowsPerPage: 20,
  })

  const handleRowDelete = (row: BudgetFirmTableRow) => {
    if (isDeleting) return
    if (!row.id) {
      alert('Cannot delete: No ID found for this budget')
      return
    }
    confirmDelete({
      itemName: `budget: ${row.budgetName || row.budgetId}`,
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

  const handleRowView = (row: BudgetFirmTableRow) => {
    router.push(`/budgets/budge-firm/${row.id}/step/1?mode=view`)
  }

  const handleRowEdit = (row: BudgetFirmTableRow) => {
    router.push(`/budgets/budge-firm/${row.id}/step/1?editing=true`)
  }

  const handleAddNew = () => {
    router.push('/budgets/budge-firm/new')
  }

  const newButtonLabel = getLabel(
    BUDGET_MANAGEMENT_FIRM_LABELS.LIST.NEW_BUTTON,
    currentLanguage,
    BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.LIST.NEW_BUTTON
  )
  const emptyStateLabel = getLabel(
    BUDGET_MANAGEMENT_FIRM_LABELS.LIST.EMPTY_STATE,
    currentLanguage,
    BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.LIST.EMPTY_STATE
  )

  const renderExpandedContent = (row: BudgetFirmTableRow) => (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {getLabel(
            BUDGET_MANAGEMENT_FIRM_LABELS.SECTION_TITLES.GENERAL,
            currentLanguage,
            BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.SECTION_TITLES.GENERAL
          )}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {String(
                getLabel(
                  BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.BUDGET_PERIOD_CODE,
                  currentLanguage,
                  BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_PERIOD_CODE
                )
              )}
              :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">{String(row.budgetPeriodCode ?? 'N/A')}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {String(
                getLabel(
                  BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.MASTER_COMMUNITY_NAME,
                  currentLanguage,
                  BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS.MASTER_COMMUNITY_NAME
                )
              )}
              :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">{String(row.masterCommunityName ?? 'N/A')}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {String(
                getLabel(
                  BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.MANAGEMENT_FIRM_MANAGER_EMAIL,
                  currentLanguage,
                  BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS.MANAGEMENT_FIRM_MANAGER_EMAIL
                )
              )}
              :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">{String(row.propertyManagerEmail ?? 'N/A')}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {String(
                getLabel(
                  BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME,
                  currentLanguage,
                  BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME
                )
              )}
              :
            </span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">{String(row.serviceChargeGroupName ?? 'N/A')}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Budget Details
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Budget ID:</span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">{String(row.budgetId ?? 'N/A')}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">{String(row.totalCostDisplay ?? 'N/A')}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout title={BudgetFirmPageTitle}>
      <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
        {isLoading ? (
          <GlobalLoading fullHeight />
        ) : error ? (
          <ErrorMessage error={error as Error} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white/75 dark:bg-gray-800/80 rounded-t-2xl">
              <PageActionButtons
                entityType="budgetFirm"
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
                  <PermissionAwareDataTable<BudgetFirmTableRow>
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
                    renderExpandedContent={renderExpandedContent}
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

export default function BudgetFirmPage() {
  return <BudgetFirmPageClient />
}
