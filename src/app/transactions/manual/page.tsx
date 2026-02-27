'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '../../../components/templates/DashboardLayout'
import { PermissionAwareDataTable } from '../../../components/organisms/PermissionAwareDataTable'
import { useTableState } from '../../../hooks/useTableState'
import {
  useManualPayments,
  type FundEgressData,
} from '../../../hooks/useFundEgress'
import { useManualPaymentLabelsWithCache } from '@/hooks/useManualPaymentLabelsWithCache'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import { PageActionButtons } from '../../../components/molecules/PageActionButtons'
import LeftSlidePanel from '@/components/organisms/LeftSlidePanel/LeftSlidePanel'
import { MANUAL_PAYMENT_LABELS } from '@/constants/mappings/manualPaymentLabels'
import { GlobalLoading } from '@/components/atoms'

interface ManualPaymentData extends Record<string, unknown> {
  id: number
  date: string
  takermsPaymentRefNo: string
  assetRegisterName: string
  managementFirmName: string
  paymentType: string
  paymentSubType: string
  invoiceNumber: string
  corporatePayment: string
  beneficiaryName: string
  responsePaymentRefNo: string
  timestamp: string
  phFinacleStatus: string
  errorDescription: string
  discardedTransaction: string
  approvalStatus: string
  amount: number
  currency: string
  paymentStatus: string
  isManualPayment: boolean
  docVerified: boolean
  dealRefNo: string
  remark: string
}

const transformFundEgressToManualPayment = (
  fundEgress: FundEgressData
): ManualPaymentData => {
  const mapApiStatus = (taskStatusDTO: any | null): string => {
    if (!taskStatusDTO) {
      return 'INITIATED'
    }

    return taskStatusDTO.code || 'INITIATED'
  }

  return {
    id: fundEgress.id || 0,
    date: new Date(fundEgress.fePaymentDate).toLocaleDateString('en-GB'),
    takermsPaymentRefNo: fundEgress.fePaymentRefNumber || '',
    assetRegisterName: fundEgress.assetRegisterDTO?.arName || 'N/A',
    managementFirmName: fundEgress.managementFirmDTO?.mfName || 'N/A',
    paymentType:
      fundEgress.expenseTypeDTO?.languageTranslationId?.configValue ||
      'Manual Payment',
    paymentSubType:
      fundEgress.expenseSubTypeDTO?.languageTranslationId?.configValue || 'N/A',
    invoiceNumber: fundEgress.feInvoiceRefNo || '',
    corporatePayment: fundEgress.feCorporatePayment ? 'Yes' : 'No',
    beneficiaryName:
      fundEgress.realEstateAssestBeneficiaryDTO?.name ||
      fundEgress.assetRegisterDTO?.arName ||
      'N/A',
    responsePaymentRefNo: fundEgress.fePaymentRefNumber || 'N/A',
    timestamp: new Date(fundEgress.fePaymentDate).toLocaleString('en-GB'),
    phFinacleStatus:
      fundEgress.feTasPaymentStatus || fundEgress.fePaymentStatus || 'N/A',
    errorDescription: fundEgress.feErrorResponseObject
      ? 'Error Present'
      : 'No Error',
    discardedTransaction: fundEgress.feDiscardPayment ? 'Yes' : 'No',
    approvalStatus: mapApiStatus(fundEgress.taskStatusDTO),
    amount: fundEgress.fePaymentAmount,
    currency: 'AED', // Default currency
    paymentStatus: fundEgress.fePaymentStatus || '',
    isManualPayment: fundEgress.feIsManualPayment || false,
    docVerified: fundEgress.feDocVerified || false,
    dealRefNo: fundEgress.feDealRefNo || '',
    remark: fundEgress.feRemark || '',
  }
}

const createExpandedContentLabels = (
  getLabel: (configId: string, language?: string, fallback?: string) => string
) => ({
  sections: {
    paymentInfo: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_SECTIONS.PAYMENT_INFO,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_SECTIONS.PAYMENT_INFO
    ),
    paymentStatus: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_SECTIONS.PAYMENT_STATUS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_SECTIONS.PAYMENT_STATUS
    ),
    paymentDocuments: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_SECTIONS.PAYMENT_DOCUMENTS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_SECTIONS.PAYMENT_DOCUMENTS
    ),
  },
  fields: {
    date: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.DATE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.DATE
    ),
    tasEmsRef: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.EMS_REF,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.EMS_REF
    ),
    assetRegisterName: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.ASSET_REGISTER_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.ASSET_REGISTER_NAME
    ),
    managementFirmName: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.MANAGEMENT_FIRM_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.MANAGEMENT_FIRM_NAME
    ),
    paymentType: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.PAYMENT_TYPE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.PAYMENT_TYPE
    ),
    paymentSubType: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.PAYMENT_SUB_TYPE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.PAYMENT_SUB_TYPE
    ),
    invoiceNumber: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.INVOICE_NUMBER,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.INVOICE_NUMBER
    ),
    corporatePayment: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.CORPORATE_PAYMENT,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.CORPORATE_PAYMENT
    ),
    beneficiaryName: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.BENEFICIARY_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.BENEFICIARY_NAME
    ),
    responseRef: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.EMS_REF,
      'EN',
      'Response Reference'
    ),
    timestamp: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.DATE,
      'EN',
      'Timestamp'
    ),
    phFinacleStatus: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.STATUS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.STATUS
    ),
    errorDescription: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.ERROR_DESCRIPTION,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.ERROR_DESCRIPTION
    ),
    discardedTransaction: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.DISCARDED_TRANSACTION,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.DISCARDED_TRANSACTION
    ),
    approvalStatus: getLabel(
      MANUAL_PAYMENT_LABELS.EXPANDED_FIELDS.APPROVAL_STATUS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.EXPANDED_FIELDS.APPROVAL_STATUS
    ),
  },
  documents: {
    invoice: getLabel(
      MANUAL_PAYMENT_LABELS.DOCUMENTS.INVOICE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.INVOICE
    ),
    constructionProgress: getLabel(
      MANUAL_PAYMENT_LABELS.DOCUMENTS.CONSTRUCTION_PROGRESS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.CONSTRUCTION_PROGRESS
    ),
    approval: getLabel(
      MANUAL_PAYMENT_LABELS.DOCUMENTS.APPROVAL,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.APPROVAL
    ),
    history: getLabel(
      MANUAL_PAYMENT_LABELS.DOCUMENTS.HISTORY,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.DOCUMENTS.HISTORY
    ),
  },
})

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
    key: 'paymentSubType',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.PAYMENT_SUB_TYPE,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.PAYMENT_SUB_TYPE
    ),
    type: 'text' as const,
    width: 'w-48',
    sortable: true,
  },
  {
    key: 'invoiceNumber',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.INVOICE_NUMBER,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.INVOICE_NUMBER
    ),
    type: 'text' as const,
    width: 'w-40',
    sortable: true,
  },
  {
    key: 'corporatePayment',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.CORPORATE_PAYMENT,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.CORPORATE_PAYMENT
    ),
    type: 'text' as const,
    width: 'w-32',
    sortable: true,
  },
  {
    key: 'beneficiaryName',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.BENEFICIARY_NAME,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.BENEFICIARY_NAME
    ),
    type: 'text' as const,
    width: 'w-48',
    sortable: true,
  },
  {
    key: 'phFinacleStatus',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.STATUS,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.STATUS
    ),
    type: 'text' as const,
    width: 'w-36',
    sortable: true,
  },
  {
    key: 'errorDescription',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.ERROR_DESCRIPTION,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.ERROR_DESCRIPTION
    ),
    type: 'text' as const,
    width: 'w-36',
    sortable: true,
  },
  {
    key: 'discardedTransaction',
    label: getLabel(
      MANUAL_PAYMENT_LABELS.TABLE_COLUMNS.DISCARDED_TRANSACTION,
      'EN',
      MANUAL_PAYMENT_LABELS.FALLBACKS.TABLE_COLUMNS.DISCARDED_TRANSACTION
    ),
    type: 'text' as const,
    width: 'w-40',
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
    width: 'w-28',
  },
]

const ManualPaymentPage: React.FC = () => {
  const router = useRouter()
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [transformedData, setTransformedData] = useState<ManualPaymentData[]>(
    []
  )
  const { getLabel } = useManualPaymentLabelsWithCache('EN')
  const confirmDelete = useDeleteConfirmation()

  const tableColumns = useMemo(() => createTableColumns(getLabel), [getLabel])
  const statusOptions = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'IN_PROGRESS',
    'DRAFT',
    'INITIATED',
  ]
  const expandedLabels = useMemo(
    () => createExpandedContentLabels(getLabel),
    [getLabel]
  )

  const manualPaymentTitle = getLabel(
    MANUAL_PAYMENT_LABELS.PAGE_TITLE,
    'EN',
    MANUAL_PAYMENT_LABELS.FALLBACKS.PAGE_TITLE
  )

  const [currentApiPage, setCurrentApiPage] = useState(1)
  const [currentApiSize, setCurrentApiSize] = useState(20)

  const {
    data: fundEgressData,
    loading: paymentsLoading,
    deleteFundEgress,
    updatePagination,
    apiPagination,
  } = useManualPayments({
    size: currentApiSize,
    page: Math.max(0, currentApiPage - 1),
  })

  useEffect(() => {
    if (fundEgressData && fundEgressData.length > 0) {
      const transformed = fundEgressData
        .filter((item) => item.feIsManualPayment)
        .map(transformFundEgressToManualPayment)
      setTransformedData(transformed)
    } else {
      setTransformedData([])
    }
  }, [fundEgressData])

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
    data: transformedData,
    searchFields: [
      'date',
      'takermsPaymentRefNo',
      'assetRegisterName',
      'managementFirmName',
      'paymentType',
      'paymentSubType',
      'invoiceNumber',
      'corporatePayment',
      'beneficiaryName',
      'responsePaymentRefNo',
      'timestamp',
      'phFinacleStatus',
      'errorDescription',
      'discardedTransaction',
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

  const apiTotal = apiPagination.totalElements
  const apiTotalPages = apiPagination.totalPages

  const hasActiveSearch = Object.values(search).some((value) => value.trim())

  const effectiveTotalRows = hasActiveSearch ? localTotalRows : apiTotal
  const effectiveTotalPages = hasActiveSearch ? localTotalPages : apiTotalPages
  const effectivePage = hasActiveSearch ? localPage : currentApiPage

  const effectiveStartItem = hasActiveSearch
    ? startItem
    : (currentApiPage - 1) * currentApiSize + 1
  const effectiveEndItem = hasActiveSearch
    ? endItem
    : Math.min(currentApiPage * currentApiSize, apiTotal)

  const handleViewPayment = useCallback(
    (row: ManualPaymentData) => {
      router.push(`/transactions/manual/new/${row.id}?step=0&mode=view`)
    },
    [router]
  )

  const handleEditPayment = useCallback(
    (row: ManualPaymentData) => {
      router.push(`/transactions/manual/new/${row.id}?step=0&mode=edit`)
    },
    [router]
  )

  const handleDeletePayment = useCallback(
    (row: ManualPaymentData) => {
      if (isDeleting) {
        return
      }

      confirmDelete({
        itemName: `payment: ${row.takermsPaymentRefNo}`,
        itemId: row.id.toString(),
        onConfirm: async () => {
          try {
            setIsDeleting(true)
            await deleteFundEgress(row.id.toString())
          } catch (error) {
            throw error
          } finally {
            setIsDeleting(false)
          }
        },
      })
    },
    [deleteFundEgress, isDeleting, confirmDelete]
  )

  const renderExpandedContent = useCallback(
    (row: ManualPaymentData) => (
      <div className="grid grid-cols-3 gap-8">
        <div className="space-y-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">
            {expandedLabels.sections.paymentInfo}
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.date}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.date as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.tasEmsRef}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.takermsPaymentRefNo as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.assetRegisterName}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.assetRegisterName as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.managementFirmName}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.managementFirmName as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.paymentType}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.paymentType as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.paymentSubType}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.paymentSubType as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.invoiceNumber}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.invoiceNumber as string}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">
            {expandedLabels.sections.paymentStatus}
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.corporatePayment}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.corporatePayment as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.beneficiaryName}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.beneficiaryName as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.responseRef}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.responsePaymentRefNo as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.timestamp}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.timestamp as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.phFinacleStatus}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.phFinacleStatus as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.errorDescription}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.errorDescription as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.discardedTransaction}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.discardedTransaction as string}
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {expandedLabels.fields.approvalStatus}:
              </span>
              <span className="ml-2 font-medium text-gray-800">
                {row.approvalStatus as string}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">
            {expandedLabels.sections.paymentDocuments}
          </h4>
          <div className="space-y-3">
            <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
              {expandedLabels.documents.invoice}
            </button>
            <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
              {expandedLabels.documents.constructionProgress}
            </button>
            <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
              {expandedLabels.documents.approval}
            </button>
            <button className="w-full p-3 text-sm text-left text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
              {expandedLabels.documents.history}
            </button>
          </div>
        </div>
      </div>
    ),
    [expandedLabels]
  )

  return (
    <>
      {isSidePanelOpen && (
        <LeftSlidePanel
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
        />
      )}

      <DashboardLayout title={manualPaymentTitle}>
        <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
          {paymentsLoading ? (
            <GlobalLoading fullHeight />
          ) : (
            <>
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/75 dark:bg-gray-800/80 dark:border-gray-700 rounded-t-2xl">
                <PageActionButtons
                  entityType="manualPayment"
                  showButtons={{ addNew: true }}
                />
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-auto">
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
                    onRowEdit={handleEditPayment}
                    onRowDelete={handleDeletePayment}
                    deletePermissions={['manual_payment_delete']}
                    viewPermissions={['manual_payment_view']}
                    editPermissions={['manual_payment_update']}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export default ManualPaymentPage
