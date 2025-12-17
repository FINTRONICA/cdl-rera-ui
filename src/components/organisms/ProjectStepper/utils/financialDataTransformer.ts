import dayjs from 'dayjs'
import type { FinancialData } from '../types'

/**
 * Breakdown mapping configuration - extracted as constant for performance
 * Maps API field names to UI structure
 */
export const BREAKDOWN_MAP = {
  0: {
    out: 'reafsCurCashRecvdOutEscrow',
    within: 'reafsCurCashRecvdWithinEscrow',
    total: 'reafsCurCashRecvdTotal',
    except: 'reafsCurCashexceptCapVal',
  },
  1: {
    out: 'reafsCurLandCostOut',
    within: 'reafsCurLandCostWithin',
    total: 'reafsCurLandTotal',
    except: 'reafsCurLandexceptCapVal',
  },
  2: {
    out: 'reafsCurConsCostOut',
    within: 'reafsCurConsCostWithin',
    total: 'reafsCurConsCostTotal',
    except: 'reafsCurConsExcepCapVal',
  },
  3: {
    out: 'reafsCurrentMktgExpOut',
    within: 'reafsCurrentMktgExpWithin',
    total: 'reafsCurrentMktgExpTotal',
    except: 'reafsCurrentmktgExcepCapVal',
  },
  4: {
    out: 'reafsCurProjMgmtExpOut',
    within: 'reafsCurProjMgmtExpWithin',
    total: 'reafsCurProjMgmtExpTotal',
    except: 'reafsCurProjExcepCapVal',
  },
  5: {
    out: 'currentMortgageOut',
    within: 'reafsCurrentMortgageWithin',
    total: 'reafsCurrentMortgageTotal',
    except: 'reafsCurMortgageExceptCapVal',
  },
  6: {
    out: 'reafsCurrentVatPaymentOut',
    within: 'reafsCurrentVatPaymentWithin',
    total: 'reafsCurrentVatPaymentTotal',
    except: 'reafsCurVatExceptCapVal',
  },
  7: {
    out: 'reafsCurrentOqoodOut',
    within: 'reafsCurrentOqoodWithin',
    total: 'reafsCurrentOqoodTotal',
    except: 'reafsCurOqoodExceptCapVal',
  },
  8: {
    out: 'reafsCurrentRefundOut',
    within: 'reafsCurrentRefundWithin',
    total: 'reafsCurrentRefundTotal',
    except: 'reafsCurRefundExceptCapVal',
  },
  9: {
    out: 'reafsCurBalInRetenAccOut',
    within: 'reafsCurBalInRetenAccWithin',
    total: 'reafsCurBalInRetenAccTotal',
    except: 'reafsCurBalInRetenExceptCapVal',
  },
  10: {
    out: 'reafsCurBalInTrustAccOut',
    within: 'reafsCurBalInTrustAccWithin',
    total: 'reafsCurBalInTrustAccTotal',
    except: 'reafsCurBalInExceptCapVal',
  },
  11: {
    out: 'reafsCurBalInSubsConsOut',
    within: 'reafsCurBalInRSubsConsWithin',
    total: 'reafsCurBalInSubsConsTotal',
    except: 'reafsCurBalInSubsConsCapVal',
  },
  12: {
    out: 'reafsCurTechnFeeOut',
    within: 'reafsCurTechnFeeWithin',
    total: 'reafsCurTechnFeeTotal',
    except: 'reafsCurTechFeeExceptCapVal',
  },
  13: {
    out: 'reafsCurUnIdeFundOut',
    within: 'reafsCurUnIdeFundWithin',
    total: 'reafsCurUnIdeFundTotal',
    except: 'reafsCurUnIdeExceptCapVal',
  },
  14: {
    out: 'reafsCurLoanInstalOut',
    within: 'reafsCurLoanInstalWithin',
    total: 'reafsCurLoanInstalTotal',
    except: 'reafsCurLoanExceptCapVal',
  },
  15: {
    out: 'reafsCurInfraCostOut',
    within: 'reafsCurInfraCostWithin',
    total: 'reafsCurInfraCostTotal',
    except: 'reafsCurInfraExceptCapVal',
  },
  16: {
    out: 'reafsCurOthersCostOut',
    within: 'reafsCurOthersCostWithin',
    total: 'reafsCurOthersCostTotal',
    except: 'reafsCurOthersExceptCapVal',
  },
  17: {
    out: 'reafsCurTransferCostOut',
    within: 'reafsCurTransferCostWithin',
    total: 'reafsCurTransferCostTotal',
    except: 'reafsCurTransferExceptCapVal',
  },
  18: {
    out: 'reafsCurForfeitCostOut',
    within: 'reafsCurForfeitCostWithin',
    total: 'reafsCurForfeitCostTotal',
    except: 'reafsCurForfeitExceptCapVal',
  },
  19: {
    out: 'reafsCurDeveEqtycostOut',
    within: 'reafsCurDeveEqtycostWithin',
    total: 'reafsCurDeveEqtycostTotal',
    except: 'reafsCurDeveExceptCapVal',
  },
  20: {
    out: 'reafsCurAmntFundOut',
    within: 'reafsCurAmntFundWithin',
    total: 'reafsCurAmntFundTotal',
    except: 'reafsCurAmntExceptCapVal',
  },
  21: {
    out: 'reafsCurOtherWithdOut',
    within: 'reafsCurOtherWithdWithin',
    total: 'reafsCurOtherWithdTotal',
    except: 'reafsCurOtherExceptCapVal',
  },
  22: {
    out: 'reafsCurOqoodOthFeeOut',
    within: 'reafsCurOqoodOthFeeWithin',
    total: 'reafsCurOqoodOthFeeTotal',
    except: 'reafsOtherFeesAnPaymentExcepVal',
  },
  23: {
    out: 'reafsCurVatDepositOut',
    within: 'reafsCurVatDepositWithin',
    total: 'reafsCurVatDepositTotal',
    except: 'reafsCurVatDepositCapVal',
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
      revenue: safeToString(financialData.reafsEstRevenue),
      constructionCost: safeToString(financialData.reafsEstConstructionCost),
      projectManagementExpense: safeToString(
        financialData.reafsEstProjectMgmtExpense
      ),
      landCost: safeToString(financialData.reafsEstLandCost),
      marketingExpense: safeToString(financialData.reafsEstMarketingExpense),
      date: financialData.reafsEstimatedDate
        ? dayjs(financialData.reafsEstimatedDate)
        : null,
    },
    actual: {
      soldValue: safeToString(financialData.reafsActualSoldValue),
      constructionCost: safeToString(
        financialData.reafsActualConstructionCost
      ),
      infraCost: safeToString(financialData.reafsActualInfraCost),
      landCost: safeToString(financialData.reafsActualLandCost),
      projectManagementExpense: safeToString(
        financialData.reafsActualProjectMgmtExpense
      ),
      marketingExpense: safeToString(financialData.reafsActualMarketingExp),
      date: financialData.reafsActualDate
        ? dayjs(financialData.reafsActualDate)
        : null,
    },
    breakdown,
    additional: {
      creditInterestRetention: safeToString(
        financialData.reafsCreditInterest
      ),
      paymentsRetentionAccount: safeToString(
        financialData.reafsPaymentForRetentionAcc
      ),
      reimbursementsDeveloper: safeToString(
        financialData.reafsDeveloperReimburse
      ),
      unitRegistrationFees: safeToString(financialData.reafsUnitRegFees),
      creditInterestEscrow: safeToString(
        financialData.reafsCreditInterestProfit
      ),
      vatCapped: safeToString(financialData.reafsVatCappedCost),
    },
  }
}
