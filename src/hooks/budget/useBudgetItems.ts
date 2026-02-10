import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState, useEffect } from 'react'
import { budgetItemsService, type BudgetItemRequest, type BudgetItemResponse } from '@/services/api/budgetApi/budgetItemsService'
import type { PaginatedResponse } from '@/types'
import { toast } from 'react-hot-toast'

export const BUDGET_ITEMS_QUERY_KEY = 'budgetItems'

// Hook for fetching budget items by budget category ID with pagination
export function useBudgetItems(
  budgetCategoryId?: number | string | null,
  budgetId?: number | string | null,
  page = 0,
  size = 20
) {
  const [pagination, setPagination] = useState({ page, size })
  const [apiPagination, setApiPagination] = useState({
    totalElements: 0,
    totalPages: 1,
  })

  const categoryId = budgetCategoryId 
    ? (typeof budgetCategoryId === 'string' ? parseInt(budgetCategoryId) : budgetCategoryId)
    : null
  const effectiveBudgetId = budgetId 
    ? (typeof budgetId === 'string' ? parseInt(budgetId) : budgetId)
    : undefined

  const query = useQuery({
    queryKey: [
      BUDGET_ITEMS_QUERY_KEY,
      'byCategory',
      categoryId,
      effectiveBudgetId,
      { page: pagination.page, size: pagination.size },
    ],
    queryFn: () => {
      console.log('[useBudgetItems] ===== Query Function Called =====')
      console.log('[useBudgetItems] budgetCategoryId (deprecated, not used):', categoryId)
      console.log('[useBudgetItems] budgetId (used for filtering):', effectiveBudgetId, 'Type:', typeof effectiveBudgetId)
      console.log('[useBudgetItems] page:', pagination.page, 'size:', pagination.size)
      // ✅ FIX: Pass budgetId as required parameter (budgetCategoryId is deprecated)
      return budgetItemsService.getBudgetItemsByBudgetCategoryId(
        0, // Dummy value - budgetCategoryId is not used in API anymore
        pagination.page,
        pagination.size,
        effectiveBudgetId! // budgetId is required
      )
    },
    // ✅ FIX: Enable query when budgetId is available (budgetCategoryId is not needed)
    enabled: !!effectiveBudgetId && !isNaN(effectiveBudgetId) && effectiveBudgetId > 0,
    staleTime: 0, // Always refetch to get latest data (important for POST/UPDATE/DELETE)
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 3,
  })

  // Debug logging
  useEffect(() => {
    console.log('[useBudgetItems] ===== Query State =====')
    console.log('[useBudgetItems] categoryId:', categoryId, 'budgetId:', effectiveBudgetId)
    console.log('[useBudgetItems] enabled:', !!categoryId && !isNaN(categoryId) && categoryId > 0)
    console.log('[useBudgetItems] isLoading:', query.isLoading)
    console.log('[useBudgetItems] isFetching:', query.isFetching)
    console.log('[useBudgetItems] hasData:', !!query.data)
    console.log('[useBudgetItems] itemsCount:', query.data?.content?.length || 0)
    console.log('[useBudgetItems] error:', query.error)
  }, [categoryId, effectiveBudgetId, query.isLoading, query.isFetching, query.data, query.error])

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

// Hook for fetching a single budget item by ID
export function useBudgetItem(id: number | null) {
  return useQuery({
    queryKey: [BUDGET_ITEMS_QUERY_KEY, id],
    queryFn: () => budgetItemsService.getBudgetItemsById(id!),
    enabled: !!id && !isNaN(id) && id > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3,
  })
}

// Hook for creating a budget item
export function useCreateBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BudgetItemRequest) =>
      budgetItemsService.createBudgetItems(payload),
    onSuccess: async (data, variables) => {
      // Invalidate queries to refetch data
      const categoryId = variables.budgetCategoryDTO?.id
      const budgetId = variables.budgetDTO?.id
      
      console.log('[useCreateBudgetItem] ✅ POST Success - Invalidating queries')
      console.log('[useCreateBudgetItem] categoryId:', categoryId, 'budgetId:', budgetId)
      console.log('[useCreateBudgetItem] Response data:', data)
      console.log('[useCreateBudgetItem] Response categoryId:', data.budgetCategoryDTO?.id)
      
      // Use the categoryId from response if not in variables (more reliable)
      const effectiveCategoryId = data.budgetCategoryDTO?.id || categoryId
      const effectiveBudgetId = data.budgetDTO?.id || budgetId
      
      console.log('[useCreateBudgetItem] Effective categoryId:', effectiveCategoryId, 'budgetId:', effectiveBudgetId)
      
      // Invalidate all queries that start with BUDGET_ITEMS_QUERY_KEY
      // This ensures we catch all variations of the query key
      await queryClient.invalidateQueries({ 
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false // Match all queries that start with this key
      })
      
      // Also explicitly invalidate the specific query keys
      // Try all possible combinations to ensure we catch the right query
      if (effectiveCategoryId) {
        // Invalidate with budgetId
        if (effectiveBudgetId) {
          await queryClient.invalidateQueries({ 
            queryKey: [BUDGET_ITEMS_QUERY_KEY, 'byCategory', effectiveCategoryId, effectiveBudgetId],
            exact: false
          })
        }
        // Invalidate without budgetId (undefined)
        await queryClient.invalidateQueries({ 
          queryKey: [BUDGET_ITEMS_QUERY_KEY, 'byCategory', effectiveCategoryId, undefined],
          exact: false
        })
        // Invalidate with just categoryId (no budgetId in key)
        await queryClient.invalidateQueries({ 
          queryKey: [BUDGET_ITEMS_QUERY_KEY, 'byCategory', effectiveCategoryId],
          exact: false
        })
      }
      
      // Force refetch all matching queries (this will refetch even disabled queries if they match)
      await queryClient.refetchQueries({ 
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false,
        type: 'active' // Only refetch active queries
      })
      
      // Also try to refetch inactive queries by matching the pattern
      if (effectiveCategoryId) {
        await queryClient.refetchQueries({ 
          queryKey: [BUDGET_ITEMS_QUERY_KEY, 'byCategory', effectiveCategoryId],
          exact: false,
          type: 'all' // Refetch all matching queries including inactive ones
        })
      }
      
      console.log('[useCreateBudgetItem] ✅ All queries invalidated and refetched')
      
      toast.success('Budget item created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget item')
    },
    retry: 2,
  })
}

// Hook for updating a budget item
export function useUpdateBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<BudgetItemRequest> }) =>
      budgetItemsService.updateBudgetItems(id, payload),
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch data
      const categoryId = variables.payload.budgetCategoryDTO?.id
      const budgetId = variables.payload.budgetDTO?.id
      
      console.log('[useUpdateBudgetItem] ✅ PUT Success - Invalidating queries')
      console.log('[useUpdateBudgetItem] categoryId:', categoryId, 'budgetId:', budgetId)
      
      // Invalidate all queries that start with BUDGET_ITEMS_QUERY_KEY
      queryClient.invalidateQueries({ 
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false
      })
      
      // Also explicitly invalidate the specific query keys
      if (categoryId) {
        queryClient.invalidateQueries({ 
          queryKey: [BUDGET_ITEMS_QUERY_KEY, 'byCategory', categoryId, budgetId],
          exact: false
        })
        queryClient.invalidateQueries({ 
          queryKey: [BUDGET_ITEMS_QUERY_KEY, 'byCategory', categoryId],
          exact: false
        })
      }
      
      toast.success('Budget item updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget item')
    },
    retry: 2,
  })
}

// Hook for deleting a budget item
export function useDeleteBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => budgetItemsService.deleteBudgetItems(id),
    onSuccess: () => {
      // Invalidate all budget items queries to refetch
      console.log('[useDeleteBudgetItem] ✅ DELETE Success - Invalidating all queries')
      queryClient.invalidateQueries({ 
        queryKey: [BUDGET_ITEMS_QUERY_KEY],
        exact: false
      })
      
      toast.success('Budget item deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget item')
    },
    retry: 0, // Disable retry to prevent multiple calls
  })
}

// Hook to refresh budget items
export function useRefreshBudgetItems() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [BUDGET_ITEMS_QUERY_KEY] })
  }, [queryClient])
}

