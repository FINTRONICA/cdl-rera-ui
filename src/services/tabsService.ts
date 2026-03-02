/**
 * Tabs Service
 * 
 * Centralized service for managing tab configurations, module mappings,
 * and navigation paths for activities pages (pending/involved).
 */

export type TabId = 
  | 'buildPartner' 
  | 'buildPartnerAsset' 
  | 'capitalPartner' 
  | 'payments' 
  | 'suretyBond'
  | 'budget'
  | 'budgetFirm'

export type ModuleName = 
  | 'BUILD_PARTNER' 
  | 'BUILD_PARTNER_ASSET' 
  | 'CAPITAL_PARTNER' 
  | 'PAYMENTS' 
  | 'SURETY_BOND'
  | 'BUDGET'
  | 'BUDGET_FIRM'

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
  { id: 'buildPartner', label: 'Asset Register' },
  { id: 'buildPartnerAsset', label: 'Management Firm' },
  { id: 'capitalPartner', label: 'Owner Registry' },
  { id: 'payments', label: 'Payments' },
  { id: 'suretyBond', label: 'Surety Bond' },
  { id: 'budget', label: 'Budget' },
  { id: 'budgetFirm', label: 'Budget Firm' },
]

/**
 * Map tab ID to module name
 */
export const TAB_TO_MODULE_MAP: Record<TabId, ModuleName> = {
  buildPartner: 'BUILD_PARTNER',
  buildPartnerAsset: 'BUILD_PARTNER_ASSET',
  capitalPartner: 'CAPITAL_PARTNER',
  payments: 'PAYMENTS',
  suretyBond: 'SURETY_BOND',
  budget: 'BUDGET',
  budgetFirm: 'BUDGET_FIRM',
}

/**
 * Map module name to tab ID
 */
export const MODULE_TO_TAB_MAP: Record<ModuleName, TabId> = {
  BUILD_PARTNER: 'buildPartner',
  BUILD_PARTNER_ASSET: 'buildPartnerAsset',
  CAPITAL_PARTNER: 'capitalPartner',
  PAYMENTS: 'payments',
  SURETY_BOND: 'suretyBond',
  BUDGET: 'budget',
  BUDGET_FIRM: 'budgetFirm',
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
    buildPartner: (id) => `/asset-registry/${id}/step/1?mode=view`,
    buildPartnerAsset: (id) => `/management-firms/${id}?mode=view`,
    capitalPartner: (id) => `/owner-registry/${id}?mode=view`,
    suretyBond: (id) => `/surety_bond/new/${id}?step=0&mode=view`,
    payments: (id) => `/transactions/manual/new/${id}?step=0&mode=view`,
    budget: (id) => `/budgets/budget/${id}/step/1?mode=view`,
    budgetFirm: (id) => `/budgets/budge-firm/${id}/step/1?mode=view`,
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

