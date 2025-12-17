'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TablePageLayout } from '../../../components/templates/TablePageLayout'
import { ExpandableDataTable } from '../../../components/organisms/ExpandableDataTable'
import { useTableState } from '../../../hooks/useTableState'
import { GlobalLoading, GlobalError } from '@/components/atoms'
import { CommentModal } from '@/components/molecules'
import { RightSlideWorkflowTransactionStatePanel } from '@/components/organisms/RightSlidePanel'
import { displayValue } from '@/utils/nullHandling'
import { getLabelByConfigId as getWorkflowRequestLabel } from '@/constants/mappings/workflowMapping'
import { useAppStore } from '@/store'
import { useWorkflowRequestLabelsWithCache } from '@/hooks/workflow'
import { useTabData, type WorkflowRequestData } from '@/hooks/useTabData'
import { TABS } from '@/services/tabsService'
import { generateTableColumns, getSearchFields } from '@/utils/tableColumnConfig'

const statusOptions = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'DRAFT',
  'INITIATED',
]

const PendingActivitiesPage: React.FC = () => {
  const router = useRouter()
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [isTxnPanelOpen, setIsTxnPanelOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<{
    comment: string
    developer: string
    activityId?: string
  } | null>(null)
  const [selectedTxnId, setSelectedTxnId] = useState<
    string | number | undefined
  >()
  const currentLanguage = useAppStore((state) => state.language)

  // Use reusable tab data hook
  const {
    activeTab,
    handleTabChange,
    workflowData,
    isLoading: workflowLoading,
    error: workflowError,
    refetch: refetchWorkflow,
    getNavigationPath,
    hasNoData,
  } = useTabData({
    pageType: 'pending',
    initialTab: 'buildPartner',
    pageSize: 20,
  })

  const handleRowView = useCallback(
    async (row: WorkflowRequestData) => {
      try {
        // Use referenceId for navigation (the actual entity ID, not the workflow request ID)
        const id = (row.referenceId as string) || row.id?.toString() || ''
        if (!id) {
          console.error('No referenceId or id found for navigation')
          return
        }
        // getNavigationPath from hook is already bound to activeTab
        const navigationPath = getNavigationPath(id)
        if (navigationPath && navigationPath !== '#') {
          router.push(navigationPath)
        }
      } catch (error) {
        console.error('Error navigating to view:', error)
      }
    },
    [getNavigationPath, router]
  )

  const handleCommentClick = (
    _column: string,
    value: unknown
  ): React.ReactNode => {
    return <span>{displayValue(value)}</span>
  }

  const handleRowTransaction = async (
    row: WorkflowRequestData,
    index: number
  ) => {
    try {
      const id = row?.id ?? `temp-${index}`
      // Just set the ID and open the panel - the panel will fetch data using the new queue APIs
      setSelectedTxnId(id)
      setIsTxnPanelOpen(true)
    } catch {
      // Fallback: still open panel even if error occurs
      const id = row?.id ?? `temp-${index}`
      setSelectedTxnId(id)
      setIsTxnPanelOpen(true)
    }
  }

  const getDynamicPageTitle = useCallback((): string => {
    const tab = TABS.find((t) => t.id === activeTab)
    const moduleName = tab?.label || 'Unknown Module'
    return `Pending Activities: ${moduleName}`
  }, [activeTab])

  const {
    search,
    paginated,
    totalRows,
    totalPages,
    startItem,
    endItem,
    page,
    rowsPerPage,
    selectedRows,
    expandedRows,
    handleSearchChange,
    handlePageChange,
    handleRowsPerPageChange,
    handleRowSelectionChange,
    handleRowExpansionChange,
  } = useTableState({
    data: workflowData,
    searchFields: getSearchFields(activeTab, 'pending'),
    initialRowsPerPage: 20,
  })

  const { data: workflowRequestLabels, getLabel } =
    useWorkflowRequestLabelsWithCache()

  const getWorkflowRequestLabelDynamic = useCallback(
    (configId: string): string => {
      if (workflowRequestLabels) {
        return getLabel(
          configId,
          currentLanguage,
          getWorkflowRequestLabel(configId)
        )
      }
      return getWorkflowRequestLabel(configId)
    },
    [workflowRequestLabels, currentLanguage, getLabel]
  )

  // Generate dynamic columns based on active tab
  const tableColumns = useMemo(
    () => generateTableColumns(activeTab, 'pending', getWorkflowRequestLabelDynamic),
    [activeTab, getWorkflowRequestLabelDynamic]
  )

  if (workflowLoading) {
    return (
      <TablePageLayout
        title={getDynamicPageTitle()}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
          <GlobalLoading fullHeight />
        </div>
      </TablePageLayout>
    )
  }

  if (workflowError) {
    return (
      <TablePageLayout
        title={getDynamicPageTitle()}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
          <GlobalError
            error={workflowError}
            onRetry={refetchWorkflow}
            title="Error loading workflow requests"
            fullHeight
          />
        </div>
      </TablePageLayout>
    )
  }

  return (
    <>
      {commentModalOpen && selectedComment && (
        <CommentModal
          open={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
        />
      )}

      <TablePageLayout
        title={getDynamicPageTitle()}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {hasNoData ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                No data available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no workflow requests for the selected tab &ldquo;
                {TABS.find((tab) => tab.id === activeTab)?.label}&rdquo;.
              </p>
            </div>
          </div>
        ) : (
          <ExpandableDataTable<WorkflowRequestData>
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
            statusOptions={statusOptions}
            renderCustomCell={handleCommentClick}
            onRowTransaction={handleRowTransaction}
            onRowView={handleRowView}
            showViewAction={true}
          />
        )}
      </TablePageLayout>
      <RightSlideWorkflowTransactionStatePanel
        isOpen={isTxnPanelOpen}
        onClose={() => {
          setIsTxnPanelOpen(false)
        }}
        transactionId={selectedTxnId ?? ''}
        activeTab={activeTab}
        onApprove={() => {}}
        onReject={() => {}}
      />
      {selectedComment && (
        <CommentModal
          open={commentModalOpen}
          onClose={() => {
            setCommentModalOpen(false)
            setSelectedComment(null)
          }}
        />
      )}
    </>
  )
}

export default PendingActivitiesPage
