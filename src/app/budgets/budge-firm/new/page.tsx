'use client'

import { Suspense } from 'react'
import BudgetManagementFirmStepperWrapper from '@/components/organisms/BudgetStepper/BudgetFirm'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { GlobalLoading } from '@/components/atoms'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'

function NewBudgetManagementFirmPageContent() {
  return (
    <DashboardLayout
      title={BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.PAGE_TITLE}
      subtitle={BUDGET_MANAGEMENT_FIRM_LABELS.FALLBACKS.PAGE_SUBTITLE}
    >
      <div className="px-3">
        <BudgetManagementFirmStepperWrapper />
      </div>
    </DashboardLayout>
  )
}

export default function NewBudgetManagementFirmPage() {
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
      <NewBudgetManagementFirmPageContent />
    </Suspense>
  )
}
