'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '../../../components/templates/DashboardLayout'
import { useTableState } from '../../../hooks/useTableState'
import LeftSlidePanel from '@/components/organisms/LeftSlidePanel/LeftSlidePanel'
import { useTasPayments, FundEgressData } from '@/hooks/useFundEgress'
import { useSidebarConfig } from '@/hooks/useSidebarConfig'
import { useManualPaymentLabelsWithCache } from '@/hooks/useManualPaymentLabelsWithCache'
import { MANUAL_PAYMENT_LABELS } from '@/constants/mappings/manualPaymentLabels'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import { PermissionAwareDataTable } from '@/components/organisms/PermissionAwareDataTable/PermissionAwareDataTable'
import { GlobalLoading, GlobalError } from '@/components/atoms'

// Define the manual payment data structure
interface ManualPaymentData extends Record<string, unknown> {
  id: number
  date: string
  takermsPaymentRefNo: string
  assetRegisterName: string
  managementFirmName: string
  paymentType: string
  approvalStatus: string
}

// Transform FundEgressData to ManualPaymentData for UI display
const transformFundEgressToTasPayment = (
  fundEgress: FundEgressData
): ManualPaymentData => {
  const mapApiStatus = (taskStatusDTO: any | null): string => {
    if (!taskStatusDTO) {
      return 'INITIATED'
    }

    // Use the code from taskStatusDTO directly as it matches our new status options
    return taskStatusDTO.code || 'INITIATED'
  }

  return {
    id: fundEgress.id || 0,
    date: fundEgress.fePaymentDate
      ? new Date(fundEgress.fePaymentDate).toLocaleDateString('en-GB')
      : 'N/A',
    takermsPaymentRefNo: fundEgress.fePaymentRefNumber || 'N/A',
    assetRegisterName: fundEgress.assetRegisterDTO?.arName || 'N/A',
    managementFirmName: fundEgress.managementFirmDTO?.mfName || 'N/A',
    paymentType: fundEgress.voucherPaymentTypeDTO?.name || 'N/A',
    approvalStatus: mapApiStatus(fundEgress.taskStatusDTO),
  }
}

const statusOptions = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'DRAFT',
  'INITIATED',
]

const createTableColumns = (
  getLabel: (configId: string, language?: string, fallback?: string) => string
) => [
  {
    key: 'date',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.DATE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.DATE
    ),
    type: 'text' as const,
    width: 'w-32',
    sortable: true,
  },
  {
    key: 'takermsPaymentRefNo',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.EMS_REF,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.EMS_REF
    ),
    type: 'text' as const,
    width: 'w-48',
    sortable: true,
  },
  {
    key: 'assetRegisterName',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.ASSET_REGISTER_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.ASSET_REGISTER_NAME
    ),
    type: 'text' as const,
    width: 'w-48',
    sortable: true,
  },
  {
    key: 'managementFirmName',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.MANAGEMENT_FIRM_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.MANAGEMENT_FIRM_NAME
    ),
    type: 'text' as const,
    width: 'w-48',
    sortable: true,
  },
  {
    key: 'paymentType',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.PAYMENT_TYPE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.PAYMENT_TYPE
    ),
    type: 'text' as const,
    width: 'w-48',
    sortable: true,
  },
  {
    key: 'approvalStatus',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.APPROVAL_STATUS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.APPROVAL_STATUS
    ),
    type: 'status' as const,
    width: 'w-40',
    sortable: true,
  },
  {
    key: 'actions',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.ACTIONS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.ACTIONS
    ),
    type: 'actions' as const,
    width: 'w-20',
  },
]

const TASPaymentPage: React.FC = () => {
  const router = useRouter()
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const confirmDelete = useDeleteConfirmation()
  const { getLabelResolver } = useSidebarConfig()
  const tasPaymentTitle = getLabelResolver
    ? getLabelResolver('tas', 'TAS Payments')
    : 'TAS Payment'

  // Use translation hook for TAS payment labels (same as manual payment)
  const { getLabel } = useManualPaymentLabelsWithCache('EN')

  // API-driven pagination state
  const [currentApiPage, setCurrentApiPage] = useState(1)
  const [currentApiSize, setCurrentApiSize] = useState(20)

  // Use TAS payments API hook
  const {
    data: fundEgressData,
    loading: apiLoading,
    error: apiError,
    updatePagination,
    apiPagination,
    deleteFundEgress,
  } = useTasPayments({
    size: currentApiSize,
    page: Math.max(0, currentApiPage - 1),
  })

  const manualPaymentsData = useMemo(() => {
    return fundEgressData.map(transformFundEgressToTasPayment)
  }, [fundEgressData])

  // Create table columns with translation
  const tableColumns = createTableColumns(getLabel)

  const {
    search,
    paginated,
    totalRows: localTotalRows,
    totalPages: localTotalPages,
    startItem,
    endItem,
    page: localPage,
    rowsPerPage,
    selectedRows,
    expandedRows,
    handleSearchChange,
    handlePageChange: localHandlePageChange,
    handleRowsPerPageChange: localHandleRowsPerPageChange,
    handleRowSelectionChange,
    handleRowExpansionChange,
    handleSort,
    sortConfig,
  } = useTableState({
    data: manualPaymentsData,
    searchFields: [
      'date',
      'takermsPaymentRefNo',
      'assetRegisterName',
      'managementFirmName',
      'paymentType',
      'approvalStatus',
    ],
    initialRowsPerPage: currentApiSize,
  })

  const handlePageChange = (newPage: number) => {
    const hasActiveSearch = Object.values(search).some((value) => value.trim())

    if (hasActiveSearch) {
      localHandlePageChange(newPage)
    } else {
      setCurrentApiPage(newPage)
      updatePagination(Math.max(0, newPage - 1), currentApiSize)
    }
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setCurrentApiSize(newRowsPerPage)
    setCurrentApiPage(1)
    updatePagination(0, newRowsPerPage)
    localHandleRowsPerPageChange(newRowsPerPage)
  }

  // Get API totals from the API response
  const apiTotal = apiPagination.totalElements
  const apiTotalPages = apiPagination.totalPages

  // Determine which pagination values to use
  const hasActiveSearch = Object.values(search).some((value) => value.trim())

  const effectiveTotalRows = hasActiveSearch ? localTotalRows : apiTotal
  const effectiveTotalPages = hasActiveSearch ? localTotalPages : apiTotalPages
  const effectivePage = hasActiveSearch ? localPage : currentApiPage

  // Calculate effective startItem and endItem based on pagination type
  const effectiveStartItem = hasActiveSearch
    ? startItem
    : (currentApiPage - 1) * currentApiSize + 1
  const effectiveEndItem = hasActiveSearch
    ? endItem
    : Math.min(currentApiPage * currentApiSize, apiTotal)

  // Action handlers
  const handleViewPayment = (row: ManualPaymentData) => {
    try {
      // Find the corresponding fund egress data to get the ID
      const fundEgressItem = fundEgressData.find(
        (item) => item.fePaymentRefNumber === row.takermsPaymentRefNo
      )

      if (fundEgressItem?.id) {
        // Use Next.js router for navigation
        router.push(`/transactions/tas/new/${fundEgressItem.id}?step=0`)
      } else {
        // Handle case where fund egress item is not found
      }
    } catch (error) {
      // Handle navigation error silently
    }
  }

  const handleDeletePayment = (row: ManualPaymentData) => {
    if (isDeleting) {
      return
    }

    confirmDelete({
      itemName: `TAS payment: ${row.takermsPaymentRefNo}`,
      itemId: row.id.toString(),
      onConfirm: async () => {
        try {
          setIsDeleting(true)
          await deleteFundEgress(row.id.toString())
        } catch (error) {
          throw error // Re-throw to keep dialog open on error
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  // Render expanded content using same labels as manual payment
  const renderExpandedContent = (row: ManualPaymentData) => (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <h4 className="mb-4 text-sm font-semibold text-gray-900">
          {getLabel(
            MANUAL_PAYMENT_LABELS.EXPANDED_SECTIONS.PAYMENT_INFO,
            'EN',
            MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_SECTIONS.PAYMENT_INFO
          )}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">
              {getLabel(
                MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.DATE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.DATE
              )}
              :
            </span>
            <span className="ml-2 font-medium text-gray-800">
              {row.date as string}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getLabel(
                MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.EMS_REF,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.EMS_REF
              )}
              :
            </span>
            <span className="ml-2 font-medium text-gray-800">
              {row.takermsPaymentRefNo as string}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getLabel(
                MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.ASSET_REGISTER_NAME,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.ASSET_REGISTER_NAME
              )}
              :
            </span>
            <span className="ml-2 font-medium text-gray-800">
              {row.assetRegisterName as string}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getLabel(
                MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.MANAGEMENT_FIRM_NAME,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.MANAGEMENT_FIRM_NAME
              )}
              :
            </span>
            <span className="ml-2 font-medium text-gray-800">
              {row.managementFirmName as string}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getLabel(
                MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.PAYMENT_TYPE,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.PAYMENT_TYPE
              )}
              :
            </span>
            <span className="ml-2 font-medium text-gray-800">
              {row.paymentType as string}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getLabel(
                MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.APPROVAL_STATUS,
                'EN',
                MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.APPROVAL_STATUS
              )}
              :
            </span>
            <span className="ml-2 font-medium text-gray-800">
              {row.approvalStatus as string}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="mb-4 text-sm font-semibold text-gray-900">
          {getLabel(
            MANUAL_PAYMENT_LABELS.EXPANDED_SECTIONS.PAYMENT_DOCUMENTS,
            'EN',
            MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_SECTIONS.PAYMENT_DOCUMENTS
          )}
        </h4>
        <div className="space-y-3">
          <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            {getLabel(
              MANUAL_PAYMENT_LABELS.DOCUMENTS.INVOICE,
              'EN',
              MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.INVOICE
            )}
          </button>
          <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            {getLabel(
              MANUAL_PAYMENT_LABELS.DOCUMENTS.CONSTRUCTION_PROGRESS,
              'EN',
              MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.CONSTRUCTION_PROGRESS
            )}
          </button>
          <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            {getLabel(
              MANUAL_PAYMENT_LABELS.DOCUMENTS.APPROVAL,
              'EN',
              MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.APPROVAL
            )}
          </button>
          <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
            {getLabel(
              MANUAL_PAYMENT_LABELS.DOCUMENTS.HISTORY,
              'EN',
              MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.HISTORY
            )}
          </button>
        </div>
      </div>
    </div>
  )

  // Show loading state while API data is being fetched
  if (apiLoading) {
    return (
      <>
        {isSidePanelOpen && (
          <LeftSlidePanel
            isOpen={isSidePanelOpen}
            onClose={() => setIsSidePanelOpen(false)}
          />
        )}

        <DashboardLayout title={tasPaymentTitle}>
          <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl rounded-t-2xl">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      </>
    )
  }

  // Show error state if API call failed
  if (apiError) {
    return (
      <>
        {isSidePanelOpen && (
          <LeftSlidePanel
            isOpen={isSidePanelOpen}
            onClose={() => setIsSidePanelOpen(false)}
          />
        )}

        <DashboardLayout title={tasPaymentTitle}>
          <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl rounded-t-2xl">
            <GlobalError
              error={apiError}
              onRetry={() => window.location.reload()}
              title="Failed to load TAS payment data"
              fullHeight
            />
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      {isSidePanelOpen && (
        <LeftSlidePanel
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
        />
      )}

      <DashboardLayout title={tasPaymentTitle}>
        <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl rounded-t-2xl">
          {/* Sticky Header Section */}
          <div className="sticky top-0 z-10 bg-white/75 dark:bg-gray-800/80 rounded-t-2xl">
            {/* Action Buttons */}
          </div>

          {/* Table Container with Fixed Pagination */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-auto rounded-t-2xl">
              <PermissionAwareDataTable<ManualPaymentData>
                data={paginated}
                columns={tableColumns}
                searchState={search}
                onSearchChange={handleSearchChange}
                paginationState={{
                  page: effectivePage,
                  rowsPerPage: rowsPerPage,
                  totalRows: effectiveTotalRows,
                  totalPages: effectiveTotalPages,
                  startItem: effectiveStartItem,
                  endItem: effectiveEndItem,
                }}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                selectedRows={selectedRows}
                onRowSelectionChange={handleRowSelectionChange}
                expandedRows={expandedRows}
                onRowExpansionChange={handleRowExpansionChange}
                renderExpandedContent={renderExpandedContent}
                statusOptions={statusOptions}
                onRowView={handleViewPayment}
                onRowDelete={handleDeletePayment}
                onSort={handleSort}
                sortConfig={sortConfig}
                deletePermissions={['tas_payment_delete']}
                viewPermissions={['tas_payment_view']}
                editPermissions={['tas_payment_update']}
                updatePermissions={['tas_payment_update']}
                // showViewAction={true}
                // showEditAction={true}
                // showDeleteAction={true}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default TASPaymentPage
