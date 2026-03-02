import dayjs from 'dayjs'
import type { FinancialData } from '../types'

/**
 * Breakdown mapping configuration - extracted as constant for performance
 * Maps API field names to UI structure
 */
export const BREAKDOWN_MAP = {
  0: {
    out: 'mffsCurCashRecvdOutEscrow',
    within: 'mffsCurCashRecvdWithinEscrow',
    total: 'mffsCurCashRecvdTotal',
    except: 'mffsCurCashexceptCapVal',
  },
  1: {
    out: 'mffsCurLandCostOut',
    within: 'mffsCurLandCostWithin',
    total: 'mffsCurLandTotal',
    except: 'mffsCurLandexceptCapVal',
  },
  2: {
    out: 'mffsCurConsCostOut',
    within: 'mffsCurConsCostWithin',
    total: 'mffsCurConsCostTotal',
    except: 'mffsCurConsExcepCapVal',
  },
  3: {
    out: 'mffsCurrentMktgExpOut',
    within: 'mffsCurrentMktgExpWithin',
    total: 'mffsCurrentMktgExpTotal',
    except: 'mffsCurrentmktgExcepCapVal',
  },
  4: {
    out: 'mffsCurProjMgmtExpOut',
    within: 'mffsCurProjMgmtExpWithin',
    total: 'mffsCurProjMgmtExpTotal',
    except: 'mffsCurProjExcepCapVal',
  },
  5: {
    out: 'currentMortgageOut',
    within: 'mffsCurrentMortgageWithin',
    total: 'mffsCurrentMortgageTotal',
    except: 'mffsCurMortgageExceptCapVal',
  },
  6: {
    out: 'mffsCurrentVatPaymentOut',
    within: 'mffsCurrentVatPaymentWithin',
    total: 'mffsCurrentVatPaymentTotal',
    except: 'mffsCurVatExceptCapVal',
  },
  7: {
    out: 'mffsCurrentOqoodOut',
    within: 'mffsCurrentOqoodWithin',
    total: 'mffsCurrentOqoodTotal',
    except: 'mffsCurOqoodExceptCapVal',
  },
  8: {
    out: 'mffsCurrentRefundOut',
    within: 'mffsCurrentRefundWithin',
    total: 'mffsCurrentRefundTotal',
    except: 'mffsCurRefundExceptCapVal',
  },
  9: {
    out: 'mffsCurBalInRetenAccOut',
    within: 'mffsCurBalInRetenAccWithin',
    total: 'mffsCurBalInRetenAccTotal',
    except: 'mffsCurBalInRetenExceptCapVal',
  },
  10: {
    out: 'mffsCurBalInTrustAccOut',
    within: 'mffsCurBalInTrustAccWithin',
    total: 'mffsCurBalInTrustAccTotal',
    except: 'mffsCurBalInExceptCapVal',
  },
  11: {
    out: 'mffsCurBalInSubsConsOut',
    within: 'mffsCurBalInRSubsConsWithin',
    total: 'mffsCurBalInSubsConsTotal',
    except: 'mffsCurBalInSubsConsCapVal',
  },
  12: {
    out: 'mffsCurTechnFeeOut',
    within: 'mffsCurTechnFeeWithin',
    total: 'mffsCurTechnFeeTotal',
    except: 'mffsCurTechFeeExceptCapVal',
  },
  13: {
    out: 'mffsCurUnIdeFundOut',
    within: 'mffsCurUnIdeFundWithin',
    total: 'mffsCurUnIdeFundTotal',
    except: 'mffsCurUnIdeExceptCapVal',
  },
  14: {
    out: 'mffsCurLoanInstalOut',
    within: 'mffsCurLoanInstalWithin',
    total: 'mffsCurLoanInstalTotal',
    except: 'mffsCurLoanExceptCapVal',
  },
  15: {
    out: 'mffsCurInfraCostOut',
    within: 'mffsCurInfraCostWithin',
    total: 'mffsCurInfraCostTotal',
    except: 'mffsCurInfraExceptCapVal',
  },
  16: {
    out: 'mffsCurOthersCostOut',
    within: 'mffsCurOthersCostWithin',
    total: 'mffsCurOthersCostTotal',
    except: 'mffsCurOthersExceptCapVal',
  },
  17: {
    out: 'mffsCurTransferCostOut',
    within: 'mffsCurTransferCostWithin',
    total: 'mffsCurTransferCostTotal',
    except: 'mffsCurTransferExceptCapVal',
  },
  18: {
    out: 'mffsCurForfeitCostOut',
    within: 'mffsCurForfeitCostWithin',
    total: 'mffsCurForfeitCostTotal',
    except: 'mffsCurForfeitExceptCapVal',
  },
  19: {
    out: 'mffsCurDeveEqtycostOut',
    within: 'mffsCurDeveEqtycostWithin',
    total: 'mffsCurDeveEqtycostTotal',
    except: 'mffsCurDeveExceptCapVal',
  },
  20: {
    out: 'mffsCurAmntFundOut',
    within: 'mffsCurAmntFundWithin',
    total: 'mffsCurAmntFundTotal',
    except: 'mffsCurAmntExceptCapVal',
  },
  21: {
    out: 'mffsCurOtherWithdOut',
    within: 'mffsCurOtherWithdWithin',
    total: 'mffsCurOtherWithdTotal',
    except: 'mffsCurOtherExceptCapVal',
  },
  22: {
    out: 'mffsCurOqoodOthFeeOut',
    within: 'mffsCurOqoodOthFeeWithin',
    total: 'mffsCurOqoodOthFeeTotal',
    except: 'mffsOtherFeesAnPaymentExcepVal',
  },
  23: {
    out: 'mffsCurVatDepositOut',
    within: 'mffsCurVatDepositWithin',
    total: 'mffsCurVatDepositTotal',
    except: 'mffsCurVatDepositCapVal',
  },
} as const

/**
 * Safely converts a value to string, handling null/undefined
 */
function safeToString(value: unknown): string {
  if (value == null || value === '') return ''
  return String(value)
}

/**
 * Transforms API financial summary response to UI-friendly FinancialData structure
 * This is a pure function optimized for performance
 */
export function transformFinancialSummaryData(
  financialData: any
): FinancialData {
  if (!financialData) {
    return {
      estimate: {
        revenue: '',
        constructionCost: '',
        projectManagementExpense: '',
        landCost: '',
        marketingExpense: '',
        date: null,
      },
      actual: {
        soldValue: '',
        constructionCost: '',
        infraCost: '',
        landCost: '',
        projectManagementExpense: '',
        marketingExpense: '',
        date: null,
      },
      breakdown: Array(24).fill(null).map(() => ({
        outOfEscrow: '',
        withinEscrow: '',
        total: '',
        exceptionalCapValue: '',
      })),
      additional: {
        creditInterestRetention: '',
        paymentsRetentionAccount: '',
        reimbursementsDeveloper: '',
        unitRegistrationFees: '',
        creditInterestEscrow: '',
        vatCapped: '',
      },
    }
  }

  // Transform breakdown array (24 items) - optimized with direct property access
  const breakdown = Array(24)
    .fill(null)
    .map((_, index) => {
      const mapping = BREAKDOWN_MAP[index as keyof typeof BREAKDOWN_MAP]
      if (!mapping) {
        return {
          outOfEscrow: '',
          withinEscrow: '',
          total: '',
          exceptionalCapValue: '',
        }
      }

      // Direct property access (faster than hasOwnProperty)
      const outValue = financialData[mapping.out]
      const withinValue = financialData[mapping.within]
      const totalValue = financialData[mapping.total]
      const exceptValue = financialData[mapping.except]

      return {
        outOfEscrow: safeToString(outValue),
        withinEscrow: safeToString(withinValue),
        total: safeToString(totalValue),
        exceptionalCapValue: safeToString(exceptValue),
      }
    })

  return {
    estimate: {
      revenue: safeToString(financialData.mffsEstRevenue),
      constructionCost: safeToString(financialData.mffsEstConstructionCost),
      projectManagementExpense: safeToString(
        financialData.mffsEstProjectMgmtExpense
      ),
      landCost: safeToString(financialData.mffsEstLandCost),
      marketingExpense: safeToString(financialData.mffsEstMarketingExpense),
      date: financialData.mffsEstimatedDate
        ? dayjs(financialData.mffsEstimatedDate)
        : null,
    },
    actual: {
      soldValue: safeToString(financialData.mffsActualSoldValue),
      constructionCost: safeToString(
        financialData.mffsActualConstructionCost
      ),
      infraCost: safeToString(financialData.mffsActualInfraCost),
      landCost: safeToString(financialData.mffsActualLandCost),
      projectManagementExpense: safeToString(
        financialData.mffsActualProjectMgmtExpense
      ),
      marketingExpense: safeToString(financialData.mffsActualMarketingExp),
      date: financialData.mffsActualDate
        ? dayjs(financialData.mffsActualDate)
        : null,
    },
    breakdown,
    additional: {
      creditInterestRetention: safeToString(
        financialData.mffsCreditInterest
      ),
      paymentsRetentionAccount: safeToString(
        financialData.mffsPaymentForRetentionAcc
      ),
      reimbursementsDeveloper: safeToString(
        financialData.mffsDeveloperReimburse
      ),
      unitRegistrationFees: safeToString(financialData.mffsUnitRegFees),
      creditInterestEscrow: safeToString(
        financialData.mffsCreditInterestProfit
      ),
      vatCapped: safeToString(financialData.mffsVatCappedCost),
    },
  }
}
