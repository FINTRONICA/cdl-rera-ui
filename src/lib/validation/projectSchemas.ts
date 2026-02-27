import { z } from 'zod'

// Step 1: Project Details Validation Schema
export const ProjectStep1Schema = z.object({
  mfName: z.string().min(1, 'Project name is required'),
  mfLocation: z.string().min(1, 'Project location is required'),
  mfReraNumber: z.string().min(1, 'RERA number is required'),
  mfStartDate: z.any().nullable(),
  mfCompletionDate: z.any().nullable(),
  mfConstructionCost: z.string().min(1, 'Construction cost is required'),
  mfNoOfUnits: z.string().min(1, 'Number of units is required'),
  mfRemarks: z.string().optional(),
  mfSpecialApproval: z.string().optional(),
  mfManagedBy: z.string().optional(),
  mfBackupUser: z.string().min(1, 'Backup user is required'),
  mfTeamLeadName: z.string().min(1, 'Team lead name is required'),
  mfRelationshipManagerName: z
    .string()
    .min(1, 'Relationship manager name is required'),
  mfAssestRelshipManagerName: z
    .string()
    .min(1, 'Asset relationship manager name is required'),
  mfLandOwnerName: z.string().min(1, 'Land owner name is required'),
  mfRetentionPercent: z.string().min(1, 'Retention percent is required'),
  mfAdditionalRetentionPercent: z
    .string()
    .min(1, 'Additional retention percent is required'),
  mfTotalRetentionPercent: z
    .string()
    .min(1, 'Total retention percent is required'),
  mfRetentionEffectiveDate: z.any().nullable(),
  mfManagementExpenses: z.string().min(1, 'Management expenses is required'),
  mfMarketingExpenses: z.string().min(1, 'Marketing expenses is required'),
  mfRealEstateBrokerExp: z.string().optional(),
  mfAdvertisementExp: z.string().optional(),
  mfPercentComplete: z.string().optional(),
  mfConstructionCostCurrencyDTO: z.object({
    id: z.number(),
  }),
  assetRegisterDTO: z.object({
    id: z.number(),
  }),
  mfStatusDTO: z.object({
    id: z.number(),
  }),
  mfTypeDTO: z.object({
    id: z.number(),
  }),
  mfAccountStatusDTO: z.object({
    id: z.number(),
  }),
  status: z.string().min(1, 'Status is required'),
})

// Step 2: Account Details Validation Schema
export const ProjectStep2Schema = z.object({
  accounts: z
    .array(
      z.object({
        trustAccountNumber: z
          .string()
          .min(1, 'Trust account number is required'),
        ibanNumber: z.string().min(1, 'IBAN number is required'),
        dateOpened: z.any().nullable(),
        accountTitle: z.string().min(1, 'Account title is required'),
        currency: z.string().min(1, 'Currency is required'),
        isActive: z.boolean().optional(),
      })
    )
    .min(1, 'At least one account is required'),
})

// Step 3: Fee Details Validation Schema
export const ProjectStep3Schema = z.object({
  fees: z
    .array(
      z.object({
        feeType: z.string().min(1, 'Fee type is required'),
        frequency: z.string().min(1, 'Frequency is required'),
        debitAmount: z.string().min(1, 'Debit amount is required'),
        feeToBeCollected: z.string().min(1, 'Fee to be collected is required'),
        nextRecoveryDate: z.any().nullable(),
        feePercentage: z.string().min(1, 'Fee percentage is required'),
        amount: z.string().min(1, 'Amount is required'),
        vatPercentage: z.string().min(1, 'VAT percentage is required'),
        isActive: z.boolean().optional(),
      })
    )
    .min(1, 'At least one fee is required'),
})

// Step 4: Beneficiary Details Validation Schema
export const ProjectStep4Schema = z.object({
  beneficiaries: z
    .array(
      z.object({
        id: z.string().optional(),
        transferType: z.string().min(1, 'Transfer type is required'),
        name: z.string().min(1, 'Beneficiary name is required'),
        bankName: z.string().min(1, 'Bank name is required'),
        swiftCode: z.string().min(1, 'SWIFT code is required'),
        routingCode: z.string().min(1, 'Routing code is required'),
        account: z.string().min(1, 'Account number is required'),
        isActive: z.boolean().optional(),
      })
    )
    .min(1, 'At least one beneficiary is required'),
})

// Step 5: Payment Plan Validation Schema
export const ProjectStep5Schema = z.object({
  paymentPlan: z
    .array(
      z.object({
        installmentNumber: z.number().min(1, 'Installment number is required'),
        installmentPercentage: z
          .string()
          .min(1, 'Installment percentage is required'),
        projectCompletionPercentage: z
          .string()
          .min(1, 'Project completion percentage is required'),
      })
    )
    .min(1, 'At least one payment plan entry is required'),
})

// Step 6: Financial Data Validation Schema
export const ProjectStep6Schema = z.object({
  financialData: z.object({
    projectEstimatedCost: z
      .string()
      .min(1, 'Project estimated cost is required'),
    actualCost: z.string().min(1, 'Actual cost is required'),
    projectBudget: z.string().min(1, 'Project budget is required'),
  }),
})

// Step 7: Project Closure Validation Schema
export const ProjectStep7Schema = z.object({
  closureData: z.any(), // Flexible schema for closure data
})

// Step 8: Review Validation Schema
export const ProjectStep8Schema = z.object({
  reviewData: z.any(), // Flexible schema for review data
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, 'Terms must be accepted'),
})

// Combined schemas object
export const ProjectStepperSchemas = {
  step1: ProjectStep1Schema,
  step2: ProjectStep2Schema,
  step3: ProjectStep3Schema,
  step4: ProjectStep4Schema,
  step5: ProjectStep5Schema,
  step6: ProjectStep6Schema,
  step7: ProjectStep7Schema,
  step8: ProjectStep8Schema,
}

// Helper function to get validation key for step
export function getStepValidationKey(
  step: number
): keyof typeof ProjectStepperSchemas {
  const stepKeys = [
    'step1',
    'step2',
    'step3',
    'step4',
    'step5',
    'step6',
    'step7',
    'step8',
  ] as const
  return stepKeys[step] || 'step1'
}
