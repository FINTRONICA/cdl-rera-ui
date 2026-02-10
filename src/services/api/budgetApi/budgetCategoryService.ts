import axios from 'axios'
import { apiClient } from '@/lib/apiClient'
import {
  buildApiUrl,
  API_ENDPOINTS,
  buildPaginationParams,
  API_CONFIG,
} from '@/constants/apiEndpoints'
import type { PaginatedResponse } from '@/types'

// DTO interfaces based on API response (nullable fields match API)
export interface BudgetDTO {
  id: number
  budgetId: string
  budgetName: string
  isActive: boolean
  budgetPeriodCode: string
  propertyGroupId: number
  propertyManagerEmail: string
  masterCommunityName: string
  masterCommunityNameLocale: string
  createdBy: string
  enabled: boolean
  deleted: boolean
  assetRegisterDTO?: unknown
  managementFirmDTO?: unknown
  budgetCategoriesDTOS?: unknown[]
}

export interface BudgetItemDTO {
  id: number
  subCategoryCode: string
  subCategoryName: string
  subCategoryNameLocale: string
  serviceCode: string
  provisionalServiceCode: string
  serviceName: string
  serviceNameLocale: string
  totalBudget: number
  availableBudget: number
  utilizedBudget: number
  enabled: boolean
  deleted: boolean
  budgetCategoryDTO?: { id: number; [key: string]: unknown }
  budgetDTO?: { id: number; [key: string]: unknown } | null
}

// ---------- Response DTO (matches GET /budget-category/:id and list content) ----------
export interface BudgetCategoryResponse {
  id: number
  serviceChargeGroupId: number
  serviceChargeGroupName: string
  serviceChargeGroupNameLocale: string | null
  usageLocale: string | null
  serviceName: string
  serviceCode: string
  provisionalBudgetCode: string
  chargeTypeId: number | null
  chargeType: string
  usage: string | null
  budgetPeriodFrom: string | null
  budgetPeriodTo: string | null
  budgetPeriodTitle: string | null
  categoryCode: string
  categoryName: string
  categoryNameLocale: string | null
  categorySubCode: string
  categorySubName: string
  categorySubToSubCode: string
  categorySubToSubName: string
  vatAmount: number | null
  enabled: boolean
  deleted: boolean
  budgetDTO?: unknown | null
  budgetItemDTOS?: BudgetItemDTO[] | unknown[]
  createdAt?: string
  updatedAt?: string
}

// ---------- Request DTO (POST /budget-category and PUT /budget-category/:id) ----------
export interface BudgetCategoryRequest {
  id?: number
  serviceChargeGroupId?: number
  serviceChargeGroupName?: string
  serviceChargeGroupNameLocale?: string | null
  usageLocale?: string | null
  serviceName: string
  serviceCode: string
  provisionalBudgetCode: string
  chargeTypeId?: number | null
  chargeType: string
  usage?: string | null
  budgetPeriodFrom?: string | null
  budgetPeriodTo?: string | null
  budgetPeriodTitle?: string | null
  categoryCode: string
  categoryName: string
  categoryNameLocale?: string | null
  categorySubCode?: string
  categorySubName?: string
  categorySubToSubCode?: string
  categorySubToSubName?: string
  vatAmount?: number | null
  enabled?: boolean
  deleted?: boolean
  budgetDTO?: unknown | null
  budgetItemDTOS?: BudgetItemDTO[] | unknown[]
}

/** Payload for creating a new budget category (POST). Only required/sent fields. */
export type BudgetCategoryCreatePayload = Partial<BudgetCategoryRequest> & Pick<
  BudgetCategoryRequest,
  'serviceName' | 'serviceCode' | 'provisionalBudgetCode' | 'chargeType' | 'categoryCode' | 'categoryName'
>

// ---------- UI Model ----------
export interface BudgetCategoryUIData extends Record<string, unknown> {
  id: number
  serviceChargeGroupId: number
  serviceChargeGroupName: string
  serviceChargeGroupNameLocale: string
  usageLocale: string
  serviceName: string
  serviceCode: string
  provisionalBudgetCode: string
  chargeTypeId: number
  chargeType: string
  usage: string
  budgetPeriodFrom: string
  budgetPeriodTo: string
  budgetPeriodTitle: string
  categoryCode: string
  categoryName: string
  categoryNameLocale: string
  categorySubCode: string
  categorySubName: string
  categorySubToSubCode: string
  categorySubToSubName: string
  vatAmount: number
  enabled: boolean
  deleted: boolean
  createdAt?: string
  updatedAt?: string
}

function mapBudgetCategoryToBudgetCategoryData(
  api: BudgetCategoryResponse
): BudgetCategoryUIData {
  const mapped: BudgetCategoryUIData = {
    id: api.id,
    serviceChargeGroupId: api.serviceChargeGroupId ?? 0,
    serviceChargeGroupName: api.serviceChargeGroupName ?? '',
    serviceChargeGroupNameLocale: api.serviceChargeGroupNameLocale ?? '',
    usageLocale: api.usageLocale ?? '',
    serviceName: api.serviceName ?? '',
    serviceCode: api.serviceCode ?? '',
    provisionalBudgetCode: api.provisionalBudgetCode ?? '',
    chargeTypeId: api.chargeTypeId ?? 0,
    chargeType: api.chargeType ?? '',
    usage: api.usage ?? '',
    budgetPeriodFrom: api.budgetPeriodFrom ?? '',
    budgetPeriodTo: api.budgetPeriodTo ?? '',
    budgetPeriodTitle: api.budgetPeriodTitle ?? '',
    categoryCode: api.categoryCode ?? '',
    categoryName: api.categoryName ?? '',
    categoryNameLocale: api.categoryNameLocale ?? '',
    categorySubCode: api.categorySubCode ?? '',
    categorySubName: api.categorySubName ?? '',
    categorySubToSubCode: api.categorySubToSubCode ?? '',
    categorySubToSubName: api.categorySubToSubName ?? '',
    vatAmount: api.vatAmount ?? 0,
    enabled: api.enabled ?? true,
    deleted: api.deleted ?? false,
  }
  if (api.createdAt != null) mapped.createdAt = api.createdAt
  if (api.updatedAt != null) mapped.updatedAt = api.updatedAt
  return mapped
}

// ---------- Service ----------
/**
 * Budget Category API service.
 * Endpoints: BUDGET_CATEGORY (GET_ALL, GET_BY_ID, SAVE, UPDATE, SOFT_DELETE).
 */
class BudgetCategoryService {
  /**
   * READ (List) – GET /budget-category?deleted.equals=false&enabled.equals=true&page=0&size=20
   * Returns paginated budget categories. Pagination: 0-based page, size per page.
   */
  static async getBudgetCategories(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<BudgetCategoryUIData>> {
    try {
      const baseUrl = buildApiUrl(API_ENDPOINTS.BUDGET_CATEGORY.GET_ALL)
      const pagination = buildPaginationParams(page, size)
      const query = new URLSearchParams(pagination).toString()
      const url = `${baseUrl}&${query}`

      const data =
        await apiClient.get<PaginatedResponse<BudgetCategoryResponse>>(url)

      if (data?.content && Array.isArray(data.content)) {
        const content = data.content.map(mapBudgetCategoryToBudgetCategoryData)
        const pageInfo = data.page ?? {}

        return {
          content,
          page: {
            size: pageInfo.size ?? size,
            number: pageInfo.number ?? page,
            totalElements: pageInfo.totalElements ?? content.length,
            totalPages:
              pageInfo.totalPages ??
              Math.ceil((pageInfo.totalElements ?? content.length) / size),
          },
        }
      }

      if (Array.isArray(data)) {
        const mappedData = (data as BudgetCategoryResponse[]).map(
          mapBudgetCategoryToBudgetCategoryData
        )
        return {
          content: mappedData,
          page: {
            size: mappedData.length,
            number: 0,
            totalElements: mappedData.length,
            totalPages: 1,
          },
        }
      }

      return {
        content: [],
        page: { size, number: page, totalElements: 0, totalPages: 0 },
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const data = err.response?.data
        const requestUrl =
          err.config?.baseURL && err.config?.url
            ? `${err.config.baseURL}${err.config.url}`
            : `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_ENDPOINTS.BUDGET_CATEGORY.GET_ALL}&page=${page}&size=${size}`
        const body =
          typeof data === 'string'
            ? data
            : data && typeof data === 'object'
              ? (data as { message?: string }).message ?? JSON.stringify(data)
              : '(empty or non-JSON response)'
        const msg =
          status === 500
            ? `Budget category list failed (500) at ${requestUrl}. Response: ${body}. If this works on another environment, set NEXT_PUBLIC_API_URL to that base (e.g. https://103.181.200.143:2022).`
            : `Budget category list failed (${status ?? 'network error'}). ${body}`
        throw new Error(msg)
      }
      throw err
    }
  }

  /**
   * READ (By ID) – GET /budget-category/:id
   */
  async getBudgetCategoryById(id: number | string): Promise<BudgetCategoryResponse> {
    const idStr = typeof id === 'number' ? id.toString() : id
    const url = buildApiUrl(API_ENDPOINTS.BUDGET_CATEGORY.GET_BY_ID(idStr))
    const data = await apiClient.get<BudgetCategoryResponse>(url)
    return data
  }

  /**
   * CREATE – POST /budget-category
   * Body: BudgetCategoryCreatePayload or BudgetCategoryRequest
   */
  async createBudgetCategory(
    payload: BudgetCategoryCreatePayload | BudgetCategoryRequest
  ): Promise<BudgetCategoryResponse> {
    const url = buildApiUrl(API_ENDPOINTS.BUDGET_CATEGORY.SAVE)
    const response = await apiClient.post<BudgetCategoryResponse>(url, payload)
    return response
  }

  /**
   * UPDATE – PUT /budget-category/:id
   * Body: partial BudgetCategoryRequest (only sent fields updated).
   */
  async updateBudgetCategory(
    id: number | string,
    payload: Partial<BudgetCategoryRequest>
  ): Promise<BudgetCategoryResponse> {
    const idStr = typeof id === 'number' ? id.toString() : id
    const url = buildApiUrl(API_ENDPOINTS.BUDGET_CATEGORY.UPDATE(idStr))
    const response = await apiClient.put<BudgetCategoryResponse>(url, payload)
    return response
  }

  /**
   * DELETE (soft) – DELETE /budget-category/soft/:id
   */
  static async deleteBudgetCategory(id: number | string): Promise<void> {
    const idStr = typeof id === 'number' ? id.toString() : id
    const url = buildApiUrl(API_ENDPOINTS.BUDGET_CATEGORY.SOFT_DELETE(idStr))
    await apiClient.delete(url)
  }
}

// Export service instance
export const budgetCategoryService = new BudgetCategoryService()
export { BudgetCategoryService }
