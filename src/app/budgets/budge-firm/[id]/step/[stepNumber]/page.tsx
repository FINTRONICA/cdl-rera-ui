'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import BudgetManagementFirmStepperWrapper from '@/components/organisms/BudgetStepper/BudgetFirm'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { budgetService, type BudgetUIData } from '@/services/api/budgetApi/budgetManagementService'
import { useBudgetManagementLabelsWithCache as useBudgetManagementFirmLabelsApi } from '@/hooks/budget/useBudgetManagementLabelsWithCache'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'
import { GlobalLoading } from '@/components/atoms'
import { useAppStore } from '@/store'

function BudgetStepPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentLanguage = useAppStore((state) => state.language) ?? 'EN'
  const { getLabel } = useBudgetManagementFirmLabelsApi()

  const budgetId = params.id as string
  const stepNumber = params.stepNumber as string
  const mode = searchParams.get('mode')
  const editing = searchParams.get('editing')
  const isViewMode = mode === 'view'
  const isEditingMode = editing === 'true'

  const pageTitle = getLabel(
    BUDGET_MANAGEMENT_FIRM_LABELS.PAGE_TITLE,
    currentLanguage,
    BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.PAGE_TITLE
  )
  const budgetNameLabel = getLabel(
    BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.BUDGET_NAME,
    currentLanguage,
    BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_NAME
  )
  const budgetIdLabel = getLabel(
    BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.BUDGET_ID,
    currentLanguage,
    BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.FORM_FIELDS.BUDGET_ID
  )

  const [budgetData, setBudgetData] = useState<BudgetUIData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch budget data when component mounts
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await budgetService.getBudgetById(parseInt(budgetId))
        setBudgetData(data)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch budget data'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (budgetId) {
      fetchBudgetData()
    }
  }, [budgetId])

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout title={pageTitle} subtitle="">
        <div className="bg-[#FFFFFFBF] dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout title={pageTitle} subtitle="Error loading budget management firm details">
        <div className="p-6 text-red-600 dark:text-red-400">
          <p>Error: {error}</p>
          <button
            onClick={() => router.push('/budgets/budge-firm')}
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
          ? 'View budget management firm details and configuration (Read-only)'
          : isEditingMode
          ? 'Edit budget management firm details and configuration'
          : 'Manage your budget management firm details and configuration'
      }
    >
      <div className="flex items-start py-2 gap-7 px-7">
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-slate-300">
            {budgetNameLabel}
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-white">
            {budgetData?.budgetName || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-slate-300">
            {budgetIdLabel}
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-white">
            {budgetData?.budgetId || 'N/A'}
          </span>
        </div>
      </div>
      <div className="px-3 mt-[10px]">
        <BudgetManagementFirmStepperWrapper
          initialBudgetId={
            budgetId ? parseInt(budgetId) : null
          }
          initialStep={stepNumber ? parseInt(stepNumber) - 1 : 0}
          isViewMode={isViewMode}
        />
      </div>
    </DashboardLayout>
  )
}

export default function BudgetStepPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title={BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.PAGE_TITLE} subtitle="">
          <div className="bg-[#FFFFFFBF] dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <BudgetStepPageContent />
    </Suspense>
  )
}
