import { useState, useEffect } from 'react'
import { applicationSettingService } from '@/services/api/applicationSettingService1'

export interface TranslatedBasicDetails {
  investorType: string
  investorIdType: string
  nationality: string
  unitStatus: string
  payMode: string
  loading: boolean
  error: string | null
}

export function useTranslatedBasicDetails(
  capitalPartnerData: any,
  unitDetailsData?: any[],
  bankDetailsData?: any[]
): TranslatedBasicDetails {
  const [investorType, setInvestorType] = useState<string>('-')
  const [investorIdType, setInvestorIdType] = useState<string>('-')
  const [nationality, setNationality] = useState<string>('-')
  const [unitStatus, setUnitStatus] = useState<string>('-')
  const [payMode, setPayMode] = useState<string>('-')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTranslatedValues = async () => {
      if (!capitalPartnerData) {
        setInvestorType('-')
        setInvestorIdType('-')
        setNationality('-')
        setUnitStatus('-')
        setPayMode('-')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const promises = []
        const typeDTO = (capitalPartnerData as Record<string, unknown>).ownerRegistryTypeDTO ?? (capitalPartnerData as Record<string, unknown>).investorTypeDTO
        const typeDtoObj = typeDTO as { id?: number; settingKey?: string; settingValue?: string } | undefined
        if (typeDtoObj?.id != null) {
          if (typeDtoObj.settingKey) {
            promises.push(
              applicationSettingService
                .getApplicationSettingByIdAndKey(typeDtoObj.id, typeDtoObj.settingKey)
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setInvestorType(translatedValue)
                })
                .catch(() => {
                  setInvestorType(typeDtoObj?.settingValue || '-')
                })
            )
          } else {
            // API may return only { id }; resolve by id to get display value
            promises.push(
              applicationSettingService
                .getApplicationSettingById(typeDtoObj.id)
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setInvestorType(translatedValue)
                })
                .catch(() => {
                  setInvestorType(typeDtoObj?.settingValue || '-')
                })
            )
          }
        } else {
          setInvestorType(typeDtoObj?.settingValue || '-')
        }
        const docTypeDTO = (capitalPartnerData as Record<string, unknown>).documentTypeDTO as { id?: number; settingKey?: string; settingValue?: string } | undefined
        if (docTypeDTO?.id != null) {
          if (docTypeDTO.settingKey) {
            promises.push(
              applicationSettingService
                .getApplicationSettingByIdAndKey(docTypeDTO.id, docTypeDTO.settingKey)
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setInvestorIdType(translatedValue)
                })
                .catch(() => {
                  setInvestorIdType(docTypeDTO?.settingValue || '-')
                })
            )
          } else {
            promises.push(
              applicationSettingService
                .getApplicationSettingById(docTypeDTO.id)
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setInvestorIdType(translatedValue)
                })
                .catch(() => {
                  setInvestorIdType(docTypeDTO?.settingValue || '-')
                })
            )
          }
        } else {
          setInvestorIdType(docTypeDTO?.settingValue || '-')
        }
        const countryDTO = (capitalPartnerData as Record<string, unknown>).countryOptionDTO as { id?: number; settingKey?: string; settingValue?: string } | undefined
        if (countryDTO?.id != null) {
          if (countryDTO.settingKey) {
            promises.push(
              applicationSettingService
                .getApplicationSettingByIdAndKey(countryDTO.id, countryDTO.settingKey)
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setNationality(translatedValue)
                })
                .catch(() => {
                  setNationality(countryDTO?.settingValue || '-')
                })
            )
          } else {
            promises.push(
              applicationSettingService
                .getApplicationSettingById(countryDTO.id)
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setNationality(translatedValue)
                })
                .catch(() => {
                  setNationality(countryDTO?.settingValue || '-')
                })
            )
          }
        } else {
          setNationality(countryDTO?.settingValue || '-')
        }
        if (unitDetailsData && unitDetailsData.length > 0) {
          const unitData = unitDetailsData[0]
          if (
            unitData.unitStatusDTO?.id &&
            unitData.unitStatusDTO?.settingKey
          ) {
            promises.push(
              applicationSettingService
                .getApplicationSettingByIdAndKey(
                  unitData.unitStatusDTO.id,
                  unitData.unitStatusDTO.settingKey
                )
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setUnitStatus(translatedValue)
                })
                .catch(() => {
                  setUnitStatus(unitData.unitStatusDTO?.settingValue || '-')
                })
            )
          } else {
            setUnitStatus(unitData.unitStatusDTO?.settingValue || '-')
          }
        } else {
          setUnitStatus('-')
        }
        if (bankDetailsData && bankDetailsData.length > 0) {
          const bankData = bankDetailsData[0]
          if (bankData.payModeDTO?.id && bankData.payModeDTO?.settingKey) {
            promises.push(
              applicationSettingService
                .getApplicationSettingByIdAndKey(
                  bankData.payModeDTO.id,
                  bankData.payModeDTO.settingKey
                )
                .then((setting) => {
                  const translatedValue =
                    setting.languageTranslationId?.configValue ||
                    setting.settingValue
                  setPayMode(translatedValue)
                })
                .catch(() => {
                  setPayMode(bankData.payModeDTO?.settingValue || '-')
                })
            )
          } else {
            setPayMode(bankData.payModeDTO?.settingValue || '-')
          }
        } else {
          setPayMode('-')
        }

        await Promise.all(promises)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch translations'
        )
        const cp = capitalPartnerData as Record<string, unknown>
        const typeDto = (cp.ownerRegistryTypeDTO ?? cp.investorTypeDTO) as { settingValue?: string } | undefined
        const docDto = cp.documentTypeDTO as { settingValue?: string } | undefined
        const countryDto = cp.countryOptionDTO as { settingValue?: string } | undefined
        setInvestorType(typeDto?.settingValue || '-')
        setInvestorIdType(docDto?.settingValue || '-')
        setNationality(countryDto?.settingValue || '-')
        setUnitStatus(unitDetailsData?.[0]?.unitStatusDTO?.settingValue || '-')
        setPayMode(bankDetailsData?.[0]?.payModeDTO?.settingValue || '-')
      } finally {
        setLoading(false)
      }
    }

    fetchTranslatedValues()
  }, [capitalPartnerData, unitDetailsData, bankDetailsData])

  return {
    investorType,
    investorIdType,
    nationality,
    unitStatus,
    payMode,
    loading,
    error,
  }
}
