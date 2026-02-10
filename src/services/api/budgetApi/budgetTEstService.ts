import type { MasterBudgetData } from '@/types/budget'
import { budgetCategoryService, BudgetCategoryService, type BudgetCategoryResponse } from './budgetCategoryService'

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
export interface BudgetUIData extends Record<string, unknown> {
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
class BudgetService {
  static async getBudgets(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<BudgetUIData>> {
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

  async getBudgetById(id: number): Promise<BudgetUIData> {
    const url = buildApiUrl(
      API_ENDPOINTS.BUDGET.GET_BY_ID(id.toString())
    )
    const data = await apiClient.get<BudgetResponse>(url)
    return mapBudget(data) as BudgetUIData
  }

  async updateBudget(
    id: number,
    payload: Partial<BudgetRequest>
  ): Promise<BudgetUIData> {
    const url = buildApiUrl(API_ENDPOINTS.BUDGET.UPDATE(id.toString()))
    const response = await apiClient.put<BudgetResponse>(url, payload)
    return mapBudget(response) as BudgetUIData
  }

  static async deleteBudget(id: number): Promise<void> {
    const url = buildApiUrl(
      API_ENDPOINTS.BUDGET.SOFT_DELETE(id.toString())
    )
    await apiClient.delete(url)
  }

  async createBudget(payload: BudgetRequest): Promise<BudgetUIData> {
    const url = buildApiUrl(API_ENDPOINTS.BUDGET.SAVE)
    const response = await apiClient.post<BudgetResponse>(url, payload)
    return mapBudget(response) as BudgetUIData
  }
}

// Export service instance
export const budgetService = new BudgetService()
export { BudgetService }
