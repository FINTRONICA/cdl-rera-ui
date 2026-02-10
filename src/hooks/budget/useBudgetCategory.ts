import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  budgetCategoryService,
  BudgetCategoryService,
  type BudgetCategoryRequest,
  type BudgetCategoryCreatePayload,
} from '@/services/api/budgetApi/budgetCategoryService'
import { toast } from 'react-hot-toast'

const BUDGET_CATEGORIES_QUERY_KEY = 'budgetCategories'

export function useBudgetCategories(page = 0, size = 20) {
  return useQuery({
    queryKey: [BUDGET_CATEGORIES_QUERY_KEY, page, size],
    queryFn: () => BudgetCategoryService.getBudgetCategories(page, size),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useBudgetCategory(id: number | string | null) {
  return useQuery({
    queryKey: ['budgetCategory', id],
    queryFn: () => budgetCategoryService.getBudgetCategoryById(id!),
    enabled: id != null && id !== '',
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateBudgetCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BudgetCategoryCreatePayload | BudgetCategoryRequest) =>
      budgetCategoryService.createBudgetCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_CATEGORIES_QUERY_KEY] })
      toast.success('Budget category created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget category')
    },
  })
}

export function useUpdateBudgetCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string
      payload: Partial<BudgetCategoryRequest>
    }) => budgetCategoryService.updateBudgetCategory(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_CATEGORIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['budgetCategory', variables.id] })
      toast.success('Budget category updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget category')
    },
  })
}

export function useDeleteBudgetCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) =>
      BudgetCategoryService.deleteBudgetCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_CATEGORIES_QUERY_KEY] })
      toast.success('Budget category deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget category')
    },
  })
}

