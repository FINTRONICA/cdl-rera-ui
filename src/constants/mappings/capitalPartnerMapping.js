// Owner Registry label mapping (replaces CAPITAL_PARTNER)
// Maps configId to configValue for easy lookup and usage in components

export const OWNER_REGISTRY_LABELS = {
  // Main Owner Registry Details
  CDL_OWNER_REGISTRY: 'Owner Registry',
  CDL_OWNER_NEW: 'Register New Owner Registry',
  CDL_OWNER_BASIC_INFO: 'Owner Registry Basic Information',
  CDL_OWNER_TYPE: 'Owner Registry Type',
  CDL_OWNER_FIRSTNAME: 'Owner Registry Name',
  CDL_OWNER_MF_NAME: 'Management Firm Name',
  CDL_OWNER_MF_CIF: 'Management Firm CIF',
  CDL_OWNER_REFID: 'Owner Registry ID',
  CDL_OWNER_MIDDLENAME: 'Middle Name',
  CDL_OWNER_AR_ID: 'Asset Register ID',
  CDL_OWNER_AR_CIF: 'Asset Register CIF',
  CDL_OWNER_LASTNAME: 'Last Name',
  CDL_OWNER_LOCALE_NAME: 'Local Language Name',
  CDL_OWNER_OWNERSHIP: 'Ownership Share (%)',
  CDL_OWNER_ID_TYPE: 'Owner Registry ID Type',
  CDL_OWNER_DOC_NO: 'ID NO',
  CDL_OWNER_ID_EXP: 'ID Expiry Date',
  CDL_OWNER_NATIONALITY: 'Nationality',
  CDL_OWNER_TELEPHONE: 'Account Contact Number',
  CDL_OWNER_MOBILE: 'Mobile Number',
  CDL_OWNER_EMAIL: 'Email Address',
  CDL_OWNER_AR_NAME: 'Asset Register Name',
  CDL_OWNER_APPROVAL_STATUS: 'Approval Status',
  CDL_OWNER_ACTION: 'Action',
  CDL_OWNER_DOCUMENTS: 'Submitted Documents',
  CDL_OWNER_REVIEW: 'Review',
  CDL_OWNER_NO_DOCUMENTS: 'No documents submitted',

  // Unit Details
  CDL_OWNER_UNIT_DETAILS: 'Unit Details',
  CDL_OWNER_UNIT_FLOOR: 'Floor Number',
  CDL_OWNER_UNIT_NOOF_BED: 'Number of Bedrooms',
  CDL_OWNER_UNIT_NUMBER: 'Unit Number',
  CDL_OWNER_UNIT_STATUS: 'Unit Status',
  CDL_OWNER_UNIT_BUILDING_NAME: 'Building Name',
  CDL_OWNER_UNIT_PLOT_SIZE: 'Plot Size (sq. m./sq. ft.)',
  CDL_OWNER_UNIT_PROP_NUMBER: 'Property Identification Number',
  CDL_OWNER_UNIT_IBAN: 'Unit IBAN',
  CDL_OWNER_UNIT_REG_FEE: 'Unit Registration Fee',
  CDL_OWNER_UNIT_AGENT_NAME: 'Agent Full Name',
  CDL_OWNER_UNIT_AGENT_ID: 'Agent National Identification Number',
  CDL_OWNER_UNIT_NET_PRICE: 'Net Sale Price',
  CDL_OWNER_UNIT_GROSS_PRICE: 'Gross Sale Price',
  CDL_OWNER_UNIT_VAT_APPLICABLE: 'VAT Applicability',
  CDL_OWNER_UNIT_DEED_REF_NO: 'Deed Reference Number',
  CDL_OWNER_UNIT_CONTRACT_NO: 'Contract Number',
  CDL_OWNER_UNIT_AGREEMENT_DATE: 'Agreement Execution Date',
  CDL_OWNER_UNIT_SPA: 'Sale & Purchase Agreement (SPA)',
  CDL_OWNER_UNIT_PAYMENT_PLAN: 'Asset Payment Plan',
  CDL_OWNER_UNIT_FEE_REQ: 'Modification Fee Requirement',
  CDL_OWNER_UNIT_WORLD_STATUS: 'World-Check Status',
  CDL_OWNER_UNIT_WITH_ESCROW: 'Amount Paid to Asset Register Partner (Within Escrow)',
  CDL_OWNER_PAYMENT_AMOUNT: 'Amount',
  CDL_OWNER_PAYMENT_PLAN_NEW: 'Payment Plan',
  CDL_OWNER_PAYMENT_SEQ_NO: 'Installment Sequence Number',
  CDL_OWNER_PAYMENT_DUE_DATE: 'Installment Due Date',
  CDL_OWNER_PAYMENT_BOOKING_AMOUNT: 'Initial Booking Payment',

  // Payment Plan & Installments
  CDL_OWNER_SEQ_NO: 'Installment Sequence Number',
  CDL_OWNER_DUE_DATE: 'Installment Due Date',
  CDL_OWNER_UNIT_BOOKING_AMOUNT: 'Initial Booking Payment',
  CDL_OWNER_UNIT_MF_NAME: 'Management Firm Name',
  CDL_OWNER_UNIT_MF_ID: 'Management Firm ID*',
  CDL_OWNER_UNIT_AR_ID: 'Asset Register ID*',
  CDL_OWNER_UNIT_AR_NAME: 'Asset Register Name*',
  CDL_OWNER_UNIT_FROFEIT_AMT: 'Forfeited Amount',

  // Banking & Payment Details
  CDL_OWNER_BANK_DETAILS: 'Banking & Payment Details',
  CDL_OWNER_PAY_MODE: 'Payment Method',
  CDL_OWNER_ACCOUNT_NUMBER: 'Bank Account Number',
  CDL_OWNER_PAYEE_NAME: 'Payee Full Name',
  CDL_OWNER_PAYEE_ADDRESS: 'Payee Address',
  CDL_OWNER_BANK_NAME: 'Bank Name',
  CDL_OWNER_BANK_ADDRESS: 'Bank Address',
  CDL_OWNER_ROUTING_CODE: 'Routing Number',
  CDL_OWNER_BIC_CODE: 'SWIFT / BIC Code',
  CDL_OWNER_VA_NUMBER: 'Retrieve Virtual Account Number',

  // Additional Payment Information
  CDL_OWNER_UNIT_OUTSIDE_ESCROW: 'Amount Paid to Asset Register Partner (Outside Escrow)',
  CDL_OWNER_UNIT_PARTNER_PAYMENT: 'Total Owner Registry Payment',
  CDL_OWNER_UNIT_BOOKING: 'Reservation & Booking Form',
  CDL_OWNER_OQOOD_STATUS: 'Oqood Paid Status',
  CDL_OWNER_UNIT_OQOOD_PAID: 'Oqood Amount Paid',
  CDL_OWNER_UNIT_AREA: 'Unit Area Measurement',
  CDL_OWNER_FORFEIT_AMT: 'Forfeited Amount',
  CDL_OWNER_UNIT_DLD_FEE: 'Dubai Land Department Fee',
  CDL_OWNER_UNIT_REFUND_AMOUNT: 'Refund Amount',
  CDL_OWNER_UNIT_REMARKS: 'Additional Remarks',
  CDL_OWNER_UNIT_TRANS_AMT: 'Transferred Amount',

  // Aliases for Step5/review (short names without UNIT_ prefix)
  CDL_OWNER_BUILDING_NAME: 'Building Name',
  CDL_OWNER_PLOT_SIZE: 'Plot Size (sq. m./sq. ft.)',
  CDL_OWNER_PROP_NUMBER: 'Property Identification Number',
  CDL_OWNER_REG_FEE: 'Unit Registration Fee',
  CDL_OWNER_AGENT_NAME: 'Agent Full Name',
  CDL_OWNER_AGENT_ID: 'Agent National Identification Number',
  CDL_OWNER_GROSS_PRICE: 'Gross Sale Price',
  CDL_OWNER_VAT_APPLICABLE: 'VAT Applicability',
  CDL_OWNER_SPA: 'Sale & Purchase Agreement (SPA)',
  CDL_OWNER_PAYMENT_PLAN: 'Asset Payment Plan',
  CDL_OWNER_NET_PRICE: 'Net Sale Price',
  CDL_OWNER_DEED_REF_NO: 'Deed Reference Number',
  CDL_OWNER_CONTRACT_NO: 'Contract Number',
  CDL_OWNER_AGREEMENT_DATE: 'Agreement Execution Date',
  CDL_OWNER_MODIFICATION_FEE_NEEDED: 'Modification Fee Requirement',
  CDL_OWNER_RESERVATION_BOOKING_FORM: 'Reservation & Booking Form',
  CDL_OWNER_OQOOD_PAID: 'Oqood Amount Paid',
  CDL_OWNER_WORLD_STATUS: 'World-Check Status',
  CDL_OWNER_WITH_ESCROW: 'Amount Paid to Asset Register Partner (Within Escrow)',
  CDL_OWNER_OUTSIDE_ESCROW: 'Amount Paid to Asset Register Partner (Outside Escrow)',
  CDL_OWNER_PARTNER_PAYMENT: 'Total Owner Registry Payment',
  CDL_OWNER_FORFEIT_AMOUNT: 'Forfeited Amount',
  CDL_OWNER_DLD_FEE: 'Dubai Land Department Fee',
  CDL_OWNER_DLD_AMOUNT: 'Dubai Land Department Fee',
  CDL_OWNER_REFUND_AMOUNT: 'Refund Amount',
  CDL_OWNER_TRANS_AMT: 'Transferred Amount',
  CDL_OWNER_REMARKS: 'Additional Remarks',
  CDL_OWNER_FEE_REQ: 'Modification Fee Requirement',
  CDL_OWNER_BOOKING: 'Reservation & Booking Form',
  CDL_OWNER_BOOKING_AMOUNT: 'Initial Booking Payment',
}

// Utility function to get label by configId
export const getOwnerRegistryLabel = (configId) => {
  return OWNER_REGISTRY_LABELS[configId] || configId
}

/** @deprecated Use getOwnerRegistryLabel */
export const getCapitalPartnerLabel = getOwnerRegistryLabel

// Utility function to get all labels for a specific category
export const getOwnerRegistryLabelsByCategory = (category) => {
  const categories = {
    basic_info: [
      'CDL_OWNER',
      'CDL_OWNER_NEW',
      'CDL_OWNER_BASIC_INFO',
      'CDL_OWNER_TYPE',
      'CDL_OWNER_FIRSTNAME',
      'CDL_OWNER_REFID',
      'CDL_OWNER_MIDDLENAME',
      'CDL_OWNER_LASTNAME',
      'CDL_OWNER_LOCALE_NAME',
      'CDL_OWNER_OWNERSHIP',
    ],
    identification: [
      'CDL_OWNER_ID_TYPE',
      'CDL_OWNER_DOC_NO',
      'CDL_OWNER_ID_EXP',
      'CDL_OWNER_NATIONALITY',
    ],
    contact: ['CDL_OWNER_TELEPHONE', 'CDL_OWNER_MOBILE', 'CDL_OWNER_EMAIL'],
    unit_details: [
      'CDL_OWNER_UNIT_DETAILS',
      'CDL_OWNER_UNIT_FLOOR',
      'CDL_OWNER_UNIT_NOOF_BED',
      'CDL_OWNER_UNIT_NUMBER',
      'CDL_OWNER_UNIT_STATUS',
      'CDL_OWNER_UNIT_BUILDING_NAME',
      'CDL_OWNER_UNIT_PLOT_SIZE',
      'CDL_OWNER_UNIT_PROP_NUMBER',
      'CDL_OWNER_UNIT_IBAN',
      'CDL_OWNER_UNIT_REG_FEE',
    ],
    agent: ['CDL_OWNER_UNIT_AGENT_NAME', 'CDL_OWNER_UNIT_AGENT_ID'],
    pricing: [
      'CDL_OWNER_UNIT_NET_PRICE',
      'CDL_OWNER_UNIT_GROSS_PRICE',
      'CDL_OWNER_UNIT_VAT_APPLICABLE',
    ],
    legal: [
      'CDL_OWNER_UNIT_DEED_REF_NO',
      'CDL_OWNER_UNIT_CONTRACT_NO',
      'CDL_OWNER_UNIT_AGREEMENT_DATE',
      'CDL_OWNER_UNIT_SPA',
    ],
    payment_plan: [
      'CDL_OWNER_UNIT_PAYMENT_PLAN',
      'CDL_OWNER_SEQ_NO',
      'CDL_OWNER_DUE_DATE',
      'CDL_OWNER_UNIT_BOOKING_AMOUNT',
    ],
    banking: [
      'CDL_OWNER_BANK_DETAILS',
      'CDL_OWNER_PAY_MODE',
      'CDL_OWNER_ACCOUNT_NUMBER',
      'CDL_OWNER_PAYEE_NAME',
      'CDL_OWNER_PAYEE_ADDRESS',
      'CDL_OWNER_BANK_NAME',
      'CDL_OWNER_BANK_ADDRESS',
      'CDL_OWNER_ROUTING_CODE',
      'CDL_OWNER_BIC_CODE',
      'CDL_OWNER_VA_NUMBER',
    ],
    payments: [
      'CDL_OWNER_UNIT_WITH_ESCROW',
      'CDL_OWNER_UNIT_OUTSIDE_ESCROW',
      'CDL_OWNER_UNIT_PARTNER_PAYMENT',
      'CDL_OWNER_UNIT_BOOKING',
      'CDL_OWNER_OQOOD_STATUS',
      'CDL_OWNER_UNIT_OQOOD_PAID',
      'CDL_OWNER_UNIT_AREA',
      'CDL_OWNER_FORFEIT_AMT',
      'CDL_OWNER_UNIT_DLD_FEE',
      'CDL_OWNER_UNIT_REFUND_AMOUNT',
      'CDL_OWNER_UNIT_REMARKS',
      'CDL_OWNER_UNIT_TRANS_AMT',
    ],
    status: ['CDL_OWNER_UNIT_FEE_REQ', 'CDL_OWNER_UNIT_WORLD_STATUS'],
  }

  return (
    categories[category]?.map((configId) => ({
      configId,
      label: OWNER_REGISTRY_LABELS[configId],
    })) || []
  )
}

/** @deprecated Use getOwnerRegistryLabelsByCategory */
export const getCapitalPartnerLabelsByCategory = getOwnerRegistryLabelsByCategory

// Export the full mapping object for direct access
export default OWNER_REGISTRY_LABELS
