/**
 * Tabs Service
 * 
 * Centralized service for managing tab configurations, module mappings,
 * and navigation paths for activities pages (pending/involved).
 */

export type TabId = 
  | 'assetsRegistry' 
  | 'managementFirms' 
  | 'ownerRegistry' 
  | 'payments' 
  | 'budget'
  | 'budgetCategory'

export type ModuleName = 
  | 'ASSETS_REGISTRY' 
  | 'MANAGEMENT_FIRMS' 
  | 'OWNER_REGISTRY' 
  | 'PAYMENTS' 
  | 'BUDGET'
  | 'BUDGET_CATEGORY'

export interface Tab {
  id: TabId
  label: string
}

export interface TabConfig {
  tabId: TabId
  moduleName: ModuleName
  navigationPath: (id: string | number) => string
}

/**
 * Tab configuration array
 */
export const TABS: Tab[] = [
  { id: 'assetsRegistry', label: 'Asset Register' },
  { id: 'managementFirms', label: 'Management Firm' },
  { id: 'ownerRegistry', label: 'Owner Registry' },
  { id: 'payments', label: 'Payments' },
  { id: 'budget', label: 'Budget' },
  { id: 'budgetCategory', label: 'Budget Category' },
]

/**
 * Map tab ID to module name
 */
export const TAB_TO_MODULE_MAP: Record<TabId, ModuleName> = {
  assetsRegistry: 'ASSETS_REGISTRY',
  managementFirms: 'MANAGEMENT_FIRMS',
  ownerRegistry: 'OWNER_REGISTRY',
  payments: 'PAYMENTS',
  budget: 'BUDGET',
  budgetCategory: 'BUDGET_CATEGORY',
}

/**
 * Map module name to tab ID
 */
export const MODULE_TO_TAB_MAP: Record<ModuleName, TabId> = {
  ASSETS_REGISTRY: 'assetsRegistry',
  MANAGEMENT_FIRMS: 'managementFirms',
  OWNER_REGISTRY: 'ownerRegistry',
  PAYMENTS: 'payments',
  BUDGET: 'budget',
  BUDGET_CATEGORY: 'budgetCategory',
}

/**
 * Get module name from tab ID
 */
export function getModuleNameFromTabId(tabId: TabId): ModuleName | null {
  return TAB_TO_MODULE_MAP[tabId] || null
}

/**
 * Get tab ID from module name
 */
export function getTabIdFromModuleName(moduleName: ModuleName): TabId | null {
  return MODULE_TO_TAB_MAP[moduleName] || null
}

/**
 * Get navigation path for a specific tab and entity ID
 */
export function getNavigationPath(tabId: TabId, id: string | number): string {
  const navigationMap: Record<TabId, (id: string | number) => string> = {
    assetsRegistry: (id) => `/asset-registry/${id}/step/1?mode=view`,
    managementFirms: (id) => `/management-firms/${id}?mode=view`,
    ownerRegistry: (id) => `/owner-registry/${id}?mode=view`,
    payments: (id) => `/transactions/manual/new/${id}?step=0&mode=view`,
    budget: (id) => `/budgets/budget/${id}/step/1?mode=view`,
    budgetCategory: (id) => `/budgets/budget-category/${id}/step/1?mode=view`,
  }

  return navigationMap[tabId]?.(id) || '#'
}

/**
 * Get tab configuration for a given tab ID
 */
export function getTabConfig(tabId: TabId): TabConfig | null {
  const moduleName = getModuleNameFromTabId(tabId)
  if (!moduleName) return null

  return {
    tabId,
    moduleName,
    navigationPath: (id: string | number) => getNavigationPath(tabId, id),
  }
}

/**
 * Get all tab configurations
 */
export function getAllTabConfigs(): TabConfig[] {
  return TABS.map((tab) => getTabConfig(tab.id)).filter(
    (config): config is TabConfig => config !== null
  )
}

