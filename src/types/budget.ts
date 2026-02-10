/**
 * Master Budget (Budget Category) UI data shape
 */

import { DocumentItem } from '@/components/organisms/DeveloperStepper/developerTypes'

export interface BudgetDropdownOption {
  id: string
  label: string
  description?: string
}

export interface BudgetPeriodOption {
  code: string
  title: string
  from: string
  to: string
}

export interface BudgetManagementFirmData {
  id?: string
  managementFirmGroupId: string
  managementFirmGroupName: string
  managementFirmGroupLocalName: string
  masterCommunityName: string
  masterCommunityLocalName: string
  managementCompanyId: string
  managementCompanyName: string
  managementCompanyLocalName: string
  managementFirmManagerEmail: string
  serviceChargeGroupId: string
  serviceChargeGroupName: string
  serviceChargeGroupLocalName: string
  budgetPeriodCode: string
  budgetPeriodTitle: string
  budgetPeriodFrom: string | null
  budgetPeriodTo: string | null
  categoryCode: string
  categoryName: string
  categoryLocalName: string
  subCategoryCode: string
  subCategoryName: string
  subCategoryLocalName: string
  serviceCode: string
  serviceName: string
  serviceLocalName: string
  totalCost: number
  vatAmount: number
}

export interface BudgetMasterData {
  id?: string
  chargeTypeId: number
  chargeType: string
  groupName: string
  categoryCode: string
  categoryName: string
  categorySubCode: string
  categorySubName: string
  categorySubToSubCode: string
  categorySubToSubName: string
  serviceName: string
  serviceCode: string
  provisionalBudgetCode: string
}

export interface BudgetMasterFormOptions {
  chargeTypes: BudgetDropdownOption[]
  groupNames: BudgetDropdownOption[]
  categories: BudgetDropdownOption[]
  categorySubs: BudgetDropdownOption[]
  categorySubToSubs: BudgetDropdownOption[]
  services: BudgetDropdownOption[]
}

export interface MasterBudgetData {
  id?: string
  chargeTypeId: number
  chargeType: string
  groupName: string
  categoryCode: string
  categoryName: string
  categorySubCode: string
  categorySubName: string
  categorySubToSubCode: string
  categorySubToSubName: string
  serviceName: string
  serviceCode: string
  provisionalBudgetCode: string
  documents?: DocumentItem[]
  createdAt?: string
  updatedAt?: string
}

export interface BudgetData extends BudgetManagementFirmData {
  documents?: DocumentItem[]
  budgetMasterData: BudgetMasterData[]
  createdAt?: string
  updatedAt?: string
}

export interface BudgetFormOptions {
  managementFirmGroups: BudgetDropdownOption[]
  serviceChargeGroups: BudgetDropdownOption[]
  categories: BudgetDropdownOption[]
  subCategories: BudgetDropdownOption[]
  services: BudgetDropdownOption[]
  budgetPeriods: BudgetPeriodOption[]
}

export interface BudgetSaveResponse {
  id: string
  referenceCode: string
  data: BudgetData
}

export interface MasterBudgetSaveResponse {
  id: string
  referenceCode: string
  data: MasterBudgetData
}


