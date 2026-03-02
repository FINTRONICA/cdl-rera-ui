'use client'

import { useState, useEffect } from 'react'
import { realEstateAssetService } from '@/services/api/projectService'

// Data interfaces for project review
export interface ProjectReviewData {
  projectDetails: ProjectDetails | null
  accounts: AccountData[]
  fees: FeeData[]
  beneficiaries: BeneficiaryData[]
  paymentPlans: PaymentPlanData[]
  financialData: FinancialData | null
  closureData: ClosureData[]
  documents: DocumentData[]
}

export interface ProjectDetails {
  id: string
  projectName: string
  projectLocation: string
  projectStatus: string
  projectAccountStatus: string
  projectAccountStatusDate: string
  projectRegistrationDate: string
  projectStartDate: string
  projectStartDateEst: string
  projectCompletionDate: string
  retentionPercent: string
  additionalRetentionPercent: string
  totalRetentionPercent: string
  retentionEffectiveStartDate: string
  projectManagementExpenses: string
  marketingExpenses: string
  realEstateBrokerExpense: string
  advertisingExpense: string
  landOwnerName: string
  projectCompletionPercentage: string
  currency: string
  actualConstructionCost: string
  noOfUnits: string
  remarks: string
  specialApproval: string
  managedBy: string
  backupRef: string
  relationshipManager: string
  assistantRelationshipManager: string
  teamLeaderName: string
  // Developer fields
  managementFirmCif: string
  developerId: string
  developerName: string
  masterDeveloperName: string
  reraNumber: string
  projectType: string
  projectAccountCif: string
  paymentType: string
}

export interface AccountData {
  id: string
  accountNumber: string
  ibanNumber: string
  dateOpened: string
  accountTitle: string
  currency: string
  accountType: string
}

export interface FeeData {
  id: string
  feeType: string
  frequency: string
  debitAmount: string
  feeToBeCollected: string
  nextRecoveryDate: string
  feePercentage: string
  amount: string
  vatPercentage: string
  currency: string
}

export interface BeneficiaryData {
  id: string
  beneficiaryId: string
  beneficiaryType: string
  name: string
  bankName: string
  swiftCode: string
  routingCode: string
  accountNumber: string
}

export interface PaymentPlanData {
  id: string
  installmentNumber: number
  installmentPercentage: string
  projectCompletionPercentage: string
}

export interface FinancialData {
  id: string
  projectEstimatedCost: string
  actualCost: string
  projectBudget: string
  // Add more financial fields as needed
}

export interface ClosureData {
  id: string
  totalIncomeFund: string
  totalPayment: string
  checkGuaranteeDoc: string | null
  enabled: boolean
}

export interface DocumentData {
  id: string
  fileName: string
  documentType: string
  uploadDate: string
  fileSize: number
}

export function useProjectReview(projectId: string) {
  const [projectData, setProjectData] = useState<ProjectReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllProjectData = async () => {
      if (!projectId) {
        setError('Project ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [projectDetails, accounts, fees, beneficiaries, paymentPlans, financialData, closureData, documents] =
          await Promise.allSettled([
            realEstateAssetService.getProjectDetails(projectId),
            realEstateAssetService.getProjectAccounts(projectId),
            realEstateAssetService.getProjectFees(projectId),
            realEstateAssetService.getProjectBeneficiaries(projectId),
            realEstateAssetService.getProjectPaymentPlans(projectId),
            realEstateAssetService.getProjectFinancialSummary(projectId),
            realEstateAssetService.getProjectClosure(projectId),
            realEstateAssetService.getProjectDocuments(projectId),
          ])

       

 
        const projectDetailsResult = projectDetails.status === 'fulfilled' ? projectDetails.value : null
        const accountsResult = accounts.status === 'fulfilled' ? accounts.value : []
        const feesResult = fees.status === 'fulfilled' ? fees.value : []
        const beneficiariesResult = beneficiaries.status === 'fulfilled' ? beneficiaries.value : []
        const paymentPlansResult = paymentPlans.status === 'fulfilled' ? paymentPlans.value : []
        const financialDataResult = financialData.status === 'fulfilled' ? financialData.value : null
        const extractedFinancialData = financialDataResult
          ? (Array.isArray(financialDataResult) ? financialDataResult[0] : financialDataResult?.content?.[0]) ?? null
          : null
        const closureDataResult = closureData.status === 'fulfilled' ? closureData.value : null
       
        const extractedClosureData = closureDataResult?.content || []
        const documentsResult = documents.status === 'fulfilled' ? documents.value : []

      

        const mappedProjectDetails: ProjectDetails | null = projectDetailsResult ? {
          id: projectDetailsResult.id?.toString() || '',
          projectName: projectDetailsResult.mfName || '',
          projectLocation: projectDetailsResult.mfLocation || '',
          projectStatus: projectDetailsResult.mfStatusDTO?.languageTranslationId?.configValue || '',
          projectAccountStatus: projectDetailsResult.mfAccountStatusDTO?.languageTranslationId?.configValue || '',
          projectAccountStatusDate: projectDetailsResult.reaAccStatusDate || '',
          projectRegistrationDate: projectDetailsResult.mfRegistrationDate || '',
          projectStartDate: projectDetailsResult.mfStartDate || '',
          projectStartDateEst: projectDetailsResult.mfCompletionDate || '',
          projectCompletionDate: projectDetailsResult.mfCompletionDate || '',
          retentionPercent: projectDetailsResult.mfRetentionPercent || '',
          additionalRetentionPercent: projectDetailsResult.mfAdditionalRetentionPercent || '',
          totalRetentionPercent: projectDetailsResult.mfTotalRetentionPercent || '',
          retentionEffectiveStartDate: projectDetailsResult.mfRetentionEffectiveDate || '',
          projectManagementExpenses: projectDetailsResult.mfManagementExpenses || '',
          marketingExpenses: projectDetailsResult.mfMarketingExpenses || '',
          realEstateBrokerExpense: projectDetailsResult.mfRealEstateBrokerExp?.toString() || '',
          advertisingExpense: projectDetailsResult.mfAdvertisementExp?.toString() || '',
          landOwnerName: projectDetailsResult.mfLandOwnerName || '',
          projectCompletionPercentage: projectDetailsResult.mfPercentComplete || '',
          currency: projectDetailsResult.mfConstructionCostCurrencyDTO?.languageTranslationId?.configValue || '',
          actualConstructionCost: projectDetailsResult.mfConstructionCost?.toString() || '',
          noOfUnits: projectDetailsResult.mfNoOfUnits?.toString() || '',
          remarks: projectDetailsResult.mfRemarks || '',
          specialApproval: projectDetailsResult.mfSpecialApproval || '',
          managedBy: projectDetailsResult.mfManagedBy || '',
          backupRef: projectDetailsResult.mfBackupUser || '',
          relationshipManager: projectDetailsResult.mfRelationshipManagerName || '',
          assistantRelationshipManager: projectDetailsResult.mfAssestRelshipManagerName || '',
          teamLeaderName: projectDetailsResult.mfTeamLeadName || '',
          // Developer fields
          managementFirmCif: projectDetailsResult.assetRegisterDTO?.arCifrera || '',
          developerId: projectDetailsResult.assetRegisterDTO?.arDeveloperId || '',
          developerName: projectDetailsResult.assetRegisterDTO?.arName || '',
          masterDeveloperName: projectDetailsResult.assetRegisterDTO?.arMasterName || '',
          reraNumber: projectDetailsResult.mfReraNumber || '',
          projectType: projectDetailsResult.mfTypeDTO?.languageTranslationId?.configValue || '',
          projectAccountCif: projectDetailsResult.mfCif || '',
          paymentType: projectDetailsResult.mfBlockPaymentTypeDTO?.languageTranslationId?.configValue || '',
        } : null

        const mappedAccounts: AccountData[] = Array.isArray(accountsResult) ? accountsResult.map((acc: any) => ({
          id: acc.id?.toString() || '',
          accountNumber: acc.accountNumber || '',
          ibanNumber: acc.ibanNumber || '',
          dateOpened: acc.dateOpened || '',
          accountTitle: acc.accountTitle || '',
          currency: acc.currencyCode || '',
          accountType: acc.accountType || '',
        })) : []

        const mappedFees: FeeData[] = Array.isArray(feesResult) ? feesResult.map((fee: any) => ({
          id: fee.id?.toString() || '',
          feeType: fee.mffCategoryDTO?.languageTranslationId?.configValue || fee.mffCategoryDTO?.settingValue || '',
          frequency: fee.mffFrequencyDTO?.languageTranslationId?.configValue || fee.mffFrequencyDTO?.settingValue || '',
          debitAmount: fee.mffDebitAmount?.toString() || '',
          feeToBeCollected: fee.mffCollectionDate || '',
          nextRecoveryDate: fee.mffNextRecoveryDate || '',
          feePercentage: fee.mffFeePercentage?.toString() || '',
          amount: fee.mffTotalAmount?.toString() || '',
          vatPercentage: fee.mffVatPercentage?.toString() || '',
          currency: fee.mffCurrencyDTO?.languageTranslationId?.configValue || fee.mffCurrencyDTO?.settingValue || '',
        })) : []

        const mappedBeneficiaries: BeneficiaryData[] = Array.isArray(beneficiariesResult) ? beneficiariesResult.map((ben: any) => ({
          id: ben.id?.toString() || '',
          beneficiaryId: ben.mfbBeneficiaryId || ben.mfBeneficiaryId || ben.reabBeneficiaryId || '',
          beneficiaryType:
            ben.mfBeneficiaryType ||
            ben.mfbTransferTypeDTO?.languageTranslationId?.configValue ||
            ben.mfbTransferTypeDTO?.settingValue ||
            ben.mfbTranferTypeDTO?.languageTranslationId?.configValue ||
            ben.mfbTranferTypeDTO?.settingValue ||
            ben.reabTransferTypeDTO?.languageTranslationId?.configValue ||
            ben.reabTranferTypeDTO?.languageTranslationId?.configValue ||
            ben.reabType ||
            '',
          name: ben.mfbName || ben.mfName || ben.reabName || '',
          bankName: ben.mfbBank || ben.mfBankName || ben.reabBank || '',
          swiftCode: ben.mfbSwift || ben.mfSwiftCode || ben.reabSwift || '',
          routingCode: ben.mfbRoutingCode || ben.mfRoutingCode || ben.reabRoutingCode || '',
          accountNumber: ben.mfbBeneAccount || ben.mfAccountNumber || ben.reabBeneAccount || '',
        })) : []

        const mappedPaymentPlans: PaymentPlanData[] = Array.isArray(paymentPlansResult) ? paymentPlansResult.map((plan: any) => ({
          id: plan.id?.toString() || '',
          installmentNumber: plan.mfppInstallmentNumber ?? 0,
          installmentPercentage: plan.mfppInstallmentPercentage?.toString() ?? '0',
          projectCompletionPercentage: plan.mfppProjectCompletionPercentage?.toString() ?? '0',
        })) : []

        const mappedDocuments: DocumentData[] = Array.isArray(documentsResult) ? documentsResult.map((doc: any) => ({
          id: doc.id?.toString() || '',
          fileName: doc.documentName || '',
          // Prefer human-friendly configValue; fall back to settingValue
          documentType: doc.documentTypeDTO?.languageTranslationId?.configValue || doc.documentTypeDTO?.settingValue || '',
          uploadDate: doc.uploadDate || '',
          fileSize: parseInt(doc.documentSize || '0'),
        })) : []

        const mappedClosureData: ClosureData[] = extractedClosureData.map((closure: any) => ({
          id: closure.id?.toString() || '',
          totalIncomeFund: closure.mfcTotalIncomeFund?.toString() || '0',
          totalPayment: closure.mfcTotalPayment?.toString() || '0',
          checkGuaranteeDoc: closure.reacCheckGuranteeDoc || null,
          enabled: closure.enabled || false,
        }))

        // Set the combined data with mapped values
        setProjectData({
          projectDetails: mappedProjectDetails,
          accounts: mappedAccounts,
          fees: mappedFees,
          beneficiaries: mappedBeneficiaries,
          paymentPlans: mappedPaymentPlans,
          financialData: extractedFinancialData, // Use extracted financial data from content array
          closureData: mappedClosureData,
          documents: mappedDocuments,
        })

      } catch (err) {
        
        setError(err instanceof Error ? err.message : 'Failed to fetch project data')
      } finally {
        setLoading(false)
      }
    }

    fetchAllProjectData()
  }, [projectId])

  // Helper function to fetch individual step data
  const fetchStepData = async (stepNumber: number) => {
    if (!projectId) return null
    
    try {
      switch (stepNumber) {
        case 1: // Project Details
          return await realEstateAssetService.getProjectDetails(projectId)
        case 3: // Accounts
          return await realEstateAssetService.getProjectAccounts(projectId)
        case 4: // Fees
          return await realEstateAssetService.getProjectFees(projectId)
        case 5: // Beneficiaries
          return await realEstateAssetService.getProjectBeneficiaries(projectId)
        case 6: // Payment Plans
          return await realEstateAssetService.getProjectPaymentPlans(projectId)
        case 7: // Financial Data
          return await realEstateAssetService.getProjectFinancialSummary(projectId)
        case 8: // Project Closure
          return await realEstateAssetService.getProjectClosure(projectId)
        default:
          return null
      }
    } catch (error) {
     
      return null
    }
  }

  return {
    projectData,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      setError(null)
      // Trigger re-fetch by updating a dependency
    },
    fetchStepData
  }
}
