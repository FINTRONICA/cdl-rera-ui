'use client'

import { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import DeveloperStepperWrapper from '@/components/organisms/DeveloperStepper'
import { GlobalLoading } from '@/components/atoms'
import {
  buildPartnerService,
  type BuildPartner,
} from '@/services/api/buildPartnerService'

function DeveloperStepPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isValidating, setIsValidating] = useState(true)
  const [assetRegisterData, setAssetRegisterData] = useState<BuildPartner | null>(
    null
  )
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const developerId = params.id as string
  const stepNumber = parseInt(params.stepNumber as string)

  // Get mode and editing from URL params (matching capital partner pattern)
  const mode = searchParams.get('mode')
  const editing = searchParams.get('editing')
  const isViewMode = mode === 'view'
  const isEditingMode = editing === 'true'

  // Validate step number and fetch asset registry data
  useEffect(() => {
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 6) {
      router.push('/asset-registry')
      return
    }
    setIsValidating(false)
  }, [stepNumber, router])

  // Fetch asset registry data
  useEffect(() => {
    const fetchAssetRegisterData = async () => {
      try {
        setIsLoadingData(true)
        setError(null)
        const data = await buildPartnerService.getBuildPartner(developerId)
        setAssetRegisterData(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch asset registry data')
      } finally {
        setIsLoadingData(false)
      }
    }

    if (developerId && !isValidating) {
      fetchAssetRegisterData()
    }
  }, [developerId, isValidating])

  if (isValidating || isLoadingData) {
    return (
      <DashboardLayout title="Asset Registry" subtitle="">
        <div className="bg-white/75 dark:bg-[#101828] rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        title="Asset Registry"
        subtitle="Error loading asset details"
      >
        <div className="p-6 text-red-600 dark:text-red-400">
          <p>Error: {error}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Asset Registry"
      subtitle={
        isViewMode
          ? 'View asset details and configuration (Read-only)'
          : isEditingMode
            ? 'Edit asset details and configuration'
            : 'Register your asset step by step, non-mandatory fields and steps are easy to skip.'
      }
    >
      <div className="flex items-start py-2 gap-7 px-7">
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-gray-400">
            Developer Name
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-gray-100">
            {assetRegisterData?.arName || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-gray-600 dark:text-gray-400">
            Developer CIF
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-gray-900 dark:text-gray-100">
            {assetRegisterData?.arCifrera || 'N/A'}
          </span>
        </div>
      </div>
      <div className="px-3 mt-[10px] bg-white/75 dark:bg-[#101828] p-2 border-radius-md">
        <DeveloperStepperWrapper
          developerId={developerId}
          initialStep={stepNumber - 1}
          isViewMode={isViewMode}
        />
      </div>
    </DashboardLayout>
  )
}

export default function DeveloperStepPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Asset Registry" subtitle="">
          <div className="bg-white/75 dark:bg-[#101828] rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <DeveloperStepPageContent />
    </Suspense>
  )
}
