'use client'

import { useBudgetManagementLabelsWithCache as useBudgetManagementFirmLabelsApi } from '@/hooks/budget/useBudgetManagementLabelsWithCache'
import { useAppStore } from '@/store'
import React from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { useRouter } from 'next/navigation'
import { GlobalLoading } from '@/components/atoms'
import { budgetService } from '@/services/api/budgetApi/budgetManagementService'
import type { BudgetUIData } from '@/services/api/budgetApi/budgetManagementService'
import { BUDGET_MANAGEMENT_FIRM_LABELS } from '@/constants/mappings/budgetLabels'
import { budgetManagementService } from '@/services/api/budgetApi/budgetManagementService'
import type { BudgetItemResponse } from '@/utils/budgetMapper'
import { buildPartnerService } from '@/services/api/buildPartnerService'
import type { DocumentItem, ApiDocumentResponse } from '@/components/organisms/DeveloperStepper/developerTypes'
import { mapApiToDocumentItem } from '@/components/organisms/DocumentUpload/configs/budgetManagementConfig'
import { useIsDarkMode } from '@/hooks/useIsDarkMode'

const fieldBoxSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  marginBottom: '16px',
}

interface Step3Props {
  budgetId?: number | null
  isViewMode?: boolean
  onEditStep?: ((stepNumber: number) => void) | undefined
}

const Step3: React.FC<Step3Props> = ({
  budgetId,
  isViewMode = false,
  onEditStep,
}) => {
  const router = useRouter()
  const isDarkMode = useIsDarkMode()
  const { getLabel } = useBudgetManagementFirmLabelsApi()
  const currentLanguage = useAppStore((state) => state.language)
  const [budgetData, setBudgetData] = React.useState<BudgetUIData | null>(null)

  const labelSx = React.useMemo(
    () => ({
      color: isDarkMode ? '#E2E8F0' : '#6B7280',
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '16px',
      letterSpacing: 0,
      marginBottom: '4px',
    }),
    [isDarkMode]
  )
  const valueSx = React.useMemo(
    () => ({
      color: isDarkMode ? '#F1F5F9' : '#1F2937',
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: 0,
      wordBreak: 'break-word' as const,
    }),
    [isDarkMode]
  )
  const cardBg = isDarkMode ? '#101828' : '#FFFFFF'
  const cardBorder = isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB'
  const headingColor = isDarkMode ? '#E2E8F0' : '#1E2939'
  const buttonColor = isDarkMode ? '#94A3B8' : '#6B7280'
  const buttonBorder = isDarkMode ? '#475569' : '#D1D5DB'
  const buttonHoverBg = isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#F9FAFB'
  const tableHeaderBg = isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#F9FAFB'
  const tableRowHoverBg = isDarkMode ? 'rgba(51, 65, 85, 0.3)' : '#F9FAFB'
  const tableCellBorder = isDarkMode ? '#334155' : '#E5E7EB'
  const tableCellColor = isDarkMode ? '#E2E8F0' : '#374151'
  const [budgetItems, setBudgetItems] = React.useState<BudgetItemResponse[]>([])
  const [documents, setDocuments] = React.useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingItems, setIsLoadingItems] = React.useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const loadBudgetData = async () => {
      if (budgetId) {
        try {
          setIsLoading(true)
          setError(null)
          const data = await budgetService.getBudgetById(budgetId)
          setBudgetData(data)

          //  FIX: Load budget items using budgetId (not budgetCategoryId)
          console.log('[Step3] Budget data loaded:', {
            budgetId: data.id,
            budgetCategoriesDTOS: data.budgetCategoriesDTOS,
            budgetCategoriesDTOSLength: data.budgetCategoriesDTOS?.length,
          })

          // Fetch budget items using budgetId directly
          if (data.id) {
            setIsLoadingItems(true)
            try {
              console.log('[Step3] ===== Fetching budget items =====')
              console.log('[Step3] Budget ID:', data.id, 'Type:', typeof data.id)
              //  FIX: Use budgetId instead of categoryId (pass 0 as dummy categoryId)
              const response = await budgetManagementService.getBudgetItemsByBudgetCategoryId(
                0, // categoryId is deprecated, pass dummy value
                0, // page
                1000, // size
                data.id // budgetId is required
              )
              const items = response.content
              console.log('[Step3]  Fetch completed')
              console.log('[Step3] Budget items count:', items.length)
              console.log('[Step3] Total elements:', response.page.totalElements)
              console.log('[Step3] Budget items:', items)
              console.log('[Step3] First item sample:', items[0] ? {
                id: items[0].id,
                subCategoryCode: items[0].subCategoryCode,
                serviceCode: items[0].serviceCode,
                budgetCategoryDTO: items[0].budgetCategoryDTO,
                budgetDTO: items[0].budgetDTO
              } : 'No items')
              setBudgetItems(items)
            } catch (err) {
              console.error('[Step3] Error loading budget items:', err)
              setBudgetItems([])
            } finally {
              setIsLoadingItems(false)
            }
          } else {
            console.log('[Step3] No budgetId found, setting empty items array')
            setBudgetItems([])
          }

          // Load documents
          if (budgetId) {
            setIsLoadingDocuments(true)
            try {
              console.log('[Step3] Loading documents for budgetId:', budgetId)
              const docsResponse = await buildPartnerService.getBuildPartnerDocuments(
                budgetId.toString(),
                'BUDGET',
                0,
                100
              )
              console.log('[Step3] Documents response:', docsResponse)

              // Map API response to DocumentItem format using the mapper from budgetConfig
              const mappedDocuments: DocumentItem[] = docsResponse.content.map((doc: ApiDocumentResponse) =>
                mapApiToDocumentItem(doc)
              )
              console.log('[Step3] Mapped documents:', mappedDocuments)
              setDocuments(mappedDocuments)
            } catch (err) {
              console.error('[Step3] Error loading documents:', err)
              setDocuments([])
            } finally {
              setIsLoadingDocuments(false)
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load budget'))
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadBudgetData()
  }, [budgetId])

  const handleEditBasicDetails = () => {
    if (onEditStep) {
      onEditStep(0) // Step 0 is Budget Details
    } else if (budgetId) {
      router.push(`/budget/budget-management-firm/${budgetId}/step/1?editing=true`)
    }
  }

  const handleEditDocuments = () => {
    if (onEditStep) {
      onEditStep(1) // Step 1 is Documents
    } else if (budgetId) {
      router.push(`/budget/budget-management-firm/${budgetId}/step/2?editing=true`)
    }
  }

  const handleEditBudgetItems = () => {
    if (onEditStep) {
      onEditStep(2) // Step 2 is Budget Items
    } else if (budgetId) {
      router.push(`/budget/budget-management-firm/${budgetId}/step/3?editing=true`)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <GlobalLoading />
      </Box>
    )
  }

  if (error) {
    return (
      <Card sx={{ boxShadow: 'none', backgroundColor: cardBg, border: cardBorder, width: '84%', margin: '0 auto' }}>
        <CardContent>
          <Alert severity="error">
            {error.message}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!budgetData) {
    return (
      <Card sx={{ boxShadow: 'none', backgroundColor: cardBg, border: cardBorder, width: '84%', margin: '0 auto' }}>
        <CardContent>
          <Alert severity="info">
            No budget data available. Please complete Step 1 and Step 2 first.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Budget Details Card */}
      <Card
        sx={{
          boxShadow: 'none',
          backgroundColor: cardBg,
          width: '100%',
          margin: '0 auto',
          mb: 3,
          border: cardBorder,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '24px',
                color: headingColor,
              }}
            >
              {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.SECTION_TITLES.GENERAL, currentLanguage, 'Budget Details')}
            </Typography>
            {!isViewMode && (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={handleEditBasicDetails}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: buttonColor,
                  borderColor: buttonBorder,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: isDarkMode ? '#64748B' : '#9CA3AF',
                    backgroundColor: buttonHoverBg,
                  },
                }}
              >
                Edit
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 3, borderColor: isDarkMode ? '#334155' : '#E5E7EB' }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.BUDGET_ID, currentLanguage, 'Budget ID')}:
                </Typography>
                <Typography sx={valueSx}>{budgetData.budgetId || '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.BUDGET_NAME, currentLanguage, 'Budget Name')}:
                </Typography>
                <Typography sx={valueSx}>{budgetData.budgetName || '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.BUDGET_PERIOD_CODE, currentLanguage, 'Budget Period Code')}:
                </Typography>
                <Typography sx={valueSx}>{budgetData.budgetPeriodCode || '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.MASTER_COMMUNITY_NAME, currentLanguage, 'Master Community Name')}:
                </Typography>
                <Typography sx={valueSx}>{budgetData.masterCommunityName || '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.MANAGEMENT_COMPANY_NAME, currentLanguage, 'Management Company Name')}:
                </Typography>
                <Typography sx={valueSx}>
                  {budgetData.managementFirmDTO?.mfName || budgetData.managementCompanyName || '-'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.MANAGEMENT_FIRM_MANAGER_EMAIL, currentLanguage, 'Property Manager Email')}:
                </Typography>
                <Typography sx={valueSx}>{budgetData.propertyManagerEmail || '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>
                  {getLabel(BUDGET_MANAGEMENT_FIRM_LABELS.FORM_FIELDS.SERVICE_CHARGE_GROUP_NAME, currentLanguage, 'Service Charge Group')}:
                </Typography>
                <Typography sx={valueSx}>{budgetData.serviceChargeGroupName || '-'}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={fieldBoxSx}>
                <Typography sx={labelSx}>Total Cost:</Typography>
                <Typography sx={valueSx}>{budgetData.totalCostDisplay || 0}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Budget Items Section - Always show, even if empty */}
      <Card
        sx={{
          boxShadow: 'none',
          backgroundColor: cardBg,
          width: '100%',
          margin: '0 auto',
          mb: 3,
          border: cardBorder,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '24px',
                color: headingColor,
              }}
            >
              Budget Items
            </Typography>
            {!isViewMode && (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={handleEditBudgetItems}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: buttonColor,
                  borderColor: buttonBorder,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: isDarkMode ? '#64748B' : '#9CA3AF',
                    backgroundColor: buttonHoverBg,
                  },
                }}
              >
                Edit
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 3, borderColor: tableCellBorder }} />

          {isLoadingItems ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <GlobalLoading />
            </Box>
          ) : budgetItems.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{ boxShadow: 'none', border: `1px solid ${tableCellBorder}`, backgroundColor: isDarkMode ? 'transparent' : undefined }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: tableHeaderBg }}>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }}>
                      Sub-Category Name
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }}>
                      Sub-Category Name (Local)
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }}>
                      Service Code
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }}>
                      Service Name
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }} align="right">
                      Total Budget
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }} align="right">
                      Available Budget
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }} align="right">
                      Utilized Budget
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgetItems.map((item, index) => (
                    <TableRow
                      key={item.id || index}
                      sx={{ '&:hover': { backgroundColor: tableRowHoverBg } }}
                    >
                      <TableCell sx={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: tableCellColor, borderBottom: `1px solid ${tableCellBorder}` }}>
                        {item.subCategoryName || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                      >
                        {item.subCategoryNameLocale || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                      >
                        {item.serviceCode || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                      >
                        {item.serviceName || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                        align="right"
                      >
                        {item.totalBudget ?? 0}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                        align="right"
                      >
                        {item.availableBudget ?? 0}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                        align="right"
                      >
                        {item.utilizedBudget ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280',
                }}
              >
                No budget items found. Please add items in Step 3.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Documents Section - Always show, even if empty */}
      <Card
        sx={{
          boxShadow: 'none',
          backgroundColor: cardBg,
          width: '100%',
          margin: '0 auto',
          mb: 3,
          border: cardBorder,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '24px',
                color: headingColor,
              }}
            >
              Submitted Documents
            </Typography>
            {!isViewMode && (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={handleEditDocuments}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: buttonColor,
                  borderColor: buttonBorder,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: isDarkMode ? '#64748B' : '#9CA3AF',
                    backgroundColor: buttonHoverBg,
                  },
                }}
              >
                Edit
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 3, borderColor: tableCellBorder }} />

          {isLoadingDocuments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <GlobalLoading />
            </Box>
          ) : documents.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{ boxShadow: 'none', border: `1px solid ${tableCellBorder}`, backgroundColor: isDarkMode ? 'transparent' : undefined }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: tableHeaderBg }}>
                    <TableCell
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: tableCellColor,
                        borderBottom: `1px solid ${tableCellBorder}`,
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: tableCellColor,
                        borderBottom: `1px solid ${tableCellBorder}`,
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: tableCellColor,
                        borderBottom: `1px solid ${tableCellBorder}`,
                      }}
                    >
                      Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow
                      key={doc.id || index}
                      sx={{ '&:hover': { backgroundColor: tableRowHoverBg } }}
                    >
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                      >
                        {doc.name || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                      >
                        {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB') : '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: tableCellColor,
                          borderBottom: `1px solid ${tableCellBorder}`,
                        }}
                      >
                        {doc.classification || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280',
                }}
              >
                No documents found. Please add documents in Step 2.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Step3
