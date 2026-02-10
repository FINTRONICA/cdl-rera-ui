import { apiClient } from '@/lib/apiClient'
import { buildApiUrl, API_ENDPOINTS } from '@/constants/apiEndpoints'
import { BudgetItemRequest, BudgetItemResponse } from '@/utils/budgetMapper'
import type { PaginatedResponse } from '@/types'

// Re-export types from mapper
export type { BudgetItemRequest, BudgetItemResponse } from '@/utils/budgetMapper'

// ---------- Service ----------
class BudgetItemsService {
  async getBudgetItemsById(
    id: number
  ): Promise<BudgetItemResponse> {
    try {
      // Validate input
      if (!id || isNaN(id) || id <= 0) {
        console.error('[BudgetItemsService] ❌ Invalid id:', id)
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
      
      console.log('[BudgetItemsService] ✅ Budget item fetched:', {
        id: budgetItem.id,
        subCategoryCode: budgetItem.subCategoryCode,
        serviceCode: budgetItem.serviceCode,
      })
      
      return budgetItem
    } catch (error) {
      console.error('[BudgetItemsService] ❌ ERROR in getBudgetItemsById')
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
        console.error('[BudgetItemsService] ❌ Invalid id:', id)
        throw new Error(`Invalid budget item id: ${id}`)
      }

      if (!payload) {
        console.error('[BudgetItemsService] ❌ Payload is required')
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
      
      console.log('[BudgetItemsService] ✅ Budget item updated:', {
        id: response.id,
        subCategoryCode: response.subCategoryCode,
        serviceCode: response.serviceCode,
      })
      
      return response
    } catch (error) {
      console.error('[BudgetItemsService] ❌ ERROR in updateBudgetItems')
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
        console.error('[BudgetItemsService] ❌ Invalid id:', id)
        throw new Error(`Invalid budget item id: ${id}`)
      }

      const url = buildApiUrl(
        API_ENDPOINTS.BUDGET_ITEM.SOFT_DELETE(id.toString())
      )
      
      console.log('[BudgetItemsService] ===== deleteBudgetItems =====')
      console.log('[BudgetItemsService] URL:', url)
      console.log('[BudgetItemsService] ID:', id)
      
      await apiClient.delete(url)
      
      console.log('[BudgetItemsService] ✅ Budget item deleted:', id)
    } catch (error) {
      console.error('[BudgetItemsService] ❌ ERROR in deleteBudgetItems')
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
        console.error('[BudgetItemsService] ❌ Payload is required')
        throw new Error('Payload is required for create')
      }

      // Validate required fields
      if (!payload.subCategoryCode || !payload.serviceCode || !payload.budgetCategoryDTO?.id) {
        console.error('[BudgetItemsService] ❌ Missing required fields in payload')
        throw new Error('Missing required fields: subCategoryCode, serviceCode, or budgetCategoryDTO.id')
      }

      const url = buildApiUrl(API_ENDPOINTS.BUDGET_ITEM.SAVE)
      
      console.log('[BudgetItemsService] ===== createBudgetItems =====')
      console.log('[BudgetItemsService] URL:', url)
      console.log('[BudgetItemsService] Payload:', JSON.stringify(payload, null, 2))
      
      const response = await apiClient.post<BudgetItemResponse>(url, payload)
      
      console.log('[BudgetItemsService] ✅ Budget item created:', {
        id: response.id,
        subCategoryCode: response.subCategoryCode,
        serviceCode: response.serviceCode,
        budgetCategoryDTO: response.budgetCategoryDTO,
        budgetDTO: response.budgetDTO,
      })
      
      return response
    } catch (error) {
      console.error('[BudgetItemsService] ❌ ERROR in createBudgetItems')
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
      // ✅ FIX: budgetId is now required for filtering (not budgetCategoryId)
      if (!budgetId || isNaN(budgetId) || budgetId <= 0) {
        console.error('[BudgetItemsService] ❌ Invalid budgetId:', budgetId)
        throw new Error(`Invalid budgetId: ${budgetId}`)
      }

      // ✅ FIX: Use base endpoint without query params, then construct full query string properly
      const baseEndpoint = '/budget-item'
      
      // ✅ FIX: Build query parameters - Use budgetId.equals (NOT budgetDTO.id.equals or budgetCategoryDTO.id.equals)
      const queryParams = new URLSearchParams()
      queryParams.append('enabled.equals', 'true')
      queryParams.append('deleted.equals', 'false')
      queryParams.append('budgetId.equals', budgetId.toString()) // ✅ Correct parameter name
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())
      
      const fullUrl = `${buildApiUrl(baseEndpoint)}?${queryParams.toString()}`
      
      console.log('[BudgetItemsService] ===== getBudgetItemsByBudgetCategoryId =====')
      console.log('[BudgetItemsService] Base endpoint:', baseEndpoint)
      console.log('[BudgetItemsService] Full URL:', fullUrl)
      console.log('[BudgetItemsService] Query params:', queryParams.toString())
      console.log('[BudgetItemsService] budgetCategoryId (deprecated, not used):', budgetCategoryId)
      console.log('[BudgetItemsService] budgetId (used for filtering):', budgetId, 'Type:', typeof budgetId)
      console.log('[BudgetItemsService] page:', page, 'size:', size)
      
      const data = await apiClient.get<PaginatedResponse<BudgetItemResponse>>(fullUrl)
      
      console.log('[BudgetItemsService] Raw Response received')
      console.log('[BudgetItemsService] Response type:', typeof data)
      console.log('[BudgetItemsService] Is Array?', Array.isArray(data))
      console.log('[BudgetItemsService] Has content property?', data && typeof data === 'object' && 'content' in data)
      
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
        
        console.log('[BudgetItemsService] ✅ Extracted content array from paginated response')
        console.log('[BudgetItemsService] Content length:', content.length)
        console.log('[BudgetItemsService] Page info:', pageInfo)
        console.log('[BudgetItemsService] Total elements:', pageInfo.totalElements)
        
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
          console.log('[BudgetItemsService] ⚠️ No items found for categoryId:', budgetCategoryId)
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
        console.log('[BudgetItemsService] ⚠️ Response is direct array (unexpected format)')
        console.log('[BudgetItemsService] Array length:', arrayResponse.length)
        
        // Validate items match the requested category
        const filteredItems = arrayResponse.filter(item => 
          item.budgetCategoryDTO?.id === budgetCategoryId
        )
        
        if (filteredItems.length !== arrayResponse.length) {
          console.warn('[BudgetItemsService] ⚠️ Some items in array response do not match categoryId')
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
      console.warn('[BudgetItemsService] ❌ Unexpected response format')
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
      console.error('[BudgetItemsService] ❌ ERROR in getBudgetItemsByBudgetCategoryId')
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
      // ✅ FIX: Use base endpoint without query params, then construct full query string properly
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
export const budgetItemsService = new BudgetItemsService()
export { BudgetItemsService }
