// // Capital Partner label mapping from CAPITAL_PARTNER API response
// Maps configId to configValue for easy lookup and usage in components

export const CAPITAL_PARTNER_LABELS = {
  // Main Capital Partner Details
  CDL_OWNER_REGISTRY: 'Owner Registry',
  CDL_OWNER_NEW: 'Register New Owner Registry',
  CDL_OWNER_BASIC_INFO: 'Owner Registry Basic Information',
  CDL_OWNER_TYPE: 'Owner Registry Type',
  CDL_OWNER_FIRSTNAME: 'Owner Registry First Name',
  CDL_OWNER_MF_NAME: 'Management Firm Name',
  CDL_OWNER_MF_CIF: 'Management Firm CIF',
  CDL_OWNER_REFID: 'Owner Registr Reference ID',
  CDL_OWNER_MIDDLENAME: 'Middle Name',
  CDL_OWNER_AR_ID: 'Asset Register ID',
  CDL_OWNER_AR_CIF: 'Asset Register CIF',
  CDL_OWNER_LASTNAME: 'Last Name',
  CDL_OWNER_LOCALE_NAME: 'Local Language Name',
  CDL_OWNER_OWNERSHIP: 'Ownership Share (%)',
  CDL_OWNER_ID_TYPE: 'Identification Document Type',
  CDL_OWNER_DOC_NO: 'Identification Document Number',
  CDL_OWNER_ID_EXP: 'Identification Expiry Date',
  CDL_OWNER_NATIONALITY: 'Nationality',
  CDL_OWNER_TELEPHONE: 'Account Contact Telephone',
  CDL_OWNER_MOBILE: 'Primary Mobile Number',
  CDL_OWNER_EMAIL: 'Owner Registry Email Address',
  CDL_OWNER_AR_NAME: 'Asset Register Name',
  CDL_OWNER_APPROVAL_STATUS: 'Approval Status',
  CDL_OWNER_ACTION: 'Action',

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
  CDL_OWNER_UNIT_WITH_ESCROW: 'Amount Paid to Build Partner (Within Escrow)',

  // Payment Plan & Installments
  CDL_OWNER_SEQ_NO: 'Installment Sequence Number',
  CDL_OWNER_DUE_DATE: 'Installment Due Date',
  CDL_OWNER_UNIT_BOOKING_AMOUNT: 'Initial Booking Payment',

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
  CDL_OWNER_UNIT_OUTSIDE_ESCROW: 'Amount Paid to Build Partner (Outside Escrow)',
  CDL_OWNER_UNIT_PARTNER_PAYMENT: 'Total Capital Partner Payment',
  CDL_OWNER_UNIT_BOOKING: 'Reservation & Booking Form',
  CDL_OWNER_OQOOD_STATUS: 'Oqood Paid Status',
  CDL_OWNER_UNIT_OQOOD_PAID: 'Oqood Amount Paid',
  CDL_OWNER_UNIT_AREA: 'Unit Area Measurement',
  CDL_OWNER_FORFEIT_AMT: 'Forfeited Amount',
  CDL_OWNER_UNIT_DLD_FEE: 'Dubai Land Department Fee',
  CDL_OWNER_UNIT_REFUND_AMOUNT: 'Refund Amount',
  CDL_OWNER_UNIT_REMARKS: 'Additional Remarks',
  CDL_OWNER_UNIT_TRANS_AMT: 'Transferred Amount',
}

// Utility function to get label by configId
export const getCapitalPartnerLabel = (configId) => {
  return CAPITAL_PARTNER_LABELS[configId] || configId
}

// Utility function to get all labels for a specific category
export const getCapitalPartnerLabelsByCategory = (category) => {
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
      label: CAPITAL_PARTNER_LABELS[configId],
    })) || []
  )
}

// Export the full mapping object for direct access
export default CAPITAL_PARTNER_LABELS
