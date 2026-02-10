'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import BudgetManagementFirmStepperWrapper from '@/components/organisms/BudgetStepper/ManagementFirmBudget'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import {
  budgetService,
  type BudgetUIData,
} from '@/services/api/budgetApi/budgetTEstService'
import { GlobalLoading } from '@/components/atoms'

function BudgetManagementFirmPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const budgetId = params.id as string
  const mode = searchParams.get('mode')
  const editing = searchParams.get('editing')
  const isViewMode = mode === 'view'
  const isEditingMode = editing === 'true'

  const [budgetData, setBudgetData] = useState<BudgetUIData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to step/1 if accessed directly via [id] route
  useEffect(() => {
    if (budgetId) {
      const queryParams = new URLSearchParams()
      if (editing) queryParams.set('editing', editing)
      if (mode) queryParams.set('mode', mode)
      const queryString = queryParams.toString()
      const redirectUrl = `/budget/budget-management-firm/${budgetId}/step/1${queryString ? `?${queryString}` : ''}`
      router.replace(redirectUrl)
    }
  }, [budgetId, editing, mode, router])

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout
        title="Budget Management Firm Details"
        subtitle=""
      >
        <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout
        title="Budget Management Firm Details"
        subtitle="Error loading budget management firm details"
      >
        <div className="p-6 text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={() => router.push('/budget/budget-management-firm')}
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
      title="Budget Management Firm Details"
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
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565]">
            Budget Name
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939]">
            {budgetData?.budgetName || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565]">
            Budget ID
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939]">
            {budgetData?.budgetId || 'N/A'}
          </span>
        </div>
      </div>
      <div className="px-3 mt-[10px]">
        <BudgetManagementFirmStepperWrapper
          initialBudgetId={
            budgetId ? parseInt(budgetId) : null
          }
          initialStep={0}
          isViewMode={isViewMode}
        />
      </div>
    </DashboardLayout>
  )
}

export default function BudgetManagementFirmPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Budget Management Firm Details" subtitle="">
          <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <BudgetManagementFirmPageContent />
    </Suspense>
  )
}

