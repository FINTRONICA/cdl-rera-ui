'use client'

import { Suspense } from 'react'
import BudgetMasterStepperWrapper from '@/components/organisms/BudgetStepper/Budget'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { useBudgetLabelsWithCache } from '@/hooks/budget/useBudgetLabelsWithCache'
import { MASTER_BUDGET_LABELS } from '@/constants/mappings/budgetLabels'

function NewBudgetContent() {
  const { getLabel } = useBudgetLabelsWithCache('EN')

  const pageTitle = getLabel(
    MASTER_BUDGET_LABELS.PAGE_TITLE,
    'EN',
    MASTER_BUDGET_LABELS.FALLBACKS.PAGE_TITLE
  )
  const pageSubtitle = getLabel(
    MASTER_BUDGET_LABELS.PAGE_SUBTITLE,
    'EN',
    MASTER_BUDGET_LABELS.FALLBACKS.PAGE_SUBTITLE
  )

  return (
    <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
      <div className="px-3">
        <BudgetMasterStepperWrapper />
      </div>
    </DashboardLayout>
  )
}

export default function NewBudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">Loading...</div>
      }
    >
      <NewBudgetContent />
    </Suspense>
  )
}
