'use client'

import { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import StepperWrapper from '@/components/organisms/ProjectStepper'
import { GlobalLoading } from '@/components/atoms'
import { useProject } from '@/hooks/useProjects'
import { useBuildPartnerAssetLabelsWithUtils } from '@/hooks/useBuildPartnerAssetLabels'

function ProjectDetailsPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const projectId = params.id as string
  const mode = searchParams.get('mode') // 'view' or null
  const editing = searchParams.get('editing') // 'true' or null
  const stepParam = searchParams.get('step') // Get step from URL (1-based)
  const initialStep = stepParam ? Math.max(0, parseInt(stepParam) - 1) : 0 // Convert to 0-based index

  const { getLabel } = useBuildPartnerAssetLabelsWithUtils()
  const language = 'EN'

  const {
    data: projectData,
    isLoading: isLoadingData,
    error: projectError,
  } = useProject(projectId)

  useEffect(() => {
    if (!projectId || isNaN(parseInt(projectId))) {
      router.push('/management-firms')
      return
    }
    setIsValidating(false)
  }, [projectId, router])

  useEffect(() => {
    if (projectError) {
      setError(projectError.message || 'Failed to fetch project data')
    }
  }, [projectError])

  if (isValidating || isLoadingData) {
    return (
      <DashboardLayout
        title={getLabel(
          'CDL_MF_DETAILS',
          language,
          'Management Firm Details'
        )}
        subtitle=""
      >
        <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
          <GlobalLoading fullHeight />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        title={getLabel(
          'CDL_MF_DETAILS',
          language,
          'Management Firm Details'
        )}
        subtitle="Error loading management firm details"
      >
        <div className="p-6 text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={() => router.push('/management-firms')}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Management Firms
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={getLabel(
        'CDL_MF_DETAILS',
        language,
        'Management Firm Details'
      )}
      subtitle={
        mode === 'view'
          ? 'View management firm details and configuration (Read-only)'
          : editing === 'true'
            ? 'Edit management firm details and configuration'
            : 'Manage your management firm details and configuration'
      }
    >
      <div className="flex items-start py-2 gap-7 px-7">
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565] dark:text-white">
            {getLabel('CDL_MF_NAME', language, 'Management Firm Name')}
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939] dark:text-white">
            {projectData?.mfName || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565] dark:text-white">
            {getLabel('CDL_MF_REGNO', language, 'Management Firm Registration Number')}
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939] dark:text-white">
            {projectData?.mfReraNumber || 'N/A'}
          </span>
        </div>
        {/* <div className="flex flex-col min-w-[200px] gap-1">
          <label className="font-sans font-normal text-[12px] leading-[1] tracking-normal text-[#4A5565]">
            {getLabel(
              'CDL_MF_CIF',
              language,
              'Management Firm Information File (CIF) Number'
            )}
          </label>
          <span className="font-outfit font-normal text-[16px] leading-[1] tracking-normal align-middle text-[#1E2939]">
            {projectData?.mfCif || 'N/A'}
          </span>
        </div> */}
      </div>
      <div className="px-3 mt-[10px]">
        <StepperWrapper
          projectId={projectId}
          isViewMode={mode === 'view'}
          initialStep={initialStep}
        />
      </div>
    </DashboardLayout>
  )
}

export default function ProjectDetailsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Management Firm Details" subtitle="">
          <div className="bg-[#FFFFFFBF] rounded-2xl flex flex-col h-full">
            <GlobalLoading fullHeight />
          </div>
        </DashboardLayout>
      }
    >
      <ProjectDetailsPageContent />
    </Suspense>
  )
}
