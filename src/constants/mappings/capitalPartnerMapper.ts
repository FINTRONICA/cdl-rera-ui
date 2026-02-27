import type { CapitalPartnerResponse } from '@/services/api/capitalPartnerService'
import type { OwnerRegistryUIData } from '@/services/api/capitalPartnerService'

/** Maps API response (capitalPartner* or ownerRegistry*) to UI model (owner, assetRegister*, managementFirm*). */
export const mapCapitalPartnerToInvestorData = (
  cp: CapitalPartnerResponse | Record<string, unknown>
): OwnerRegistryUIData => {
  try {
    const mapApiStatus = (taskStatusDTO: any | null): string => {
      if (!taskStatusDTO) return 'INITIATED'
      return taskStatusDTO.code || 'INITIATED'
    }
    const src = cp as Record<string, unknown>
    const unitDto = (src.ownerRegistryUnitDTO ?? (src as any).capitalPartnerUnitDTO) as Record<string, unknown> | undefined
    const rea = unitDto?.managementFirmDTO as Record<string, unknown> | undefined
    const assetDto = rea?.assetRegisterDTO as Record<string, unknown> | undefined
    const ownerName =
      (src.ownerRegistryName ?? src.capitalPartnerName) as string ?? '-'
    const ownerRefId =
      (src.ownerRegistryId ?? src.capitalPartnerId) as string ?? '-'
    return {
      id: (src.id as number) ?? 0,
      owner: ownerName,
      ownerId: ownerRefId,
      assetRegisterName: (assetDto?.arName as string) ?? '-',
      assetRegisterId: (assetDto?.arDeveloperId as string) ?? '-',
      assetRegisterCif: (assetDto?.arCifrera as string) ?? '-',
      managementFirmName: (rea?.mfName as string) ?? '-',
      managementFirmCif: (rea?.mfCif as string) ?? '-',
      unitNumber: String(unitDto?.unitRefId ?? '-'),
      approvalStatus: mapApiStatus((src.taskStatusDTO as any) ?? null),
    }
  } catch (error) {
    console.error('Error mapping owner registry data:', error, cp)
    return {
      id: (cp as any)?.id || 0,
      owner: '-',
      ownerId: '-',
      assetRegisterName: '-',
      assetRegisterId: '-',
      assetRegisterCif: '-',
      managementFirmName: '-',
      managementFirmCif: '-',
      unitNumber: '-',
      approvalStatus: 'INITIATED',
    }
  }
}
