import type { MasterBudgetData } from '@/types/budget'
import { budgetCategoryService, BudgetCategoryService, type BudgetCategoryResponse } from './budgetCategoryService'
import { BudgetItemRequest, BudgetItemResponse } from '@/utils/budgetMapper'

// Master Budget Service - uses BUDGET_CATEGORY endpoints
// Maps Master Budget UI structure to Budget Category API structure
class MasterBudgetService {
  /**
   * List all master budgets (using budget category endpoint)
   */
  async listBudgets(): Promise<MasterBudgetData[]> {
    try {
      const response = await BudgetCategoryService.getBudgetCategories(0, 1000)
      const mappedData = response.content.map(this.mapToMasterBudgetData)
      return mappedData
    } catch (error) {
      throw error
    }
  }

  /**
   * Get master budget by ID
   */
  async getBudgetById(id: string): Promise<MasterBudgetData> {
    try {
      const numericId = Number(id)
      const response = await budgetCategoryService.getBudgetCategoryById(numericId)
      return this.mapToMasterBudgetData(response)
    } catch (error) {
      throw error
    }
  }

  /**
   * Create a new master budget
   */
  async createBudget(payload: any): Promise<{ id: string }> {
    try {
      const response = await budgetCategoryService.createBudgetCategory(payload)
      return { id: response.id.toString() }
    } catch (error) {
      throw error
    }
  }

  /**
   * Update an existing master budget
   */
  async updateBudget(id: string, payload: any): Promise<void> {
    try {
      await budgetCategoryService.updateBudgetCategory(Number(id), payload)
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete a master budget
   */
  async deleteBudget(id: string): Promise<void> {
    try {
      await BudgetCategoryService.deleteBudgetCategory(Number(id))
    } catch (error) {
      throw error
    }
  }

  /**
   * Map Budget Category API response to Master Budget UI data
   */
  private mapToMasterBudgetData(bc: BudgetCategoryResponse): MasterBudgetData {
    return {
      id: bc.id.toString(),
      chargeTypeId: bc.chargeTypeId,
      chargeType: bc.chargeType || '-',
      groupName: bc.serviceChargeGroupName || '-',
      categoryCode: bc.categoryCode || '-',
      categoryName: bc.categoryName || '-',
      categorySubCode: bc.categorySubCode || '-',
      categorySubName: bc.categorySubName || '-',
      categorySubToSubCode: bc.categorySubToSubCode || '-',
      categorySubToSubName: bc.categorySubToSubName || '-',
      serviceCode: bc.serviceCode || '-',
      serviceName: bc.serviceName || '-',
      provisionalBudgetCode: bc.provisionalBudgetCode || '-',
    }
  }
}

// Export singleton instance
export const masterBudgetService = new MasterBudgetService()
export { MasterBudgetService }




import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { PaginatedResponse } from '@/types'
import { 
  mapBudget, 
  BudgetResponse, 
  BudgetRequest 
} from '@/utils/budgetMapper'
import { BudgetCategoryUIData } from './budgetCategoryService'

// Re-export types from mapper
export type { BudgetResponse, BudgetRequest } from '@/utils/budgetMapper'

// ---------- UI Model ----------
export interface BudgetManagementUIData extends Record<string, unknown> {
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
  assetRegisterDTO: any
  managementFirmDTO: any
  budgetCategoriesDTOS: BudgetCategoryUIData[]
  // UI display fields
  managementFirmGroupName?: string
  managementCompanyName?: string
  budgetPeriodTitle?: string
  budgetPeriodRange?: string
  serviceChargeGroupName?: string
  totalCostDisplay?: number
}

// ---------- Service ----------
class BudgetManagementService {
  static async getBudgetManagements(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<BudgetManagementUIData>> {
    try {
      const baseUrl = buildApiUrl(API_ENDPOINTS.BUDGET.GET_ALL)
      const url = `${baseUrl}&page=${page}&size=${size}`

      const data =
        await apiClient.get<PaginatedResponse<BudgetResponse>>(url)

      // Handle different response formats
      if ((data as any).content && Array.isArray((data as any).content)) {
        // Spring Boot style pagination response
        const content = (data as any).content.map(
          mapBudget
        )
        const pageInfo = (data as any).page || {}

        const result = {
          content,
          page: {
            size: pageInfo.size || size,
            number: pageInfo.number || page,
            totalElements: pageInfo.totalElements || content.length,
            totalPages:
              pageInfo.totalPages ||
              Math.ceil((pageInfo.totalElements || content.length) / size),
          },
        }

        return result
      } else if (Array.isArray(data)) {
        // Simple array response (fallback)
        const mappedData = (data as any).map(mapBudget)
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

      // Empty response
      return {
        content: [],
        page: {
          size: size,
          number: page,
          totalElements: 0,
          totalPages: 0,
        },
      }
    } catch (error) {
      throw error
    }
  }

  async getBudgetManagementById(id: number): Promise<BudgetManagementUIData> {
    const url = buildApiUrl(
      API_ENDPOINTS.BUDGET.GET_BY_ID(id.toString())
    )
    const data = await apiClient.get<BudgetResponse>(url)
    return mapBudget(data) as BudgetManagementUIData
  }

  async updateBudgetManagement(
    id: number,
    payload: Partial<BudgetRequest>
  ): Promise<BudgetManagementUIData> {
    const url = buildApiUrl(API_ENDPOINTS.BUDGET.UPDATE(id.toString()))
    const response = await apiClient.put<BudgetResponse>(url, payload)
    return mapBudget(response) as BudgetManagementUIData
  }

  static async deleteBudgetManagement(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.BUDGET.SOFT_DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async createBudgetManagement(payload: BudgetRequest): Promise<BudgetManagementUIData> {
    const url = buildApiUrl(API_ENDPOINTS.BUDGET.SAVE)
    const response = await apiClient.post<BudgetResponse>(url, payload)
    return mapBudget(response) as BudgetManagementUIData
  }

  async getBudgetItemsById(
    id: number
  ): Promise<BudgetItemResponse> {
    try {
      // Validate input
      if (!id || isNaN(id) || id <= 0) {
        console.error('[BudgetItemsService]  Invalid id:', id)
        throw new Error(`Invalid budget item id: ${id}`)
      }

      const url = buildApiUrl(
        API_ENDPOINTS.BUDGET_ITEM.GET_BY_ID(id.toString())
      )
      
      console.log('[BudgetItemsService] ===== getBudgetItemsById =====')
      console.log('[BudgetItemsService] URL:', url)
      console.log('[BudgetItemsService] ID:', id)
      
      // The endpoint uses query parameters, so it might return paginated response or array
      const data = await apiClient.get<BudgetItemResponse | BudgetItemResponse[] | PaginatedResponse<BudgetItemResponse>>(url)
      
      // Handle different response formats
      let budgetItem: BudgetItemResponse
      
      if (Array.isArray(data)) {
        // If response is an array, get the first item
        if (data.length === 0) {
          throw new Error(`Budget item with id ${id} not found`)
        }
        const firstItem = data[0]
        if (!firstItem) {
          throw new Error(`Budget item with id ${id} not found`)
        }
        budgetItem = firstItem
      } else if (data && typeof data === 'object' && 'content' in data) {
        // If response is paginated, get the first item from content
        const paginatedData = data as PaginatedResponse<BudgetItemResponse>
        if (!paginatedData.content || paginatedData.content.length === 0) {
          throw new Error(`Budget item with id ${id} not found`)
        }
        const firstItem = paginatedData.content[0]
        if (!firstItem) {
          throw new Error(`Budget item with id ${id} not found`)
        }
        budgetItem = firstItem
      } else {
        // If response is a single object
        budgetItem = data as BudgetItemResponse
      }
      
      console.log('[BudgetItemsService]  Budget item fetched:', {
        id: budgetItem.id,
        subCategoryCode: budgetItem.subCategoryCode,
        serviceCode: budgetItem.serviceCode,
      })
      
      return budgetItem
    } catch (error) {
      console.error('[BudgetItemsService]  ERROR in getBudgetItemsById')
      console.error('[BudgetItemsService] id:', id)
      console.error('[BudgetItemsService] Error:', error)
      throw error
    }
  }

  async updateBudgetItems(
    id: number,
    payload: Partial<BudgetItemRequest>
  ): Promise<BudgetItemResponse> {
    try {
      // Validate input
      if (!id || isNaN(id) || id <= 0) {
        console.error('[BudgetItemsService]  Invalid id:', id)
        throw new Error(`Invalid budget item id: ${id}`)
      }

      if (!payload) {
        console.error('[BudgetItemsService]  Payload is required')
        throw new Error('Payload is required for update')
      }

      const url = buildApiUrl(
        API_ENDPOINTS.BUDGET_ITEM.UPDATE(id.toString())
      )
      
      console.log('[BudgetItemsService] ===== updateBudgetItems =====')
      console.log('[BudgetItemsService] URL:', url)
      console.log('[BudgetItemsService] ID:', id)
      console.log('[BudgetItemsService] Payload:', JSON.stringify(payload, null, 2))
      
      const response = await apiClient.put<BudgetItemResponse>(url, payload)
      
      console.log('[BudgetItemsService]  Budget item updated:', {
        id: response.id,
        subCategoryCode: response.subCategoryCode,
        serviceCode: response.serviceCode,
      })
      
      return response
    } catch (error) {
      console.error('[BudgetItemsService]  ERROR in updateBudgetItems')
      console.error('[BudgetItemsService] id:', id)
      console.error('[BudgetItemsService] payload:', payload)
      console.error('[BudgetItemsService] Error:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('[BudgetItemsService] HTTP Status:', axiosError.response?.status)
        console.error('[BudgetItemsService] Error Response Data:', axiosError.response?.data)
      }
      
      throw error
    }
  }

  async deleteBudgetItems(id: number): Promise<void> {
    try {
      // Validate input
      if (!id || isNaN(id) || id <= 0) {
        console.error('[BudgetItemsService]  Invalid id:', id)
        throw new Error(`Invalid budget item id: ${id}`)
      }

      const url = buildApiUrl(
        API_ENDPOINTS.BUDGET_ITEM.SOFT_DELETE(id.toString())
      )
      
      console.log('[BudgetItemsService] ===== deleteBudgetItems =====')
      console.log('[BudgetItemsService] URL:', url)
      console.log('[BudgetItemsService] ID:', id)
      
      await apiClient.delete(url)
      
      console.log('[BudgetItemsService]  Budget item deleted:', id)
    } catch (error) {
      console.error('[BudgetItemsService]  ERROR in deleteBudgetItems')
      console.error('[BudgetItemsService] id:', id)
      console.error('[BudgetItemsService] Error:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('[BudgetItemsService] HTTP Status:', axiosError.response?.status)
        console.error('[BudgetItemsService] Error Response Data:', axiosError.response?.data)
      }
      
      throw error
    }
  }

  async createBudgetItems(
    payload: BudgetItemRequest
  ): Promise<BudgetItemResponse> {
    try {
      // Validate input
      if (!payload) {
        console.error('[BudgetItemsService]  Payload is required')
        throw new Error('Payload is required for create')
      }

      // Validate required fields
      if (!payload.subCategoryCode || !payload.serviceCode || !payload.budgetCategoryDTO?.id) {
        console.error('[BudgetItemsService]  Missing required fields in payload')
        throw new Error('Missing required fields: subCategoryCode, serviceCode, or budgetCategoryDTO.id')
      }

      const url = buildApiUrl(API_ENDPOINTS.BUDGET_ITEM.SAVE)
      
      console.log('[BudgetItemsService] ===== createBudgetItems =====')
      console.log('[BudgetItemsService] URL:', url)
      console.log('[BudgetItemsService] Payload:', JSON.stringify(payload, null, 2))
      
      const response = await apiClient.post<BudgetItemResponse>(url, payload)
      
      console.log('[BudgetItemsService]  Budget item created:', {
        id: response.id,
        subCategoryCode: response.subCategoryCode,
        serviceCode: response.serviceCode,
        budgetCategoryDTO: response.budgetCategoryDTO,
        budgetDTO: response.budgetDTO,
      })
      
      return response
    } catch (error) {
      console.error('[BudgetItemsService]  ERROR in createBudgetItems')
      console.error('[BudgetItemsService] payload:', payload)
      console.error('[BudgetItemsService] Error:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('[BudgetItemsService] HTTP Status:', axiosError.response?.status)
        console.error('[BudgetItemsService] Error Response Data:', axiosError.response?.data)
      }
      
      throw error
    }
  }

  async getBudgetItemsByBudgetCategoryId(
    budgetCategoryId: number,
    page = 0,
    size = 20,
    budgetId?: number
  ): Promise<PaginatedResponse<BudgetItemResponse>> {
    try {
      //  FIX: budgetId is now required for filtering (not budgetCategoryId)
      if (!budgetId || isNaN(budgetId) || budgetId <= 0) {
        console.error('[BudgetItemsService]  Invalid budgetId:', budgetId)
        throw new Error(`Invalid budgetId: ${budgetId}`)
      }

      //  FIX: Use base endpoint without query params, then construct full query string properly
      const baseEndpoint = '/budget-item'
      
      //  FIX: Build query parameters - Use budgetId.equals (NOT budgetDTO.id.equals or budgetCategoryDTO.id.equals)
      const queryParams = new URLSearchParams()
      queryParams.append('enabled.equals', 'true')
      queryParams.append('deleted.equals', 'false')
      queryParams.append('budgetId.equals', budgetId.toString()) //  Correct parameter name
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())
      
      const fullUrl = `${buildApiUrl(baseEndpoint)}?${queryParams.toString()}`
      
     
      
      const data = await apiClient.get<PaginatedResponse<BudgetItemResponse>>(fullUrl)
     
      // Handle different response formats
      interface ResponseWithContent {
        content?: BudgetItemResponse[]
        page?: {
          size?: number
          number?: number
          totalElements?: number
          totalPages?: number
        }
      }
      
      const responseData = data as ResponseWithContent
      if (responseData && responseData.content && Array.isArray(responseData.content)) {
        // Spring Boot style pagination response
        const content = responseData.content
        const pageInfo = responseData.page || {}

        // Log first item sample for debugging
        if (content.length > 0 && content[0]) {
          const firstItem = content[0]
          console.log('[BudgetItemsService] First item sample:', {
            id: firstItem.id,
            subCategoryCode: firstItem.subCategoryCode,
            serviceCode: firstItem.serviceCode,
            serviceName: firstItem.serviceName,
            budgetCategoryDTO: firstItem.budgetCategoryDTO ? {
              id: firstItem.budgetCategoryDTO.id,
              enabled: firstItem.budgetCategoryDTO.enabled
            } : null
          })
        } else {
          console.log('[BudgetItemsService] No items found for categoryId:', budgetCategoryId)
        }
        
        const result: PaginatedResponse<BudgetItemResponse> = {
          content,
          page: {
            size: pageInfo.size || size,
            number: pageInfo.number || page,
            totalElements: pageInfo.totalElements || content.length,
            totalPages:
              pageInfo.totalPages ||
              Math.ceil((pageInfo.totalElements || content.length) / size),
          },
        }
        
        return result
      } else if (Array.isArray(data)) {
        // Simple array response (fallback)
        const arrayResponse = data as BudgetItemResponse[]
        console.log('[BudgetItemsService] Response is direct array (unexpected format)')
        console.log('[BudgetItemsService] Array length:', arrayResponse.length)
        
        // Validate items match the requested category
        const filteredItems = arrayResponse.filter(item => 
          item.budgetCategoryDTO?.id === budgetCategoryId
        )
        
        if (filteredItems.length !== arrayResponse.length) {
          console.warn('[BudgetItemsService] Some items in array response do not match categoryId')
        }
        
        return {
          content: filteredItems,
          page: {
            size: filteredItems.length,
            number: 0,
            totalElements: filteredItems.length,
            totalPages: 1,
          },
        }
      }
      
      // Empty response
      console.warn('[BudgetItemsService]  Unexpected response format')
      console.warn('[BudgetItemsService] Response:', data)
      console.warn('[BudgetItemsService] Response keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A')
      
      return {
        content: [],
        page: {
          size: size,
          number: page,
          totalElements: 0,
          totalPages: 0,
        },
      }
    } catch (error) {
      console.error('[BudgetItemsService]  ERROR in getBudgetItemsByBudgetCategoryId')
      console.error('[BudgetItemsService] budgetCategoryId:', budgetCategoryId)
      console.error('[BudgetItemsService] Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('[BudgetItemsService] Error message:', error instanceof Error ? error.message : String(error))
      
      if (error instanceof Error) {
        console.error('[BudgetItemsService] Error stack:', error.stack)
      }
      
      // Log the full error object if available
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } }
        console.error('[BudgetItemsService] HTTP Status:', axiosError.response?.status)
        console.error('[BudgetItemsService] Error Response Data:', axiosError.response?.data)
      }
      
      throw error
    }
  }

  async getAllBudgetItems(
    page: number = 0,
    size: number = 1000,
    filters?: Record<string, string>
  ): Promise<{ content: BudgetItemResponse[]; page: { size: number; number: number; totalElements: number; totalPages: number } }> {
    try {
      //  FIX: Use base endpoint without query params, then construct full query string properly
      const baseEndpoint = '/budget-item'
      const queryParams = new URLSearchParams({
        'deleted.equals': 'false',
        'enabled.equals': 'true',
        page: page.toString(),
        size: size.toString(),
        ...(filters || {}),
      })
      const fullUrl = `${buildApiUrl(baseEndpoint)}?${queryParams.toString()}`
      console.log('[BudgetItemsService] getAllBudgetItems - Full URL:', fullUrl)
      
      const response = await apiClient.get<{ 
        content: BudgetItemResponse[]
        page: { 
          size: number
          number: number
          totalElements: number
          totalPages: number
        }
      }>(fullUrl)
      
      console.log('[BudgetItemsService] getAllBudgetItems - Response:', response)
      return response
    } catch (error) {
      console.error('[BudgetItemsService] getAllBudgetItems - Error:', error)
      throw error
    }
  }

  async findAllBudgetItems(): Promise<BudgetItemResponse[]> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.BUDGET_ITEM.FIND_ALL)
      console.log('[BudgetItemsService] findAllBudgetItems - URL:', url)
      
      const response = await apiClient.get<BudgetItemResponse[]>(url)
      console.log('[BudgetItemsService] findAllBudgetItems - Response:', response)
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('[BudgetItemsService] findAllBudgetItems - Error:', error)
      throw error
    }
  }

  async getBudgetItemData(id: number): Promise<Record<string, unknown>> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.BUDGET_ITEM.GET_DATA(id.toString()))
      console.log('[BudgetItemsService] getBudgetItemData - URL:', url)
      
      const response = await apiClient.get<Record<string, unknown>>(url)
      console.log('[BudgetItemsService] getBudgetItemData - Response:', response)
      return response
    } catch (error) {
      console.error('[BudgetItemsService] getBudgetItemData - Error:', error)
      throw error
    }
  }

  async uploadBudgetItem(file: File): Promise<Record<string, unknown>> {
    try {
      const url = buildApiUrl(API_ENDPOINTS.BUDGET_ITEM.UPLOAD)
      console.log('[BudgetItemsService] uploadBudgetItem - URL:', url)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await apiClient.post<Record<string, unknown>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log('[BudgetItemsService] uploadBudgetItem - Response:', response)
      return response
    } catch (error) {
      console.error('[BudgetItemsService] uploadBudgetItem - Error:', error)
      throw error
    }
  }
}

// Export service instance
export const budgetManagementService = new BudgetManagementService()
export { BudgetManagementService }

// Alias for list page: BudgetService / budgetService / BudgetUIData (BUDGET API)
export type BudgetUIData = BudgetManagementUIData

class BudgetService {
  static async getBudgets(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<BudgetUIData>> {
    return BudgetManagementService.getBudgetManagements(page, size)
  }

  static async deleteBudget(id: number): Promise<void> {
    return BudgetManagementService.deleteBudgetManagement(id)
  }

  async getBudgetById(id: number): Promise<BudgetUIData> {
    return budgetManagementService.getBudgetManagementById(id)
  }

  /**
   * Update existing budget (BUDGET API)
   * Thin wrapper around BudgetManagementService.updateBudgetManagement
   */
  async updateBudget(
    id: number,
    payload: Partial<BudgetRequest>
  ): Promise<BudgetUIData> {
    return budgetManagementService.updateBudgetManagement(id, payload)
  }

  /**
   * Create new budget (BUDGET API)
   * Thin wrapper around BudgetManagementService.createBudgetManagement
   */
  async createBudget(payload: BudgetRequest): Promise<BudgetUIData> {
    return budgetManagementService.createBudgetManagement(payload)
  }
}

export const budgetService = new BudgetService()
export { BudgetService }
