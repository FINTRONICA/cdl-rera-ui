import { z } from 'zod';

// Form-level validation schema for Project Beneficiary Details Panel
export const projectBeneficiaryFormValidationSchema = z.object({
  // Transfer Type* - Dropdown - Mandatory
  mfBeneficiaryType: z.any().refine((val) => val && val !== '' && val !== null && val !== undefined, {
    message: 'Transfer Type is required'
  }),
  
  // Beneficiary ID* - Text - Mandatory, Numerical only, max 16 characters
  mfBeneficiaryId: z.string()
    .min(1, 'Beneficiary ID is required')
    .max(16, 'Beneficiary ID must be maximum 16 characters')
    .regex(/^[0-9]+$/, 'Beneficiary ID must contain only numbers'),
  
  // Beneficiary Name* - Text - Mandatory, Alphabets only, max 35 characters
  mfName: z.string()
    .min(1, 'Beneficiary Name is required')
    .max(35, 'Beneficiary Name must be maximum 35 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Beneficiary Name must contain only alphabets and spaces'),
  
  // Beneficiary Bank* - Dropdown - Mandatory
  mfBankName: z.any().refine((val) => val && val !== '' && val !== null && val !== undefined, {
    message: 'Beneficiary Bank is required'
  }),
  
  // Beneficiary Account Number/IBAN* - Text - Mandatory, Numerical only
  mfAccountNumber: z.string()
    .min(1, 'Account Number/IBAN is required')
    .regex(/^[0-9]+$/, 'Account Number/IBAN must contain only numbers'),
  
  // Beneficiary Swift* - Text - Mandatory, Alpha Numerical only
  mfSwiftCode: z.string()
    .min(1, 'SWIFT Code is required')
    .regex(/^[a-zA-Z0-9]+$/, 'SWIFT Code must contain only alphabets and numbers'),
  
  // Beneficiary Routing Code* - Text - Mandatory, Alpha Numerical only, max 10 characters
  mfRoutingCode: z.string()
    .min(1, 'Routing Code is required')
    .max(10, 'Routing Code must be maximum 10 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Routing Code must contain only alphabets and numbers'),
});

// Field-level validation rules for Project Beneficiary Details
export const PROJECT_BENEFICIARY_FIELD_VALIDATION_RULES = {
  mfBeneficiaryType: {
    required: true,
    message: 'Transfer Type is required'
  },
  mfBeneficiaryId: {
    required: true,
    maxLength: 16,
    pattern: /^[0-9]+$/,
    message: 'Beneficiary ID is required and must contain only numbers (max 16 characters)'
  },
  mfName: {
    required: true,
    maxLength: 35,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Beneficiary Name is required and must contain only alphabets and spaces (max 35 characters)'
  },
  mfBankName: {
    required: true,
    message: 'Beneficiary Bank is required'
  },
  mfAccountNumber: {
    required: true,
    pattern: /^[0-9]+$/,
    message: 'Account Number/IBAN is required and must contain only numbers'
  },
  mfSwiftCode: {
    required: true,
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'SWIFT Code is required and must contain only alphabets and numbers'
  },
  mfRoutingCode: {
    required: true,
    maxLength: 10,
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'Routing Code is required and must contain only alphabets and numbers (max 10 characters)'
  }
} as const;

// Individual field validation function for Project Beneficiary Details
export const validateProjectBeneficiaryField = (fieldName: string, value: any): string | true => {
  const rules = PROJECT_BENEFICIARY_FIELD_VALIDATION_RULES[fieldName as keyof typeof PROJECT_BENEFICIARY_FIELD_VALIDATION_RULES];
  
  if (!rules) return true;
  
  // Required validation
  if ('required' in rules && rules.required && (!value || value === '')) {
    return rules.message;
  }
  
  // Skip other validations if field is empty and not required
  if (!value || value === '') return true;
  
  // Max length validation
  if ('maxLength' in rules && typeof value === 'string' && value.length > rules.maxLength) {
    return rules.message;
  }
  
  // Pattern validation
  if ('pattern' in rules && typeof value === 'string' && !rules.pattern.test(value)) {
    return rules.message;
  }
  
  return true;
};

export type ProjectBeneficiaryFormData = z.infer<typeof projectBeneficiaryFormValidationSchema>;
