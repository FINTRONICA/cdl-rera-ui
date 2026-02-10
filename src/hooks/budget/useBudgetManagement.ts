import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import {
  budgetManagementService,
  BudgetManagementService,
} from '@/services/api/budgetApi/budgetManagementService'
import type { BudgetRequest, BudgetItemRequest } from '@/utils/budgetMapper'
import type { PaginatedResponse } from '@/types'
import { toast } from 'react-hot-toast'

export const BUDGET_MANAGEMENT_QUERY_KEY = 'budgetManagement'
export const BUDGET_ITEMS_QUERY_KEY = 'budgetItems'

// Hook for listing budgets (BUDGET API) with pagination
export function useBudgetManagement(page = 0, size = 20) {
  const [pagination, setPagination] = useState({ page, size })
  const [apiPagination, setApiPagination] = useState({
    totalElements: 0,
    totalPages: 1,
  })

  const query = useQuery({
    queryKey: [
      BUDGET_MANAGEMENT_QUERY_KEY,
      'list',
      { page: pagination.page, size: pagination.size },
    ],
    queryFn: () =>
      BudgetManagementService.getBudgetManagements(
        pagination.page,
        pagination.size
      ),
    enabled: true,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  // Update API pagination when data changes
  if (query.data?.page) {
    const newApiPagination = {
      totalElements: query.data.page.totalElements,
      totalPages: query.data.page.totalPages,
    }
    if (JSON.stringify(newApiPagination) !== JSON.stringify(apiPagination)) {
      setApiPagination(newApiPagination)
    }
  }

  const updatePagination = useCallback((newPage: number, newSize?: number) => {
    setPagination((prev) => ({
      page: newPage,
      size: newSize !== undefined ? newSize : prev.size,
    }))
  }, [])

  return {
    ...query,
    updatePagination,
    apiPagination,
  } as typeof query & {
    updatePagination: typeof updatePagination
    apiPagination: typeof apiPagination
  }
}

// Hook for fetching a single budget by ID (BUDGET API)
export function useBudgetManagementById(id: number | null) {
  const query = useQuery({
    queryKey: [BUDGET_MANAGEMENT_QUERY_KEY, id],
    queryFn: () => budgetManagementService.getBudgetManagementById(id!),
    enabled: !!id && !isNaN(id) && id > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  return query
}

// Hook for updating a budget (BUDGET API)
export function useUpdateBudgetManagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: Partial<BudgetRequest>
    }) => budgetManagementService.updateBudgetManagement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BUDGET_MANAGEMENT_QUERY_KEY],
        exact: false,
      })
      toast.success('Budget management updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget management')
    },
    retry: 2,
  })
}

// Hook for deleting a budget (management)
export function useDeleteBudgetManagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => BudgetManagementService.deleteBudgetManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BUDGET_MANAGEMENT_QUERY_KEY],
        exact: false,
      })
      toast.success('Budget management deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget management')
    },
    retry: 0,
  })
}

// --- Budget items (line items within a budget) ---

// Hook for fetching budget items by budgetId (budgetCategoryId deprecated, pass 0)
export function useBudgetItems(
  _budgetCategoryId?: number | string | null,
  budgetId?: number | string | null,
  page = 0,
  size = 20
) {
  const effectiveBudgetId =
    budgetId != null
      ? typeof budgetId === 'string'
        ? parseInt(budgetId, 10)
        : budgetId
      : undefined

  const query = useQuery({
    queryKey: [
      BUDGET_ITEMS_QUERY_KEY,
      'byBudget',
      effectiveBudgetId,
      { page, size },
    ],
    queryFn: (): Promise<PaginatedResponse<import('@/utils/budgetMapper').BudgetItemResponse>> =>
      budgetManagementService.getBudgetItemsByBudgetCategoryId(
        0,
        page,
        size,
        effectiveBudgetId!
      ),
    enabled:
      !!effectiveBudgetId &&
      !isNaN(effectiveBudgetId) &&
      effectiveBudgetId > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  return query
}

export function useCreateBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BudgetItemRequest) =>
      budgetManagementService.createBudgetItems(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false,
      })
      toast.success('Budget item created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget item')
    },
    retry: 2,
  })
}

export function useUpdateBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: Partial<BudgetItemRequest>
    }) => budgetManagementService.updateBudgetItems(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false,
      })
      toast.success('Budget item updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget item')
    },
    retry: 2,
  })
}

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      budgetManagementService.deleteBudgetItems(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false,
      })
      toast.success('Budget item deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget item')
    },
    retry: 0,
  })
}

// Hook to refresh budget management and budget items
export function useRefreshBudgetItems() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [BUDGET_MANAGEMENT_QUERY_KEY] })
    queryClient.invalidateQueries({ queryKey: [BUDGET_ITEMS_QUERY_KEY] })
  }, [queryClient])
}

