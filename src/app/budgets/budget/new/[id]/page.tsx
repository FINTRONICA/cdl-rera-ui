// 'use client'
// import { Suspense } from 'react'
// import BudgetMasterStepperWrapper from '@/components/organisms/BudgetStepper/MasterBudget'
// import { DashboardLayout } from '@/components/templates/DashboardLayout'
// import { useBudgetLabelsWithCache } from '@/hooks/budget/useBudgetLabelsWithCache'
// import { MASTER_BUDGET_LABELS } from '@/constants/mappings/budgetLabels'
// import { useSearchParams, useParams } from 'next/navigation'
// import { masterBudgetService } from '@/services/api/budgetApi/budgetService'
// import { useState, useEffect } from 'react'
// import { GlobalLoading, GlobalError } from '@/components/atoms'

// function BudgetMasterWithIdContent() {
//   const { getLabel } = useBudgetLabelsWithCache('EN')
//   const searchParams = useSearchParams()
//   const params = useParams()

//   // Check if we're in view mode (read-only)
//   const mode = searchParams.get('mode')
//   const isViewMode = mode === 'view'

//   // State for budget data
//   const [budgetData, setBudgetData] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   // Fetch budget data when ID is available
//   useEffect(() => {
//     const fetchBudgetData = async () => {
//       if (params.id) {
//         try {
//           setLoading(true)
//           setError(null)
//           const data = await masterBudgetService.getBudgetById(
//             params.id as string
//           )
//           setBudgetData(data)
//         } catch (error) {
//           setError(error instanceof Error ? error.message : 'Failed to load budget data')
//         } finally {
//           setLoading(false)
//         }
//       } else {
//         setLoading(false)
//       }
//     }

//     fetchBudgetData()
//   }, [params.id])

//   const pageTitle = getLabel(
//     MASTER_BUDGET_LABELS.PAGE_TITLE,
//     'EN',
//     MASTER_BUDGET_LABELS.FALLBACKS.PAGE_TITLE
//   )
//   const pageSubtitle = isViewMode
//     ? 'View Master Budget details (Read-only mode)'
//     : 'Register your Master Budget details step by step, non-mandatory fields and steps are easy to skip.'

//   // Show loading state while fetching payment data
//   if (loading && params.id) {
//     return (
//       <DashboardLayout title={pageTitle} subtitle="">
//         <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
//           <GlobalLoading fullHeight />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   // Show error state if there was an error loading budget data
//   if (error) {
//     return (
//       <DashboardLayout title={pageTitle} subtitle="">
//         <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
//           <GlobalError 
//             error={error} 
//             onRetry={() => window.location.reload()}
//             title="Error loading master budget data"
//             fullHeight
//           />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   return (
//     <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
//       <div className="px-3">
//         {/* Master Budget Summary for Both View and Edit Mode */}
//         {params.id && budgetData && (
//           <div className="flex items-start py-2 mb-4 gap-7 px-7 ">
//             <div className="flex flex-col min-w-[200px] gap-1">
//               <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565]">
//                 {getLabel(
//                   MASTER_BUDGET_LABELS.FORM_FIELDS.CHARGE_TYPE,
//                   'EN',
//                   MASTER_BUDGET_LABELS.FALLBACKS.FORM_FIELDS.CHARGE_TYPE
//                 )}
//                 *
//               </label>
//               <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939]">
//                 {loading
//                   ? 'Loading...'
//                   : budgetData?.chargeType || 'N/A'}
//               </span>
//             </div>
//             <div className="flex flex-col min-w-[200px] gap-1">
//               <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565]">
//                 {getLabel(
//                   MASTER_BUDGET_LABELS.FORM_FIELDS.GROUP_NAME,
//                   'EN',
//                   MASTER_BUDGET_LABELS.FALLBACKS.FORM_FIELDS.GROUP_NAME
//                 )}
//               </label>
//               <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939]">
//                 {loading
//                   ? 'Loading...'
//                   : budgetData?.groupName || 'N/A'}
//               </span>
//             </div>
//           </div>
//         )}

//         <BudgetMasterStepperWrapper isReadOnly={isViewMode} />
//       </div>
//     </DashboardLayout>
//   )
// }

// export default function BudgetMasterWithIdPage() {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <BudgetMasterWithIdContent />
//     </Suspense>
//   )
// }
