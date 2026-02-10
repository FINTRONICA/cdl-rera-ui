'use client'

import { Suspense, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { useBudgetManagementLabelsWithCache as useBudgetManagementFirmLabelsApi } from '@/hooks/budget/useBudgetManagementLabelsWithCache'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'
import { GlobalLoading } from '@/components/atoms'
import { useAppStore } from '@/store'

function BudgetManagementFirmPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentLanguage = useAppStore((state) => state.language) ?? 'EN'
  const { getLabel } = useBudgetManagementFirmLabelsApi()

  const budgetId = params.id as string
  const editing = searchParams.get('editing')
  const mode = searchParams.get('mode')

  const pageTitle = getLabel(
    BUDGET_MANAGEMENT_FIRM_LABELS.PAGE_TITLE,
    currentLanguage,
    BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.PAGE_TITLE
  )

  // Redirect to step/1 if accessed directly via [id] route
  useEffect(() => {
    if (budgetId) {
      const queryParams = new URLSearchParams()
      if (editing) queryParams.set('editing', editing)
      if (mode) queryParams.set('mode', mode)
      const queryString = queryParams.toString()
      const redirectUrl = `/budgets/budge-firm/${budgetId}/step/1${queryString ? `?${queryString}` : ''}`
      router.replace(redirectUrl)
    }
  }, [budgetId, editing, mode, router])

  return (
    <DashboardLayout title={pageTitle} subtitle="">
      <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
        <GlobalLoading fullHeight />
      </div>
    </DashboardLayout>
  )
}

export default function BudgetManagementFirmPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title={BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.PAGE_TITLE} subtitle="">
          <div className="bg-white/75 dark:bg-gray-800/80 rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <BudgetManagementFirmPageContent />
    </Suspense>
  )
}

