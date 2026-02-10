'use client'

import { Suspense } from 'react'
import BudgetManagementFirmStepperWrapper from '@/components/organisms/BudgetStepper/ManagementFirmBudget'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { GlobalLoading } from '@/components/atoms'

function NewBudgetManagementFirmPageContent() {
  return (
    <DashboardLayout
      title="Budget Management Firm Details"
      subtitle="Register your budget management firm step by step, non-mandatory fields and steps are easy to skip."
    >
      <div className="px-3">
        <BudgetManagementFirmStepperWrapper />
      </div>
    </DashboardLayout>
  )
}

export default function NewInvestorPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Capital Partner Details" subtitle="">
          <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <NewBudgetManagementFirmPageContent />
    </Suspense>
  )
}
