import dayjs from 'dayjs'

// Breakdown mapping - moved outside component for performance
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
      revenue: getValue(financialData, 'mffsEstRevenue'),
      constructionCost: getValue(financialData, 'mffsEstConstructionCost'),
      projectManagementExpense: getValue(financialData, 'mffsEstProjectMgmtExpense'),
      landCost: getValue(financialData, 'mffsEstLandCost'),
      marketingExpense: getValue(financialData, 'mffsEstMarketingExpense'),
      date: financialData.mffsEstimatedDate
        ? dayjs(financialData.mffsEstimatedDate)
        : null,
    },
    actual: {
      soldValue: getValue(financialData, 'mffsActualSoldValue'),
      constructionCost: getValue(financialData, 'mffsActualConstructionCost'),
      infraCost: getValue(financialData, 'mffsActualInfraCost'),
      landCost: getValue(financialData, 'mffsActualLandCost'),
      projectManagementExpense: getValue(financialData, 'mffsActualProjectMgmtExpense'),
      marketingExpense: getValue(financialData, 'mffsActualMarketingExp'),
      date: financialData.mffsActualDate ? dayjs(financialData.mffsActualDate) : null,
    },
    breakdown,
    additional: {
      creditInterestRetention: getValue(financialData, 'mffsCreditInterest'),
      paymentsRetentionAccount: getValue(financialData, 'mffsPaymentForRetentionAcc'),
      reimbursementsDeveloper: getValue(financialData, 'mffsDeveloperReimburse'),
      unitRegistrationFees: getValue(financialData, 'mffsUnitRegFees'),
      creditInterestEscrow: getValue(financialData, 'mffsCreditInterestProfit'),
      vatCapped: getValue(financialData, 'mffsVatCappedCost'),
    },
  }
}
