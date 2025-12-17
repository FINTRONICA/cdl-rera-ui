/**
 * Payload Mapper Service
 * 
 * Maps payloadJson from API responses to UI-friendly data structures
 * based on the module type. Each module has different payloadJson structure.
 */

import type { ModuleName } from './tabsService'

export interface MappedPayloadData {
  // Common fields that work across all modules
  displayName: string
  identifier?: string
  status?: string
  
  // Module-specific fields (optional, based on module type)
  [key: string]: unknown
}

/**
 * Payload field mappings for each module type
 */
interface PayloadFieldMapping {
  displayName: string[]
  identifier?: string[]
  status?: string[]
  additionalFields?: Record<string, string[]>
}

const PAYLOAD_FIELD_MAPPINGS: Record<ModuleName, PayloadFieldMapping> = {
  BUILD_PARTNER: {
    displayName: ['bpName', 'bpMasterName'],
    identifier: ['bpCifrera', 'bpDeveloperId'],
    status: ['taskStatusDTO', 'name'],
    additionalFields: {
      bpLicenseNo: ['bpLicenseNo'],
      bpEmail: ['bpEmail'],
      bpMobile: ['bpMobile'],
      bpContactAddress: ['bpContactAddress'],
    },
  },
  BUILD_PARTNER_ASSET: {
    displayName: ['projectName', 'name', 'assetName'],
    identifier: ['projectId', 'assetId', 'id'],
    status: ['status', 'taskStatusDTO', 'name'],
    additionalFields: {
      developerId: ['developerId', 'bpDeveloperId'],
      projectCode: ['projectCode', 'code'],
    },
  },
  CAPITAL_PARTNER: {
    displayName: [
      'investorFirstName',
      'investorLastName',
      'investorMiddleName',
      'arabicName',
    ],
    identifier: ['investorId', 'idNumber'],
    status: ['status', 'investorType'],
    additionalFields: {
      investorType: ['investorType'],
      nationality: ['nationality'],
      email: ['email'],
      mobileNumber: ['mobileNumber'],
      idType: ['investorIdType'],
    },
  },
  PAYMENTS: {
    displayName: ['transactionId', 'referenceId', 'id'],
    identifier: ['transactionNumber', 'referenceNumber'],
    status: ['status', 'transactionStatus'],
    additionalFields: {
      amount: ['amount'],
      currency: ['currency'],
      paymentType: ['paymentType', 'type'],
    },
  },
  SURETY_BOND: {
    displayName: ['bondName', 'guaranteeName', 'name'],
    identifier: ['bondNumber', 'guaranteeNumber', 'referenceId'],
    status: ['status', 'bondStatus'],
    additionalFields: {
      amount: ['amount'],
      currency: ['currency'],
      expiryDate: ['expiryDate', 'validUntil'],
    },
  },
}

/**
 * Extract value from nested object using path array
 */
function extractNestedValue(
  obj: Record<string, unknown>,
  path: string[]
): unknown {
  let current: unknown = obj

  for (const key of path) {
    if (current === null || current === undefined) {
      return null
    }

    if (typeof current !== 'object') {
      return null
    }

    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * Get first non-null value from multiple paths
 */
function getFirstAvailableValue(
  payloadJson: Record<string, unknown>,
  paths: string[]
): string {
  for (const path of paths) {
    const pathArray = path.split('.')
    const value = extractNestedValue(payloadJson, pathArray)

    if (value !== null && value !== undefined && value !== '') {
      return String(value)
    }
  }

  return '-'
}

/**
 * Get combined name for CAPITAL_PARTNER (firstName + lastName + middleName)
 */
function getCapitalPartnerDisplayName(
  payloadJson: Record<string, unknown>
): string {
  const firstName = String(payloadJson.investorFirstName || '').trim()
  const lastName = String(payloadJson.investorLastName || '').trim()
  const middleName = String(payloadJson.investorMiddleName || '').trim()
  const arabicName = String(payloadJson.arabicName || '').trim()

  // Try to build full name from parts
  const nameParts = [firstName, middleName, lastName].filter(Boolean)
  if (nameParts.length > 0) {
    return nameParts.join(' ')
  }

  // Fallback to arabicName
  if (arabicName) {
    return arabicName
  }

  return '-'
}

/**
 * Map payloadJson to UI-friendly structure based on module type
 */
export function mapPayloadToUIData(
  payloadJson: Record<string, unknown> | null | undefined,
  moduleName: ModuleName
): MappedPayloadData {
  if (!payloadJson || typeof payloadJson !== 'object') {
    return {
      displayName: '-',
    }
  }

  const mapping = PAYLOAD_FIELD_MAPPINGS[moduleName]

  if (!mapping) {
    // Fallback: try to find common fields
    return {
      displayName:
        getFirstAvailableValue(payloadJson, ['name', 'title', 'id']) || '-',
    }
  }

  // Special handling for CAPITAL_PARTNER to combine name parts
  let displayName: string
  if (moduleName === 'CAPITAL_PARTNER') {
    displayName = getCapitalPartnerDisplayName(payloadJson)
  } else {
    displayName = getFirstAvailableValue(payloadJson, mapping.displayName)
  }

  const result: MappedPayloadData = {
    displayName,
  }

  // Add identifier if mapping exists
  if (mapping.identifier) {
    const identifier = getFirstAvailableValue(payloadJson, mapping.identifier)
    if (identifier !== '-') {
      result.identifier = identifier
    }
  }

  // Add status if mapping exists
  if (mapping.status) {
    const status = getFirstAvailableValue(payloadJson, mapping.status)
    if (status !== '-') {
      result.status = status
    }
  }

  // Add additional fields
  if (mapping.additionalFields) {
    for (const [fieldName, paths] of Object.entries(mapping.additionalFields)) {
      const value = getFirstAvailableValue(payloadJson, paths)
      if (value !== '-') {
        result[fieldName] = value
      }
    }
  }

  return result
}

/**
 * Get display name for a payload (used in table columns)
 */
export function getPayloadDisplayName(
  payloadJson: Record<string, unknown> | null | undefined,
  moduleName: ModuleName
): string {
  const mapped = mapPayloadToUIData(payloadJson, moduleName)
  return mapped.displayName
}

/**
 * Get identifier for a payload (used in table columns)
 */
export function getPayloadIdentifier(
  payloadJson: Record<string, unknown> | null | undefined,
  moduleName: ModuleName
): string {
  const mapped = mapPayloadToUIData(payloadJson, moduleName)
  return mapped.identifier || '-'
}

/**
 * Get status for a payload (used in table columns)
 */
export function getPayloadStatus(
  payloadJson: Record<string, unknown> | null | undefined,
  moduleName: ModuleName
): string {
  const mapped = mapPayloadToUIData(payloadJson, moduleName)
  return mapped.status || '-'
}

/**
 * Get all mapped fields for a payload
 */
export function getAllMappedFields(
  payloadJson: Record<string, unknown> | null | undefined,
  moduleName: ModuleName
): MappedPayloadData {
  return mapPayloadToUIData(payloadJson, moduleName)
}

