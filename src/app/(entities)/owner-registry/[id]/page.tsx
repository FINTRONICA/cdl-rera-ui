'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import InvestorsStepperWrapper from '@/components/organisms/InvestorStepper'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import {
  capitalPartnerService,
  type CapitalPartnerResponse,
} from '@/services/api/capitalPartnerService'
import { GlobalLoading } from '@/components/atoms'

function InvestorStepPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const ownerRegistryId = params.id as string
  const mode = searchParams.get('mode')
  const editing = searchParams.get('editing')
  const isViewMode = mode === 'view'
  const isEditingMode = editing === 'true'

  const [ownerRegistryData, setOwnerRegistryData] =
    useState<CapitalPartnerResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch capital partner data when component mounts
  useEffect(() => {
    const fetchCapitalPartnerData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await capitalPartnerService.getCapitalPartnerById(
          parseInt(ownerRegistryId)
        )
        setOwnerRegistryData(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch owner registry data')
      } finally {
        setIsLoading(false)
      }
    }

    if (ownerRegistryId) {
      fetchCapitalPartnerData()
    }
  }, [ownerRegistryId])

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Owner Registry Details" subtitle="">
        <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout
        title="Owner Registry Details"
        subtitle="Error loading investor details"
      >
        <div className="p-6 text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={() => router.push('/owner-registry')}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Back to Investors
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Owner Registry Details"
      subtitle={
        isViewMode
          ? 'View owner registry details and configuration (Read-only)'
          : isEditingMode
            ? 'Edit owner registry details and configuration'
            : 'Manage your owner registry details and configuration'
      }
    >
      <div className="flex items-start py-2 gap-7 px-7">
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-white">
            Owner Registry Name
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-white">
            {ownerRegistryData
              ? `${ownerRegistryData.ownerRegistryName ?? ownerRegistryData.capitalPartnerName ?? ''} ${ownerRegistryData.ownerRegistryMiddleName ?? ownerRegistryData.capitalPartnerMiddleName ?? ''} ${ownerRegistryData.ownerRegistryLastName ?? ownerRegistryData.capitalPartnerLastName ?? ''}`.trim() ||
                'N/A'
              : 'N/A'}
          </span>
        </div>
      </div>
      <div className="px-3 mt-[10px]">
        <InvestorsStepperWrapper
          initialCapitalPartnerId={
            ownerRegistryId ? parseInt(ownerRegistryId) : null
          }
          initialStep={0}
          isViewMode={isViewMode}
        />
      </div>
    </DashboardLayout>
  )
}

export default function InvestorStepPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Owner Registry Details" subtitle="">
          <div className="flex flex-col h-full bg-white/75 dark:bg-gray-800/80 rounded-2xl">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <InvestorStepPageContent />
    </Suspense>
  )
}
