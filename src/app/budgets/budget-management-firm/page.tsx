// 'use client'

// import React, { useState, useCallback, useMemo, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { DashboardLayout } from '@/components/templates/DashboardLayout'
// import { PermissionAwareDataTable } from '@/components/organisms/PermissionAwareDataTable'
// import { PageActionButtons } from '@/components/molecules/PageActionButtons'
// import LeftSlidePanel from '@/components/organisms/LeftSlidePanel/LeftSlidePanel'
// import { useTableState } from '@/hooks/useTableState'

// import { useBudgetManagementFirmLabelsApi } from '@/hooks/useBudgetManagementFirmLabelsWithCache'
// import { useAppStore } from '@/store'
// import { BudgetService } from '@/services/api/budgetApi/budgetService'
// import type { BudgetUIData } from '@/services/api/budgetApi/budgetService'
// import { useSidebarConfig } from '@/hooks/useSidebarConfig'
// import { useTemplateDownload } from '@/hooks/useRealEstateDocumentTemplate'
// import { TEMPLATE_FILES } from '@/constants'
// import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
// import { GlobalLoading, GlobalError } from '@/components/atoms'
// import { BUDGET_LABELS } from '@/constants/mappings/budgetLabels'

// const statusOptions = [
//   'PENDING',
//   'APPROVED',
//   'REJECTED',
//   'IN_PROGRESS',
//   'DRAFT',
//   'INITIATED',
// ]
// type BudgetData = BudgetUIData

// const getTableColumns = (getLabel: (configId: string, language?: string, fallback?: string) => string) => [
//     {
//         key: 'managementFirmGroupName',
//         label: getLabel(
//           BUDGET_LABELS.LIST.TABLE_HEADERS.MANAGEMENT_FIRM,
//           'EN',
//           BUDGET_LABELS.FALLBACKS.LIST.TABLE_HEADERS.MANAGEMENT_FIRM
//         ),
//         type: 'text' as const,
//         width: 'w-56',
//         sortable: true,
//       },
//       // {
//       //   key: 'budgetPeriodTitle',
//       //   label: getLabel(
//       //     BUDGET_LABELS.LIST.TABLE_HEADERS.BUDGET_PERIOD,
//       //     'EN',
//       //     BUDGET_LABELS.FALLBACKS.LIST.TABLE_HEADERS.BUDGET_PERIOD
//       //   ),
//       //   type: 'text' as const,
//       //   width: 'w-40',
//       //   sortable: true,
//       // },
//       {
//         key: 'budgetPeriodRange',
//         label: getLabel(
//           BUDGET_LABELS.FORM_FIELDS.BUDGET_PERIOD_CODE,
//           'EN',
//           BUDGET_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_PERIOD_CODE
//         ),
//         type: 'text' as const,
//         width: 'w-44',
//       },
//       {
//         key: 'managementCompanyName',
//         label: getLabel(
//           BUDGET_LABELS.FORM_FIELDS.MANAGEMENT_COMPANY_NAME,
//           'EN',
//           BUDGET_LABELS.FALLBACKS.FORM_FIELDS.MANAGEMENT_COMPANY_NAME
//         ),
//         type: 'text' as const,
//         width: 'w-48',
//         sortable: true,
//       },
//       {
//         key: 'serviceChargeGroupName',
//         label: getLabel(
//           BUDGET_LABELS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME,
//           'EN',
//           BUDGET_LABELS.FALLBACKS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME
//         ),
//         type: 'text' as const,
//         width: 'w-48',
//         sortable: true,
//       },
//       {
//         key: 'totalCostDisplay',
//         label: getLabel(
//           BUDGET_LABELS.LIST.TABLE_HEADERS.TOTAL_COST,
//           'EN',
//           BUDGET_LABELS.FALLBACKS.LIST.TABLE_HEADERS.TOTAL_COST
//         ),
//         type: 'text' as const,
//         width: 'w-36',
//         sortable: true,
//       },
//   {
//     key: 'actions',
//     label: getLabel(
//       BUDGET_LABELS.LIST.TABLE_HEADERS.ACTIONS,
//       'EN',
//       BUDGET_LABELS.FALLBACKS.LIST.TABLE_HEADERS.ACTIONS
//     ),
//     type: 'actions' as const,
//     width: 'w-26',
//   },
// ]

// const BudgetManagementFirmPage: React.FC = () => {
//   const router = useRouter()
//   const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
//   const [investorsData, setInvestorsData] = useState<BudgetUIData[]>([])
//   const [loadingData, setLoadingData] = useState(true)
//   const [errorData, setErrorData] = useState<string | null>(null)
//   const [currentPage, setCurrentPage] = useState(1)
//   const [rowsPerPage, setRowsPerPage] = useState(20)
//   const [totalElements, setTotalElements] = useState(0)
//   const [totalPages, setTotalPages] = useState(0)
//   const [tableKey, setTableKey] = useState(0)
//   const [isDeleting, setIsDeleting] = useState(false)

//   const currentLanguage = useAppStore((state) => state.language)
//   const { getLabelResolver } = useSidebarConfig()
//   const budgetManagementFirmsTitle = getLabelResolver
//     ? getLabelResolver('budget-management-firm', 'Budget Management Firm')
//     : 'Budget Management Firm'
//   const { getLabel } = useBudgetManagementFirmLabelsApi()
//   const confirmDelete = useDeleteConfirmation()

//   // Template download hook
//   const {
//     downloadTemplate: downloadInvestorTemplate,
//     isLoading: isDownloadingInvestor,
//     error: downloadErrorInvestor,
//     clearError: clearErrorInvestor,
//   } = useTemplateDownload()
  
//   // Suppress unused error variable warning
//   if (downloadErrorInvestor) {
//     // Error is displayed in UI
//   }

//   const fetchInvestors = useCallback(async (page: number, size: number) => {
//     try {
//       setLoadingData(true)
//       setErrorData(null)

//       const res = await BudgetService.getBudgets(page - 1, size)

//       setInvestorsData(res.content)
//       setTotalElements(res.page.totalElements)
//       setTotalPages(res.page.totalPages)

//       if (res.page.totalPages === 0 && res.content.length > 0) {
//         const calculatedPages = Math.ceil(res.page.totalElements / size) || 1
//         setTotalPages(calculatedPages)
//       }
//     } catch (err: unknown) {
//       console.error('Error fetching budgets:', err)
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error'
//       setErrorData(`Failed to fetch budgets: ${errorMessage}`)
//       setInvestorsData([])
//       setTotalElements(0)
//       setTotalPages(0)
//     } finally {
//       setLoadingData(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchInvestors(currentPage, rowsPerPage)
//   }, [fetchInvestors, currentPage, rowsPerPage])

//   const getBudgetManagementFirmLabelDynamic = useCallback(
//     (configId: string, language?: string, fallback?: string): string => {
//       return getLabel(configId, language || currentLanguage, fallback || configId)
//     },
//     [getLabel, currentLanguage]
//   )

//   const tableColumns = useMemo(
//     () => getTableColumns(getBudgetManagementFirmLabelDynamic),
//     [getBudgetManagementFirmLabelDynamic]
//   )

//   const [search, setSearch] = useState<Record<string, string>>(() =>
//     Object.fromEntries(
//       [
//         'budgetName',
//         'budgetId',
//         'budgetPeriodCode',
//         'masterCommunityName',
//         'managementFirmGroupName',
//         'serviceChargeGroupName',
//       ].map((field) => [field, ''])
//     )
//   )
//   const [selectedRows, setSelectedRows] = useState<number[]>([])
//   const [expandedRows, setExpandedRows] = useState<number[]>([])

//   const { handleSort, sortConfig } = useTableState({
//     data: investorsData,
//     searchFields: [],
//     initialRowsPerPage: 20,
//   })

//   const filteredData = useMemo(() => {
//     const hasSearchValues = Object.values(search).some(
//       (val) => val.trim() !== ''
//     )
//     let data = hasSearchValues
//       ? investorsData.filter((row) => {
//           return Object.entries(search).every(([field, searchVal]) => {
//             const trimmedSearch = searchVal?.toLowerCase().trim() || ''
//             if (!trimmedSearch) return true
//             const value = String(
//               row[field as keyof BudgetUIData] ?? ''
//             ).toLowerCase()
//             return value.includes(trimmedSearch)
//           })
//         })
//       : investorsData

//     // Apply sorting if sortConfig is available
//     if (sortConfig && sortConfig.key) {
//       data = [...data].sort((a, b) => {
//         const aValue = a[sortConfig.key as keyof BudgetUIData] ?? ''
//         const bValue = b[sortConfig.key as keyof BudgetUIData] ?? ''

//         if (sortConfig.direction === 'asc') {
//           return String(aValue).localeCompare(String(bValue))
//         } else {
//           return String(bValue).localeCompare(String(aValue))
//         }
//       })
//     }

//     return data
//   }, [investorsData, search, sortConfig])

//   const startItem = totalElements > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0
//   const endItem = Math.min(currentPage * rowsPerPage, totalElements)

//   const handleSearchChange = useCallback((field: string, value: string) => {
//     setSearch((prev) => ({ ...prev, [field]: value }))
//   }, [])

//   const handlePageChange = useCallback((newPage: number) => {
//     setCurrentPage(newPage)
//     setSelectedRows([])
//     setExpandedRows([])
//   }, [])

//   const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
//     setRowsPerPage(newRowsPerPage)
//     setCurrentPage(1)
//     setSelectedRows([])
//     setExpandedRows([])
//   }, [])

//   const handleRowSelectionChange = useCallback((newSelectedRows: number[]) => {
//     setSelectedRows(newSelectedRows)
//   }, [])

//   const handleRowExpansionChange = useCallback((newExpandedRows: number[]) => {
//     setExpandedRows(newExpandedRows)
//   }, [])

//   // Template download handler
//   const handleDownloadInvestorTemplate = async () => {
//     try {
//       await downloadInvestorTemplate(TEMPLATE_FILES.INVESTOR)
//     } catch {
//       // Silently handle template download errors
//     }
//   }

//   const handleRowDelete = (row: BudgetData) => {
//     if (isDeleting) {
//       return
//     }

//     if (!row.id) {
//       alert('Cannot delete: No ID found for this budget')
//       return
//     }

//     confirmDelete({
//       itemName: `budget: ${row.budgetName || row.budgetId}`,
//       onConfirm: async () => {
//         try {
//           setIsDeleting(true)

//           await BudgetService.deleteBudget(row.id)

//           setSelectedRows([])
//           setExpandedRows([])

//           await new Promise((resolve) => setTimeout(resolve, 500))

//           await fetchInvestors(currentPage, rowsPerPage)

//           setTableKey((prev) => prev + 1)
//         } catch (error) {
//           const errorMessage =
//             error instanceof Error ? error.message : 'Unknown error occurred'
//           console.error(`Failed to delete investor: ${errorMessage}`)
//           throw error
//         } finally {
//           setIsDeleting(false)
//         }
//       },
//     })
//   }
//   const handleRowView = (row: BudgetData) => {
//     if (row.id) {
//       // Navigate to view mode (read-only) with the budget ID and step 1
//       router.push(`/budget/budget-management-firm/${row.id}/step/1?mode=view`)
//     } else {
//       alert('Cannot view: No ID found for this budget')
//     }
//   }

//   const handleRowEdit = (row: BudgetData) => {
//     if (row.id) {
//       // Navigate to edit mode with the budget ID, step 1, and editing flag
//       router.push(`/budget/budget-management-firm/${row.id}/step/1?editing=true`)
//     } else {
//       alert('Cannot edit: No ID found for this budget')
//     }
//   }

//   const renderExpandedContent = (row: BudgetData) => (
//     <div className="grid grid-cols-2 gap-8">
//       <div className="space-y-4">
//         <h4 className="mb-4 text-sm font-semibold text-gray-900">
//           {getBudgetManagementFirmLabelDynamic(BUDGET_LABELS.SECTION_TITLES.GENERAL, 'EN', 'General Information')}
//         </h4>
//         <div className="grid grid-cols-2 gap-4 text-sm">
//           <div>
//             <span className="text-gray-600">
//               {getBudgetManagementFirmLabelDynamic(BUDGET_LABELS.FORM_FIELDS.BUDGET_PERIOD_CODE, 'EN', 'Budget Period Code')}:
//             </span>
//             <span className="ml-2">{row.budgetPeriodCode || 'N/A'}</span>
//           </div>
//           <div>
//             <span className="text-gray-600">
//               {getBudgetManagementFirmLabelDynamic(BUDGET_LABELS.FORM_FIELDS.MASTER_COMMUNITY_NAME, 'EN', 'Master Community Name')}:
//             </span>
//             <span className="ml-2">{row.masterCommunityName || 'N/A'}</span>
//           </div>
//           <div>
//             <span className="text-gray-600">
//               {getBudgetManagementFirmLabelDynamic(BUDGET_LABELS.FORM_FIELDS.MANAGEMENT_FIRM_MANAGER_EMAIL, 'EN', 'Property Manager Email')}:
//             </span>
//             <span className="ml-2">{row.propertyManagerEmail || 'N/A'}</span>
//           </div>
//           <div>
//             <span className="text-gray-600">
//               {getBudgetManagementFirmLabelDynamic(BUDGET_LABELS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME, 'EN', 'Service Charge Group')}:
//             </span>
//             <span className="ml-2">{row.serviceChargeGroupName || 'N/A'}</span>
//           </div>
//         </div>
//       </div>
//       <div className="space-y-4">
//         <h4 className="mb-4 text-sm font-semibold text-gray-900">
//           Budget Details
//         </h4>
//         <div className="grid grid-cols-2 gap-4 text-sm">
//           <div>
//             <span className="text-gray-600">Budget ID:</span>
//             <span className="ml-2">{row.budgetId || 'N/A'}</span>
//           </div>
//           <div>
//             <span className="text-gray-600">Total Cost:</span>
//             <span className="ml-2">{row.totalCostDisplay || 0}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )

//   if (loadingData) {
//     return (
//       <DashboardLayout title={budgetManagementFirmsTitle}>
//         <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
//           <GlobalLoading fullHeight />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   if (errorData) {
//     return (
//       <DashboardLayout title={budgetManagementFirmsTitle}>
//         <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
//           <GlobalError 
//             error={errorData} 
//             onRetry={() => fetchInvestors(currentPage, rowsPerPage)}
//             title="Error loading budgets"
//             fullHeight
//           />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   return (
//     <>
//       {isSidePanelOpen && (
//         <LeftSlidePanel
//           isOpen={isSidePanelOpen}
//           onClose={() => setIsSidePanelOpen(false)}
//         />
//       )}

//       {/* Download Error Alert */}
//       {downloadErrorInvestor && (
//         <div className="fixed z-50 px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded shadow-lg top-4 right-4">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-medium">
//               Budget Template Error: {downloadErrorInvestor}
//             </span>
//             <button
//               onClick={clearErrorInvestor}
//               className="ml-4 text-red-500 hover:text-red-700"
//             >
//               ×
//             </button>
//           </div>
//         </div>
//       )}

//       <DashboardLayout title={budgetManagementFirmsTitle}>
//         <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
//           <div className="sticky top-0 z-10 bg-[#FFFFFFBF] border-b border-gray-200 rounded-t-2xl">
//             <PageActionButtons
//               entityType="budgetManagementFirm"
//               onDownloadTemplate={handleDownloadInvestorTemplate}
//               isDownloading={isDownloadingInvestor}
//             />
//           </div>

//           <div className="flex flex-col flex-1 min-h-0">
//             <div className="flex-1 overflow-auto">
//               <PermissionAwareDataTable<BudgetData>
//                 key={`budgets-table-${tableKey}`}
//                 data={filteredData}
//                 columns={tableColumns}
//                 searchState={search}
//                 onSearchChange={handleSearchChange}
//                 paginationState={{
//                   page: currentPage,
//                   rowsPerPage,
//                   totalRows: totalElements,
//                   totalPages,
//                   startItem,
//                   endItem,
//                 }}
//                 onPageChange={handlePageChange}
//                 onRowsPerPageChange={handleRowsPerPageChange}
//                 selectedRows={selectedRows}
//                 onRowSelectionChange={handleRowSelectionChange}
//                 expandedRows={expandedRows}
//                 onRowExpansionChange={handleRowExpansionChange}
//                 renderExpandedContent={renderExpandedContent}
//                 statusOptions={statusOptions}
//                 onRowDelete={handleRowDelete}
//                 onRowView={handleRowView}
//                 onRowEdit={handleRowEdit}
//                 deletePermissions={['*']}
//                 viewPermissions={['*']}
//                 editPermissions={['*']}
//                 updatePermissions={['*']}
//                 onSort={handleSort}
//                 sortConfig={sortConfig}
//               />
//             </div>
//           </div>
//         </div>
//       </DashboardLayout>
//     </>
//   )
// }

// export default BudgetManagementFirmPage
