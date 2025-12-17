import dayjs from 'dayjs'

// Breakdown mapping - moved outside component for performance
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

// Helper function to safely extract value from financial data
const getValue = (data: any, key: string): string => {
  if (!data || !key) return ''
  const value = data[key]
  return value != null && value !== undefined && value !== '' ? String(value) : ''
}

// Transform API financial data to form format
export function transformFinancialDataToForm(financialData: any) {
  if (!financialData) return null

  // Transform breakdown array
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

      return {
        outOfEscrow: getValue(financialData, mapping.out),
        withinEscrow: getValue(financialData, mapping.within),
        total: getValue(financialData, mapping.total),
        exceptionalCapValue: getValue(financialData, mapping.except),
      }
    })

  return {
    estimate: {
      revenue: getValue(financialData, 'reafsEstRevenue'),
      constructionCost: getValue(financialData, 'reafsEstConstructionCost'),
      projectManagementExpense: getValue(financialData, 'reafsEstProjectMgmtExpense'),
      landCost: getValue(financialData, 'reafsEstLandCost'),
      marketingExpense: getValue(financialData, 'reafsEstMarketingExpense'),
      date: financialData.reafsEstimatedDate
        ? dayjs(financialData.reafsEstimatedDate)
        : null,
    },
    actual: {
      soldValue: getValue(financialData, 'reafsActualSoldValue'),
      constructionCost: getValue(financialData, 'reafsActualConstructionCost'),
      infraCost: getValue(financialData, 'reafsActualInfraCost'),
      landCost: getValue(financialData, 'reafsActualLandCost'),
      projectManagementExpense: getValue(financialData, 'reafsActualProjectMgmtExpense'),
      marketingExpense: getValue(financialData, 'reafsActualMarketingExp'),
      date: financialData.reafsActualDate ? dayjs(financialData.reafsActualDate) : null,
    },
    breakdown,
    additional: {
      creditInterestRetention: getValue(financialData, 'reafsCreditInterest'),
      paymentsRetentionAccount: getValue(financialData, 'reafsPaymentForRetentionAcc'),
      reimbursementsDeveloper: getValue(financialData, 'reafsDeveloperReimburse'),
      unitRegistrationFees: getValue(financialData, 'reafsUnitRegFees'),
      creditInterestEscrow: getValue(financialData, 'reafsCreditInterestProfit'),
      vatCapped: getValue(financialData, 'reafsVatCappedCost'),
    },
  }
}
