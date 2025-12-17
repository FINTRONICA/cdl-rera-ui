/**
 * useTabData Hook
 * 
 * Reusable hook for handling tab-based data fetching and transformation
 * for both pending and involved activities pages.
 * 
 * Features:
 * - Tab state management
 * - API calls based on active tab
 * - PayloadJson mapping based on module type
 * - Pagination support
 * - Loading and error states
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  AwaitingActionsUIData,
  EngagementsActionsUIData,
  WorkflowRequestFilters,
} from '@/services/api/workflowApi/workflowRequestService'
import {
  useAwaitingActionsUIData,
  useEngagementsActionsUIData,
} from '@/hooks/workflow/useWorkflowRequest'
import {
  getModuleNameFromTabId,
  type TabId,
  getNavigationPath,
} from '@/services/tabsService'
import {
  mapPayloadToUIData,
  type MappedPayloadData,
} from '@/services/payloadMapperService'
import { formatDateOnly } from '@/utils'

export type ActivityPageType = 'pending' | 'involved'

export interface WorkflowRequestData
  extends Partial<AwaitingActionsUIData>,
    Partial<EngagementsActionsUIData>,
    Record<string, unknown> {
  payloadJson?: Record<string, unknown>
  mappedPayload?: MappedPayloadData
  displayName?: string
  identifier?: string
  status?: string | null // For pending page
  stageStatus?: string | null // For involved page
  stageName?: string // For involved page
  myRemarks?: string // For involved page
  myDecision?: string // For involved page
  createdAt?: string
}

interface UseTabDataOptions {
  pageType: ActivityPageType
  initialTab?: TabId
  pageSize?: number
}

interface UseTabDataReturn {
  // Tab state
  activeTab: TabId
  setActiveTab: (tabId: TabId) => void
  handleTabChange: (tabId: string) => void

  // Data
  workflowData: WorkflowRequestData[]
  isLoading: boolean
  error: Error | null
  refetch: () => void

  // Pagination
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number

  // Navigation
  getNavigationPath: (id: string | number) => string

  // Utilities
  hasNoData: boolean
  moduleName: string | null
}

/**
 * Main hook for tab-based data management
 */
export function useTabData(
  options: UseTabDataOptions
): UseTabDataReturn {
  const { pageType, initialTab = 'buildPartner', pageSize = 20 } = options

  // Tab state
  const [activeTab, setActiveTabState] = useState<TabId>(initialTab)
  const [currentPage, setCurrentPage] = useState(0)

  // Get module name from active tab
  const moduleName = useMemo(() => {
    return getModuleNameFromTabId(activeTab)
  }, [activeTab])

  // Build filters based on active tab
  const workflowFilters = useMemo((): WorkflowRequestFilters => {
    return moduleName ? { moduleName } : {}
  }, [moduleName])

  // Fetch data based on page type
  // Note: Both hooks must be called unconditionally (Rules of Hooks).
  // React Query will handle caching and prevent duplicate calls for the same query key.
  // The unused hook will still make an API call, but with different query keys they won't interfere.
  const isPending = pageType === 'pending'

  const pendingQuery = useAwaitingActionsUIData(
    currentPage,
    pageSize,
    isPending ? workflowFilters : undefined
  )

  const involvedQuery = useEngagementsActionsUIData(
    currentPage,
    pageSize,
    !isPending ? workflowFilters : undefined
  )

  // Select appropriate query based on page type
  const activeQuery = isPending ? pendingQuery : involvedQuery

  // Extract data from active query
  const {
    data: workflowResponse,
    isLoading,
    error,
    refetch,
  } = activeQuery

  // Transform data with payload mapping
  const workflowData = useMemo((): WorkflowRequestData[] => {
    if (!workflowResponse?.content || !moduleName) return []

    return workflowResponse.content.map((item) => {
      const payloadJson = (item.payloadJson as Record<string, unknown>) || {}
      
      // Map payloadJson based on module type
      const mappedPayload = mapPayloadToUIData(payloadJson, moduleName)

      // Build result with mapped data
      const result: WorkflowRequestData = {
        ...item,
        payloadJson,
        mappedPayload,
        displayName: mappedPayload.displayName,
        identifier: mappedPayload.identifier,
        createdAt: formatDateOnly(item.createdAt),
      }

      // Map status fields based on page type
      // Pending uses 'taskStatus' from AwaitingActionsUIData, map to 'status' for table
      // Involved uses 'stageStatus' from EngagementsActionsUIData
      if (pageType === 'pending') {
        // For pending: use taskStatus from item or mappedPayload status
        result.status = (item as Partial<AwaitingActionsUIData>).taskStatus || mappedPayload.status || null
      } else {
        // For involved: use stageStatus from item
        result.stageStatus = (item as Partial<EngagementsActionsUIData>).stageStatus || mappedPayload.status || null
        // Also preserve other involved-specific fields
        if ('myRemarks' in item) result.myRemarks = (item as Partial<EngagementsActionsUIData>).myRemarks
        if ('stageName' in item) result.stageName = (item as Partial<EngagementsActionsUIData>).stageName
        if ('myDecision' in item) result.myDecision = (item as Partial<EngagementsActionsUIData>).myDecision
      }

      // Add module-specific fields from mappedPayload
      if (mappedPayload) {
        Object.keys(mappedPayload).forEach((key) => {
          if (key !== 'displayName' && key !== 'identifier' && key !== 'status') {
            result[key] = mappedPayload[key]
          }
        })
      }

      return result
    })
  }, [workflowResponse, moduleName])

  // Handle tab change
  const handleTabChange = useCallback(
    (tabId: string) => {
      const validTabId = tabId as TabId
      if (validTabId && validTabId !== activeTab) {
        setActiveTabState(validTabId)
        setCurrentPage(0) // Reset pagination on tab change
      }
    },
    [activeTab]
  )

  // Set active tab (internal use)
  const setActiveTab = useCallback((tabId: TabId) => {
    setActiveTabState(tabId)
    setCurrentPage(0)
  }, [])

  // Get navigation path for current tab
  const getNavPath = useCallback(
    (id: string | number) => {
      return getNavigationPath(activeTab, id)
    },
    [activeTab]
  )

  // Check if there's no data
  const hasNoData = workflowData.length === 0 && !isLoading

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    workflowData,
    isLoading,
    error: error as Error | null,
    refetch,
    currentPage,
    setCurrentPage,
    pageSize,
    getNavigationPath: getNavPath,
    hasNoData,
    moduleName,
  }
}

