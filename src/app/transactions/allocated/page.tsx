'use client'

/**
 * Allocated Transactions Page
 *
 * Displays allocated/processed transactions with dynamic labels from the API.
 * Uses Label Configuration API service with fallback to static labels.
 */

import React, { useState } from 'react'
import { DashboardLayout } from '../../../components/templates/DashboardLayout'
import { PermissionAwareDataTable } from '../../../components/organisms/PermissionAwareDataTable'
import { useTableState } from '../../../hooks/useTableState'
import LeftSlidePanel from '@/components/organisms/LeftSlidePanel/LeftSlidePanel'
import { useProcessedTransactions } from '@/hooks/useProcessedTransactions'
import { getProcessedTransactionLabel } from '@/constants/mappings/processedTransactionMapping'
import { useAppStore } from '@/store'
import { useSidebarConfig } from '@/hooks/useSidebarConfig'
import { useLabelConfigApi } from '@/hooks/useLabelConfigApi'
import type { ProcessedTransactionUIData } from '@/services/api/processedTransactionService'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import { GlobalLoading, GlobalError } from '@/components/atoms'

interface TransactionTableData
  extends ProcessedTransactionUIData,
    Record<string, unknown> {}

const AllocatedTransactionPage: React.FC = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const confirmDelete = useDeleteConfirmation()

  const currentLanguage = useAppStore((state) => state.language) || 'EN'
  const { getLabelResolver } = useSidebarConfig()
  const allocatedTitle = getLabelResolver
    ? getLabelResolver('allocated', 'Allocated')
    : 'Allocated'
  const [currentApiPage, setCurrentApiPage] = useState(1)
  const [currentApiSize, setCurrentApiSize] = useState(20)

  // Use the new label configuration API
  const {
    getLabel: getLabelFromApi,
    isLoading: labelsLoading,
    error: labelsError,
  } = useLabelConfigApi()

  const {
    data: processedTransactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    updatePagination,
    deleteTransaction,
  } = useProcessedTransactions(
    Math.max(0, currentApiPage - 1),
    currentApiSize,
    { isAllocated: true }
  )

  const getTransactionLabelDynamic = React.useCallback(
    (configId: string): string => {
      const apiLabel = getLabelFromApi(configId, currentLanguage)

      if (apiLabel !== configId) {
        return apiLabel
      }

      const fallbackLabel = getProcessedTransactionLabel(configId)
      return fallbackLabel
    },
    [getLabelFromApi, currentLanguage]
  )

  const tableColumns = [
    {
      key: 'date',
      label: getTransactionLabelDynamic('CDL_TRAN_DATE'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'transId',
      label: getTransactionLabelDynamic('CDL_TRAN_REFNO'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'projectAccountId',
      label: getTransactionLabelDynamic('CDL_TRANS_BP_CIF'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'developerName',
      label: getTransactionLabelDynamic('CDL_TRANS_BP_NAME'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'projectName',
      label: getTransactionLabelDynamic('CDL_TRANS_BPA_NAME'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'projectRegulatorId',
      label: getTransactionLabelDynamic('CDL_TRANS_BPA_REGULATOR'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'unitNo',
      label: getTransactionLabelDynamic('CDL_TRANS_UNIT_HOLDER'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'receivableCategory',
      label: getTransactionLabelDynamic('CDL_TRAN_RECEIVABLE_CATEGORY'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'tasCbsMatch',
      label: getTransactionLabelDynamic('CDL_TRAN_MATCHING_STATUS'),
      type: 'text' as const,
      width: 'w-32',
      sortable: true,
    },
    {
      key: 'amount',
      label: getTransactionLabelDynamic('CDL_TRAN_AMOUNT'),
      type: 'custom' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'narration',
      label: getTransactionLabelDynamic('CDL_TRAN_NOTES'),
      type: 'text' as const,
      width: 'w-48',
      sortable: true,
    },
    {
      key: 'actions',
      label: getTransactionLabelDynamic('CDL_TRAN_ACTION'),
      type: 'actions' as const,
      width: 'w-20',
    },
  ]

  const tableData = React.useMemo(() => {
    if (!processedTransactionsData?.content) {
      return []
    }

    const items = processedTransactionsData.content

    return items.map((item) => {
      return item as TransactionTableData
    })
  }, [processedTransactionsData])

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
    data: tableData,
    searchFields: [
      'date',
      'transId',
      'projectAccountId',
      'developerName',
      'projectName',
      'projectRegulatorId',
      'unitNo',
      'receivableCategory',
      'narration',
    ],
    initialRowsPerPage: currentApiSize,
  })

  const handlePageChange = (newPage: number) => {
    const hasSearch = Object.values(search).some((value) => value.trim())

    if (hasSearch) {
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

  const apiTotal = processedTransactionsData?.page?.totalElements || 0
  const apiTotalPages = processedTransactionsData?.page?.totalPages || 1

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

  const handleRowDelete = (row: TransactionTableData) => {
    if (isDeleting) {
      return
    }

    confirmDelete({
      itemName: `transaction: ${row.transId}`,
      itemId: row.id.toString(),
      onConfirm: async () => {
        try {
          setIsDeleting(true)
          await deleteTransaction(row.id)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred'
          console.error(`Failed to delete transaction: ${errorMessage}`)
          throw error // Re-throw to keep dialog open on error
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const renderExpandedContent = (row: TransactionTableData) => (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Transaction Information
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_DATE')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">{row.date}</span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_REFNO')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.transId}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRANS_BP_CIF')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.projectAccountId}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRANS_BP_NAME')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.developerName}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRANS_BPA_NAME')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.projectName}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRANS_BPA_REGULATOR')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.projectRegulatorId}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRANS_UNIT_HOLDER')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">{row.unitNo}</span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_RECEIVABLE_CATEGORY')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.receivableCategory}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_MATCHING_STATUS')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.tasCbsMatch}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_AMOUNT')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.amount} {row.currency}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_NOTES')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.narration}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRANS_APPROVAL_STATUS')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.paymentStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-600">
              {getTransactionLabelDynamic('CDL_TRAN_TOTAL_AMT')}:
            </span>
            <span className="ml-2 text-gray-800 font-medium">
              {row.totalAmount} {row.currency}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Transaction Actions
        </h4>
        <div className="space-y-3">
          <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm">
            {getTransactionLabelDynamic('CDL_TRAN_ACTION')} - View Details
          </button>
          <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm">
            {getTransactionLabelDynamic('CDL_TRAN_TEMPLATE_DOWNLOAD')} - Report
          </button>
          <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm">
            {getTransactionLabelDynamic('CDL_TRAN_ROLLBACK')} - Deallocate
          </button>
          <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm">
            Export Transaction Data
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">
            Additional Details
          </h5>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {row.narration && (
              <div>
                <span className="text-gray-600">
                  {getTransactionLabelDynamic('CDL_TRAN_NOTES')}:
                </span>
                <span className="ml-2 text-gray-800">{row.narration}</span>
              </div>
            )}
            {row.description && (
              <div>
                <span className="text-gray-600">
                  {getTransactionLabelDynamic('CDL_TRAN_DESC')}:
                </span>
                <span className="ml-2 text-gray-800">{row.description}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Allocated:</span>
              <span className="ml-2 text-gray-800">{row.allocated}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (transactionsLoading || labelsLoading) {
    return (
      <DashboardLayout title={allocatedTitle}>
        <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  if (transactionsError || labelsError) {
    return (
      <DashboardLayout title={allocatedTitle}>
        <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
          <GlobalError
            error={transactionsError || labelsError || 'Unknown error'}
            onRetry={() => window.location.reload()}
            title="Error loading allocated transactions"
            fullHeight
          />
        </div>
      </DashboardLayout>
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

      <DashboardLayout title={allocatedTitle}>
        <div className="bg-white/75 dark:bg-gray-800/80 rounded-xl flex flex-col h-full rounded-t-2xl">
          <div className="flex-1 flex flex-col min-h-0 rounded-t-2xl">
            <div className="flex-1 overflow-auto rounded-t-2xl">
              <PermissionAwareDataTable<TransactionTableData>
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
                onRowDelete={handleRowDelete}
                deletePermissions={['processed_tran_delete']}
                viewPermissions={['processed_tran_view']}
                updatePermissions={['processed_tran_update']}
                showDeleteAction={true}
                showViewAction={true}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default AllocatedTransactionPage
