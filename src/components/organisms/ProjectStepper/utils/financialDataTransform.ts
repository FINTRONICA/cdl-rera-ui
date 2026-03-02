/**
 * Utility functions for transforming financial summary data
 * Memoized to prevent unnecessary re-computation
 */

import dayjs from 'dayjs'

// Breakdown mapping configuration - extracted to constant for reusability
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
      revenue: financialData?.mffsEstRevenue?.toString() || '',
      constructionCost:
        financialData?.mffsEstConstructionCost?.toString() || '',
      projectManagementExpense:
        financialData?.mffsEstProjectMgmtExpense?.toString() || '',
      landCost: financialData?.mffsEstLandCost?.toString() || '',
      marketingExpense:
        financialData?.mffsEstMarketingExpense?.toString() || '',
      date: financialData?.mffsEstimatedDate
        ? dayjs(financialData.mffsEstimatedDate)
        : null,
    },
    actual: {
      soldValue: financialData?.mffsActualSoldValue?.toString() || '',
      constructionCost:
        financialData?.mffsActualConstructionCost?.toString() || '',
      infraCost: financialData?.mffsActualInfraCost?.toString() || '',
      landCost: financialData?.mffsActualLandCost?.toString() || '',
      projectManagementExpense:
        financialData?.mffsActualProjectMgmtExpense?.toString() || '',
      marketingExpense:
        financialData?.mffsActualMarketingExp?.toString() || '',
      date: financialData?.mffsActualDate
        ? dayjs(financialData.mffsActualDate)
        : null,
    },
    breakdown,
    additional: {
      creditInterestRetention:
        financialData?.mffsCreditInterest?.toString() || '',
      paymentsRetentionAccount:
        financialData?.mffsPaymentForRetentionAcc?.toString() || '',
      reimbursementsDeveloper:
        financialData?.mffsDeveloperReimburse?.toString() || '',
      unitRegistrationFees:
        financialData?.mffsUnitRegFees?.toString() || '',
      creditInterestEscrow:
        financialData?.mffsCreditInterestProfit?.toString() || '',
      vatCapped: financialData?.mffsVatCappedCost?.toString() || '',
    },
  }
}
