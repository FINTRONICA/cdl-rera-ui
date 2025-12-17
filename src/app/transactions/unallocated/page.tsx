'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '../../../components/templates/DashboardLayout'
import { PermissionAwareDataTable } from '../../../components/organisms/PermissionAwareDataTable'
import { useTableState } from '../../../hooks/useTableState'
import LeftSlidePanel from '@/components/organisms/LeftSlidePanel/LeftSlidePanel'
import { usePendingTransactionsUI } from '@/hooks'
import { usePendingTransactionLabelApi } from '@/hooks/usePendingTransactionLabelApi'
import { useDeletePendingTransaction } from '@/hooks/usePendingTransactions'
import { getPendingTransactionLabel } from '@/constants/mappings/pendingTransactionMapping'
import { useSidebarConfig } from '@/hooks/useSidebarConfig'
import { useTemplateDownload } from '@/hooks/useRealEstateDocumentTemplate'
import { TEMPLATE_FILES } from '@/constants'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import { PageActionButtons } from '@/components/molecules/PageActionButtons'
import { GlobalLoading, GlobalError } from '@/components/atoms'

interface TransactionData extends Record<string, unknown> {
  id: number
  projectName: string
  projectRegulatorId: string
  tranReference: string
  tranDesc: string
  tranAmount: number
  tranDate: string
  narration: string
  tasMatch: string
  approvalStatus: string
}

const usePendingRows = (page: number, size: number) => {
  const filters = React.useMemo(() => ({ isAllocated: false }), [])
  const { data, isLoading, error } = usePendingTransactionsUI(
    Math.max(0, page - 1),
    size,
    filters
  )

  const rows: TransactionData[] = useMemo(() => {
    if (!data?.content) {
      return []
    }

    const items = data.content as any[]

    return items.map((ui: any) => {
      return {
        id: Number(ui.id),
        projectName: ui.projectName || '—',
        projectRegulatorId: ui.projectRegulatorId || '—',
        tranReference: ui.referenceId || '—',
        tranDesc: ui.description || 'TRANSFER',
        tranAmount: Number(ui.amount || '0'),
        tranDate: ui.transactionDate
          ? new Date(ui.transactionDate).toLocaleDateString('en-GB')
          : '',
        narration: ui.narration || '—',
        tasMatch: ui.tasUpdate || '—',
        approvalStatus:
          ui.taskStatusDTO?.name ||
          mapPaymentStatusToApprovalStatus(ui.paymentStatus),
      }
    })
  }, [data])

  const total = data?.page?.totalElements || 0
  const totalPages = data?.page?.totalPages || 1

  return { rows, total, totalPages, isLoading, error }
}

const mapPaymentStatusToApprovalStatus = (paymentStatus: string): string => {
  // Fallback mapping when taskStatusDTO is not available
  switch (paymentStatus?.toUpperCase()) {
    case 'PENDING':
      return 'PENDING'
    case 'INCOMPLETE':
      return 'INITIATED'
    case 'IN_REVIEW':
    case 'REVIEW':
      return 'IN_PROGRESS'
    case 'REJECTED':
    case 'FAILED':
      return 'REJECTED'
    case 'APPROVED':
    case 'SUCCESS':
      return 'APPROVED'
    default:
      return 'INITIATED'
  }
}

const UnallocatedTransactionPage: React.FC = () => {
  const router = useRouter()
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)

  // Template download hook
  const { downloadTemplate, isLoading: isDownloading } = useTemplateDownload()

  // Template download handler
  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate(TEMPLATE_FILES.SPLIT)
    } catch (error) {}
  }

  const [isDeleting, setIsDeleting] = useState(false)

  const { getLabelResolver } = useSidebarConfig()
  const unallocatedTitle = getLabelResolver
    ? getLabelResolver('unallocated', 'Unallocated')
    : 'Unallocated'
  const {
    getLabel: getLabelFromApi,
    isLoading: labelsLoading,
    error: labelsError,
  } = usePendingTransactionLabelApi()

  const getTransactionLabelDynamic = React.useCallback(
    (configId: string): string => {
      const apiLabel = getLabelFromApi(configId, 'EN')

      if (apiLabel !== configId) {
        return apiLabel
      }

      const fallbackLabel = getPendingTransactionLabel(configId)
      return fallbackLabel
    },
    [getLabelFromApi]
  )

  const [currentApiPage, setCurrentApiPage] = useState(1)
  const [currentApiSize, setCurrentApiSize] = useState(20)

  const {
    rows: apiRows,
    total: apiTotal,
    totalPages: apiTotalPages,
    isLoading,
    error,
  } = usePendingRows(currentApiPage, currentApiSize)

  const deleteMutation = useDeletePendingTransaction()
  const confirmDelete = useDeleteConfirmation()

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
    data: apiRows,
    searchFields: [
      'projectName',
      'projectRegulatorId',
      'tranReference',
      'tranDesc',
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
    }
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setCurrentApiSize(newRowsPerPage)
    setCurrentApiPage(1)
    localHandleRowsPerPageChange(newRowsPerPage)
  }

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

  const tableColumns = [
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
      key: 'tranReference',
      label: getTransactionLabelDynamic('CDL_TRAN_REFNO'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'tranDesc',
      label: getTransactionLabelDynamic('CDL_TRAN_DESC'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'tranAmount',
      label: getTransactionLabelDynamic('CDL_TRAN_AMOUNT'),
      type: 'custom' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'tranDate',
      label: getTransactionLabelDynamic('CDL_TRAN_DATE'),
      type: 'text' as const,
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
      key: 'tasMatch',
      label: getTransactionLabelDynamic('CDL_TRAN_TAS_STATUS'),
      type: 'text' as const,
      width: 'w-32',
      sortable: true,
    },
    {
      key: 'approvalStatus',
      label: getTransactionLabelDynamic('CDL_TRAN_STATUS'),
      type: 'status' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'actions',
      label: getTransactionLabelDynamic('CDL_TRAN_ACTION'),
      type: 'actions' as const,
      width: 'w-20',
    },
  ]

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US')
  }

  const statusOptions = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'IN_PROGRESS',
    'DRAFT',
    'INITIATED',
  ]

  const handleRowView = (row: TransactionData) => {
    router.push(`/transactions/unallocated/${row.id}`)
  }

  const handleRowDelete = (row: TransactionData) => {
    if (isDeleting) {
      return
    }

    confirmDelete({
      itemName: `transaction: ${row.tranReference}`,
      itemId: row.id.toString(),
      onConfirm: async () => {
        try {
          setIsDeleting(true)
          await deleteMutation.mutateAsync(String(row.id))
        } catch (error) {
          throw error // Re-throw to keep dialog open on error
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const handleRowClick = (row: TransactionData) => {
    router.push(`/transactions/unallocated/${row.id}`)
  }

  const renderCustomCell = (column: string, value: unknown) => {
    if (column === 'tranAmount' && typeof value === 'number') {
      return `${formatNumber(value)}`
    }
    return String(value || '')
  }

  const renderExpandedContent = (row: TransactionData) => (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Transaction Information
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Project Name:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.projectName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Project Regulator ID:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.projectRegulatorId}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Transaction Reference:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.tranReference}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Transaction Description:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.tranDesc}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Transaction Amount:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {formatNumber(row.tranAmount)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Transaction Date:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.tranDate}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Narration:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.narration}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">TAS Match:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.tasMatch}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Approval Status:</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
              {row.approvalStatus}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Transaction Actions
        </h4>
        <div className="space-y-3">
          <button className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 shadow-sm">
            View Transaction Details
          </button>
          <button className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 shadow-sm">
            Allocate Transaction
          </button>
          <button className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 shadow-sm">
            Download Transaction Report
          </button>
          <button className="w-full text-left p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 shadow-sm">
            Export Transaction Data
          </button>
        </div>
      </div>
    </div>
  )

  if (isLoading || labelsLoading) {
    return (
      <DashboardLayout title={unallocatedTitle}>
        <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  if (error || labelsError) {
    return (
      <DashboardLayout title={unallocatedTitle}>
        <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
          <GlobalError 
            error={error?.message || labelsError || 'Unknown error'} 
            onRetry={() => window.location.reload()}
            title="Error loading unallocated transactions"
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

      <DashboardLayout title={unallocatedTitle}>
        <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
          <div className="sticky top-0 z-10 bg-white/75 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
            <div className="flex justify-end gap-2 py-3.5 px-4">
              <PageActionButtons
                entityType="pendingPayment"
                onDownloadTemplate={handleDownloadTemplate}
                isDownloading={isDownloading}
                showButtons={{
                  downloadTemplate: true,
                  uploadDetails: true,
                  addNew: false,
                }}
              />
            </div>
          </div>

          <PermissionAwareDataTable<TransactionData>
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
            onRowView={handleRowView}
            onRowDelete={handleRowDelete}
            onRowClick={handleRowClick}
            renderCustomCell={renderCustomCell}
            deletePermissions={['pending_tran_delete']}
            viewPermissions={['pending_tran_view']}
            updatePermissions={['pending_tran_update']}
            showDeleteAction={true}
            showViewAction={true}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>
      </DashboardLayout>
    </>
  )
}

export default UnallocatedTransactionPage
