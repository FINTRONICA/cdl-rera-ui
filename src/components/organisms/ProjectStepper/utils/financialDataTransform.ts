/**
 * Utility functions for transforming financial summary data
 * Memoized to prevent unnecessary re-computation
 */

import dayjs from 'dayjs'

// Breakdown mapping configuration - extracted to constant for reusability
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
 * Transforms breakdown data from API format to UI format
 * Memoized to prevent unnecessary re-computation
 */
export function transformBreakdownData(financialData: any) {
  return Array(24)
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

      // Explicitly access each field to ensure correct mapping per index
      const outValue = financialData?.hasOwnProperty(mapping.out)
        ? financialData[mapping.out]
        : undefined
      const withinValue = financialData?.hasOwnProperty(mapping.within)
        ? financialData[mapping.within]
        : undefined
      const totalValue = financialData?.hasOwnProperty(mapping.total)
        ? financialData[mapping.total]
        : undefined
      const exceptValue = financialData?.hasOwnProperty(mapping.except)
        ? financialData[mapping.except]
        : undefined

      return {
        outOfEscrow:
          outValue != null && outValue !== undefined && outValue !== ''
            ? String(outValue)
            : '',
        withinEscrow:
          withinValue != null &&
          withinValue !== undefined &&
          withinValue !== ''
            ? String(withinValue)
            : '',
        total:
          totalValue != null &&
          totalValue !== undefined &&
          totalValue !== ''
            ? String(totalValue)
            : '',
        exceptionalCapValue:
          exceptValue != null &&
          exceptValue !== undefined &&
          exceptValue !== ''
            ? String(exceptValue)
            : '',
      }
    })
}

/**
 * Transforms complete financial data from API format to UI format
 */
export function transformFinancialData(financialData: any) {
  const breakdown = transformBreakdownData(financialData)

  return {
    estimate: {
      revenue: financialData?.reafsEstRevenue?.toString() || '',
      constructionCost:
        financialData?.reafsEstConstructionCost?.toString() || '',
      projectManagementExpense:
        financialData?.reafsEstProjectMgmtExpense?.toString() || '',
      landCost: financialData?.reafsEstLandCost?.toString() || '',
      marketingExpense:
        financialData?.reafsEstMarketingExpense?.toString() || '',
      date: financialData?.reafsEstimatedDate
        ? dayjs(financialData.reafsEstimatedDate)
        : null,
    },
    actual: {
      soldValue: financialData?.reafsActualSoldValue?.toString() || '',
      constructionCost:
        financialData?.reafsActualConstructionCost?.toString() || '',
      infraCost: financialData?.reafsActualInfraCost?.toString() || '',
      landCost: financialData?.reafsActualLandCost?.toString() || '',
      projectManagementExpense:
        financialData?.reafsActualProjectMgmtExpense?.toString() || '',
      marketingExpense:
        financialData?.reafsActualMarketingExp?.toString() || '',
      date: financialData?.reafsActualDate
        ? dayjs(financialData.reafsActualDate)
        : null,
    },
    breakdown,
    additional: {
      creditInterestRetention:
        financialData?.reafsCreditInterest?.toString() || '',
      paymentsRetentionAccount:
        financialData?.reafsPaymentForRetentionAcc?.toString() || '',
      reimbursementsDeveloper:
        financialData?.reafsDeveloperReimburse?.toString() || '',
      unitRegistrationFees:
        financialData?.reafsUnitRegFees?.toString() || '',
      creditInterestEscrow:
        financialData?.reafsCreditInterestProfit?.toString() || '',
      vatCapped: financialData?.reafsVatCappedCost?.toString() || '',
    },
  }
}
