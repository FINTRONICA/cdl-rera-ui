import dayjs from "dayjs";
import { getBuildPartnerLabel } from "../../../constants/mappings/buildPartnerMapping";
import { ProjectData } from "./developerTypes";

export const STEP_LABELS = [
  getBuildPartnerLabel("CDL_AR_DETAILS"),
  "Documents (Optional)",
  getBuildPartnerLabel("CDL_AR_CONTACT"),
  "Review",
] as const;

export const DEFAULT_FORM_VALUES: ProjectData = {
  arDeveloperId: "",
  arCifrera: "",
  arDeveloperRegNo: "",
  arName: "",
  arMasterName: "",
  arNameLocal: "",
  arOnboardingDate: null,
  arContactAddress: "",
  arContactTel: "",
  arPoBox: "",
  arMobile: "",
  arFax: "",
  arEmail: "",
  arLicenseNo: "",
  arLicenseExpDate: null,
  arWorldCheckFlag: false,
  arWorldCheckRemarks: "",
  arMigratedData: false,
  arRemark: "",
  arRegulatorDTO: { id: 0 },
  arProjectName: "",
  arCompanyNumber: "",
  arMasterCommunity: "",
  arMasterDeveloper: "",

  // Project Details
  sectionId: "",
  developerId: "",
  developerName: "",
  masterDeveloperName: "",
  projectName: "",
  projectLocation: "",
  projectAccountCif: "",
  projectStatus: "",
  projectAccountStatusDate: null,
  projectRegistrationDate: null,
  projectStartDate: null,
  projectCompletionDate: null,
  retention: "5.00",
  additionalRetention: "8.00",
  totalRetention: "13.00",
  retentionEffectiveStartDate: dayjs("2022-03-31"),
  projectManagementExpenses: "5.00",
  marketingExpenses: "10.00",
  realEstateBrokerExpense: "",
  advertisingExpense: "",
  landOwnerName: "",
  projectCompletionPercentage: "",
  currency: "AED",
  actualConstructionCost: "",
  noOfUnits: "12",
  remarks: "",
  specialApproval: "",
  paymentType: "",
  managedBy: "erm_checker1,erm_checker1,erm_checker1",
  backupRef: "Master ENBD_robust_maker1",
  relationshipManager: "",
  assistantRelationshipManager: "",
  teamLeaderName: "",

  documents: [],
  accounts: [
    {
      trustAccountNumber: "",
      ibanNumber: "",
      dateOpened: null,
      accountTitle: "",
      currency: "AED",
    },
  ],
  contactData: [
    {
      name: "",
      address: "",
      email: "",
      pobox: "",
      countrycode: "",
      mobileno: "",
      telephoneno: "",
      fax: "",
    },
  ],
  fees: [
    {
      feeType: "",
      frequency: "",
      debitAmount: "",
      feeToBeCollected: "",
      nextRecoveryDate: null,
      feePercentage: "",
      amount: "",
      vatPercentage: "",
    },
  ],
  beneficiaries: [
    {
      id: "",
      transferType: "",
      name: "",
      bankName: "",
      swiftCode: "",
      routingCode: "",
      account: "",
    },
  ],
  paymentPlan: [
    {
      installmentNumber: 1,
      installmentPercentage: "",
      projectCompletionPercentage: "",
    },
  ],
  financialData: {
    projectEstimatedCost: "",
    actualCost: "",
    projectBudget: "",
  },
};

export const DATE_FIELDS = [
  "arOnboardingDate",
  "arLicenseExpDate",
  "projectStartDate",
  "projectEndDate",
] as const;

export const BOOLEAN_FIELDS = ["arWorldCheckFlag", "arMigratedData"] as const;

export const SKIP_VALIDATION_STEPS = [1, 2, 3, 4] as const;

// Steps that reset form when developerId changes
export const RESET_FORM_STEPS = [1, 2, 3] as const;
