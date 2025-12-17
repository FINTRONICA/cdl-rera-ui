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

export type ModuleName = 
  | 'BUILD_PARTNER' 
  | 'BUILD_PARTNER_ASSET' 
  | 'CAPITAL_PARTNER' 
  | 'PAYMENTS' 
  | 'SURETY_BOND'

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
  { id: 'buildPartner', label: 'Build Partner' },
  { id: 'buildPartnerAsset', label: 'Build Partner Asset' },
  { id: 'capitalPartner', label: 'Capital Partner' },
  { id: 'payments', label: 'Payments' },
  { id: 'suretyBond', label: 'Surety Bond' },
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
    buildPartner: (id) => `/build-partner/${id}/step/1?mode=view`,
    buildPartnerAsset: (id) => `/build-partner-assets/${id}?mode=view`,
    capitalPartner: (id) => `/capital-partner/${id}?mode=view`,
    suretyBond: (id) => `/surety_bond/new/${id}?step=0&mode=view`,
    payments: (id) => `/transactions/manual/new/${id}?step=0&mode=view`,
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

