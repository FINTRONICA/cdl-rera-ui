'use client'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import BudgetMasterStepperWrapper from '@/components/organisms/BudgetStepper/Budget'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { useBudgetLabelsWithCache } from '@/hooks/budget/useBudgetCategoryLabelsWithCache'
import { MASTER_BUDGET_LABELS } from '@/constants/mappings/budgetLabels'
import { masterBudgetService } from '@/services/api/budgetApi/budgetManagementService'
import { GlobalLoading } from '@/components/atoms'
import type { MasterBudgetData } from '@/types/budget'

function BudgetMasterEditPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getLabel } = useBudgetLabelsWithCache()

  const budgetId = params.id as string
  const mode = searchParams.get('mode')
  const editing = searchParams.get('editing')
  const isViewMode = mode === 'view'
  const isEditingMode = editing === 'true'

  const [budgetData, setBudgetData] = useState<MasterBudgetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await masterBudgetService.getBudgetById(budgetId)
        setBudgetData(data)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch budget data'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (budgetId) {
      fetchBudgetData()
    } else {
      setIsLoading(false)
    }
  }, [budgetId])

  const pageTitle = getLabel(
    MASTER_BUDGET_LABELS.PAGE_TITLE,
    'EN',
    MASTER_BUDGET_LABELS.FALLBACKS.PAGE_TITLE
  )

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout title={pageTitle} subtitle="">
        <div className="bg-white/75 dark:bg-[#101828] rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        title={pageTitle}
        subtitle="Error loading budget details"
      >
        <div className="p-6 text-red-600 dark:text-red-400">
          <p>Error: {error}</p>
          <button
            onClick={() => router.push('/budgets/budget')}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Back to Budgets
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={pageTitle}
      subtitle={
        isViewMode
          ? 'View budget details and configuration (Read-only)'
          : isEditingMode
            ? 'Edit budget details and configuration'
            : 'Manage your budget details and configuration'
      }
    >
      <div className="flex items-start py-2 gap-7 px-7">
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-gray-400">
            {getLabel(
              MASTER_BUDGET_LABELS.FORM_FIELDS.CHARGE_TYPE,
              'EN',
              MASTER_BUDGET_LABELS.FALLBACKS.FORM_FIELDS.CHARGE_TYPE
            )}
            *
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-gray-100">
            {budgetData?.chargeType || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-gray-400">
            {getLabel(
              MASTER_BUDGET_LABELS.FORM_FIELDS.GROUP_NAME,
              'EN',
              MASTER_BUDGET_LABELS.FALLBACKS.FORM_FIELDS.GROUP_NAME
            )}
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-gray-100">
            {budgetData?.groupName || 'N/A'}
          </span>
        </div>
      </div>
      <div className="px-3 mt-[10px] bg-white/75 dark:bg-[#101828] p-2 border-radius-md">
        <BudgetMasterStepperWrapper
          initialBudgetId={budgetId ? budgetId : null}
          initialStep={0}
          isReadOnly={isViewMode}
        />
      </div>
    </DashboardLayout>
  )
}

export default function BudgetEditPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout
          title={MASTER_BUDGET_LABELS.FALLBACKS.PAGE_TITLE}
          subtitle=""
        >
          <div className="bg-white/75 dark:bg-[#101828] rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <BudgetMasterEditPageContent />
    </Suspense>
  )
}
