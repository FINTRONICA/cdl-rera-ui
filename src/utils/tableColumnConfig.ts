/**
 * Table Column Configuration Utility
 * 
 * Generates dynamic table columns based on active tab and page type.
 * Each tab/module has different fields that should be displayed.
 */

import React from 'react'
import type { TabId } from '@/services/tabsService'
import type { ActivityPageType } from '@/hooks/useTabData'
import { displayValue } from '@/utils/nullHandling'
import { truncateWords } from '@/utils'

export interface TableColumn {
  key: string
  label: string
  type: 'text' | 'status' | 'actions' | 'checkbox' | 'custom' | 'select' | 'date' | 'expand' | 'user' | 'comment'
  width: string
  sortable: boolean
  render?: (value: string | number | null | undefined) => React.ReactNode
}

type GetLabelFunction = (configId: string) => string

/**
 * Get base columns that are common across all tabs
 */
function getBaseColumns(
  getLabel: GetLabelFunction,
  pageType: ActivityPageType
): TableColumn[] {
  const baseColumns: TableColumn[] = [
    {
      key: 'moduleName',
      label: getLabel('MODULE_NAME'),
      type: 'text',
      width: 'w-40',
      sortable: true,
      render: (value) => truncateWords(value, 15),
    },
    {
      key: 'stageKey',
      label: getLabel('STAGE_KEY'),
      type: 'text',
      width: 'w-30',
      sortable: true,
      render: (value) => displayValue(value),
    },
  ]

  // Add stageName for involved page
  if (pageType === 'involved') {
    baseColumns.push({
      key: 'stageName',
      label: getLabel('STAGE_NAME'),
      type: 'text',
      width: 'w-40',
      sortable: true,
      render: (value) => truncateWords(value, 15),
    })
  }

  return baseColumns
}

/**
 * Get module-specific columns based on tab ID
 */
function getModuleSpecificColumns(
  tabId: TabId,
  getLabel: GetLabelFunction,
  pageType: ActivityPageType
): TableColumn[] {
  const columns: TableColumn[] = []

  switch (tabId) {
    case 'buildPartner':
      columns.push(
        {
          key: 'displayName',
          label: getLabel('BP_NAME'),
          type: 'text',
          width: 'w-40',
          sortable: true,
          render: (value) => truncateWords(value, 15),
        },
        {
          key: 'identifier',
          label: getLabel('BP_CIFRERA'),
          type: 'text',
          width: 'w-30',
          sortable: true,
          render: (value) => displayValue(value),
        }
      )
      break

    case 'buildPartnerAsset':
      columns.push(
        {
          key: 'displayName',
          label: 'Project Name',
          type: 'text',
          width: 'w-40',
          sortable: true,
          render: (value) => truncateWords(value, 15),
        },
        {
          key: 'identifier',
          label: 'Project ID',
          type: 'text',
          width: 'w-30',
          sortable: true,
          render: (value) => displayValue(value),
        }
      )
      break

    case 'capitalPartner':
      columns.push(
        {
          key: 'displayName',
          label: 'Investor Name',
          type: 'text',
          width: 'w-40',
          sortable: true,
          render: (value) => truncateWords(value, 15),
        },
        {
          key: 'identifier',
          label: 'Investor ID',
          type: 'text',
          width: 'w-30',
          sortable: true,
          render: (value) => displayValue(value),
        }
      )
      break

    case 'payments':
      columns.push(
        {
          key: 'displayName',
          label: 'Transaction ID',
          type: 'text',
          width: 'w-40',
          sortable: true,
          render: (value) => truncateWords(value, 15),
        },
        {
          key: 'identifier',
          label: 'Reference',
          type: 'text',
          width: 'w-30',
          sortable: true,
          render: (value) => displayValue(value),
        }
      )
      break

    case 'suretyBond':
      columns.push(
        {
          key: 'displayName',
          label: 'Bond Name',
          type: 'text',
          width: 'w-40',
          sortable: true,
          render: (value) => truncateWords(value, 15),
        },
        {
          key: 'identifier',
          label: 'Bond Number',
          type: 'text',
          width: 'w-30',
          sortable: true,
          render: (value) => displayValue(value),
        }
      )
      break
  }

  return columns
}

/**
 * Get common columns (amount, currency, etc.)
 */
function getCommonColumns(getLabel: GetLabelFunction): TableColumn[] {
  return [
    {
      key: 'amount',
      label: getLabel('AMOUNT'),
      type: 'text',
      width: 'w-24',
      sortable: true,
      render: (value) => displayValue(value),
    },
    {
      key: 'currency',
      label: getLabel('CURRENCY'),
      type: 'text',
      width: 'w-24',
      sortable: true,
      render: (value) => displayValue(value),
    },
  ]
}

/**
 * Get page-specific columns
 */
function getPageSpecificColumns(
  getLabel: GetLabelFunction,
  pageType: ActivityPageType
): TableColumn[] {
  const columns: TableColumn[] = []

  if (pageType === 'involved') {
    columns.push({
      key: 'myRemarks',
      label: getLabel('MY_REMARKS'),
      type: 'text',
      width: 'w-40',
      sortable: true,
      render: (value) => truncateWords(value, 15),
    })
  }

  return columns
}

/**
 * Get footer columns (createdAt, createdBy, status, actions)
 */
function getFooterColumns(
  getLabel: GetLabelFunction,
  pageType: ActivityPageType
): TableColumn[] {
  const columns: TableColumn[] = [
    {
      key: 'createdAt',
      label: getLabel('CREATED_AT'),
      type: 'text',
      width: 'w-28',
      sortable: true,
      render: (value) => displayValue(value),
    },
    {
      key: 'createdBy',
      label: getLabel('CREATED_BY'),
      type: 'text',
      width: 'w-32',
      sortable: true,
      render: (value) => displayValue(value),
    },
  ]

  // Status column
  if (pageType === 'pending') {
    columns.push({
      key: 'status',
      label: getLabel('STAGE_STATUS'),
      type: 'status',
      width: 'w-35',
      sortable: true,
    })
  } else {
    columns.push({
      key: 'stageStatus',
      label: getLabel('STAGE_STATUS'),
      type: 'status',
      width: 'w-35',
      sortable: true,
    })
  }

  // Actions column
  columns.push({
    key: 'actions',
    label: getLabel('ACTIONS'),
    type: 'actions',
    width: 'w-20',
  })

  return columns
}

/**
 * Generate table columns based on tab and page type
 */
export function generateTableColumns(
  tabId: TabId,
  pageType: ActivityPageType,
  getLabel: GetLabelFunction
): TableColumn[] {
  const baseColumns = getBaseColumns(getLabel, pageType)
  const moduleColumns = getModuleSpecificColumns(tabId, getLabel, pageType)
  const commonColumns = getCommonColumns(getLabel)
  const pageColumns = getPageSpecificColumns(getLabel, pageType)
  const footerColumns = getFooterColumns(getLabel, pageType)

  return [
    ...baseColumns,
    ...moduleColumns,
    ...commonColumns,
    ...pageColumns,
    ...footerColumns,
  ]
}

/**
 * Get search fields for table state based on tab and page type
 */
export function getSearchFields(
  tabId: TabId,
  pageType: ActivityPageType
): string[] {
  const baseFields = [
    'moduleName',
    'amount',
    'currency',
    'stageKey',
    'createdAt',
    'createdBy',
    'displayName',
    'identifier',
  ]

  if (pageType === 'involved') {
    return [
      ...baseFields,
      'myRemarks',
      'stageName',
      'stageStatus',
    ]
  }

  return [
    ...baseFields,
    'status',
    'taskStatus',
  ]
}

