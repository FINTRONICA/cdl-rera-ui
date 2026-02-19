'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Checkbox,
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
import { useParams } from 'next/navigation'
import {
  buildPartnerService,
  type BuildPartner,
  type BuildPartnerContactResponse,
} from '@/services/api/buildPartnerService'
import { formatDate } from '@/utils'
import { GlobalLoading } from '@/components/atoms'
import { useBuildPartnerLabelsWithCache } from '@/hooks/useBuildPartnerLabelsWithCache'
import { getBuildPartnerLabel } from '@/constants/mappings/buildPartnerMapping'
import { useAppStore } from '@/store'

// Hook to detect dark mode
const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}

const getLabelSx = (isDark: boolean) => ({
  color: isDark ? '#9CA3AF' : '#6B7280',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: '16px',
  letterSpacing: 0,
  marginBottom: '4px',
})

const getValueSx = (isDark: boolean) => ({
  color: isDark ? '#F9FAFB' : '#1F2937',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '20px',
  letterSpacing: 0,
  wordBreak: 'break-word',
})

const fieldBoxSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  marginBottom: '16px',
}

function hasContentArray<T>(value: unknown): value is { content: T[] } {
  return (
    value != null &&
    typeof value === 'object' &&
    'content' in value &&
    Array.isArray((value as { content: unknown[] }).content)
  )
}

// Data interfaces
interface ContactData {
  arcFirstName: string
  arcLastName: string
  arcContactEmail: string
  arcContactAddressLine1: string
  arcContactAddressLine2: string
  arcContactPoBox: string
  arcCountryMobCode: string
  arcContactTelNo: string
  arcContactMobNo: string
  arcContactFaxNo: string
}

interface DocumentData {
  id: string
  fileName: string
  documentType: string
  uploadDate: string
  fileSize: number
}

interface Step3Props {
  developerId?: string | undefined
  onEditStep?: ((stepNumber: number) => void) | undefined
  isReadOnly?: boolean
}

const Step3 = ({ developerId, onEditStep, isReadOnly = false }: Step3Props) => {
  const params = useParams()
  const buildPartnerId = developerId || (params.id as string)
  const isDarkMode = useIsDarkMode()

  const [buildPartnerDetails, setBuildPartnerDetails] =
    useState<BuildPartner | null>(null)
  const [contactData, setContactData] = useState<ContactData[]>([])
 
  const [documentData, setDocumentData] = useState<DocumentData[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dynamic labels helper (same as other steps)
  const { data: buildPartnerLabels, getLabel } =
    useBuildPartnerLabelsWithCache()
  const currentLanguage = useAppStore((state) => state.language) || 'EN'
  const getBuildPartnerLabelDynamic = useCallback(
    (configId: string): string => {
      const fallback = getBuildPartnerLabel(configId)
      return buildPartnerLabels
        ? getLabel(configId, currentLanguage, fallback)
        : fallback
    },
    [buildPartnerLabels, currentLanguage, getLabel]
  )

  // Render helper functions with dark mode support
  const renderDisplayField = useCallback(
    (label: string, value: string | number | null | undefined = '-') => (
      <Box sx={fieldBoxSx}>
        <Typography sx={getLabelSx(isDarkMode)}>{label}</Typography>
        <Typography sx={getValueSx(isDarkMode)}>{value ?? '-'}</Typography>
      </Box>
    ),
    [isDarkMode]
  )

  const renderCheckboxField = useCallback(
    (label: string, checked: boolean) => (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Checkbox checked={checked} disabled sx={{ p: 0, pr: 1 }} />
        <Typography sx={getValueSx(isDarkMode)}>{label}</Typography>
      </Box>
    ),
    [isDarkMode]
  )

  useEffect(() => {
    const fetchAllData = async () => {
      if (!buildPartnerId) {
        setError('Build Partner ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel

        const [details, contacts, _fees, _beneficiaries, documents] =
          await Promise.allSettled([
            buildPartnerService.getBuildPartner(buildPartnerId),
            buildPartnerService.getBuildPartnerContact(buildPartnerId),
            buildPartnerService.getBuildPartnerFees(buildPartnerId),
            buildPartnerService.getBuildPartnerBeneficiaries(buildPartnerId),
            buildPartnerService.getBuildPartnerDocuments(
              buildPartnerId,
              'BUILD_PARTNER'
            ),
          ])

        const detailsResult =
          details.status === 'fulfilled' ? details.value : null
        const contactsResult =
          contacts.status === 'fulfilled' ? contacts.value : null
        const documentsResult =
          documents.status === 'fulfilled' ? documents.value : null

        setBuildPartnerDetails(detailsResult as BuildPartner)

        let contactArray: BuildPartnerContactResponse[] = []
        if (hasContentArray<BuildPartnerContactResponse>(contactsResult)) {
          contactArray = contactsResult.content
        } else if (Array.isArray(contactsResult)) {
          contactArray = contactsResult as BuildPartnerContactResponse[]
        }
        const normalizedContacts: ContactData[] = contactArray.map((c) => ({
          arcFirstName: c.arcFirstName ?? c.bpcFirstName ?? '',
          arcLastName: c.arcLastName ?? c.bpcLastName ?? '',
          arcContactEmail: c.arcContactEmail ?? c.bpcContactEmail ?? '',
          arcContactAddressLine1: c.arcContactAddressLine1 ?? c.bpcContactAddressLine1 ?? '',
          arcContactAddressLine2: c.arcContactAddressLine2 ?? c.bpcContactAddressLine2 ?? '',
          arcContactPoBox: c.arcContactPoBox ?? c.bpcContactPoBox ?? '',
          arcCountryMobCode: c.arcCountryMobCode ?? c.bpcCountryMobCode ?? '',
          arcContactTelNo: c.arcContactTelNo ?? c.bpcContactTelNo ?? '',
          arcContactMobNo: c.arcContactMobNo ?? c.bpcContactMobNo ?? '',
          arcContactFaxNo: c.arcContactFaxNo ?? c.bpcContactFaxNo ?? '',
        }))
        setContactData(normalizedContacts)


        // Handle paginated responses for documents
        let documentArray: any[] = []
        if (Array.isArray(documentsResult)) {
          documentArray = documentsResult
        } else if (
          documentsResult &&
          typeof documentsResult === 'object' &&
          'content' in documentsResult
        ) {
          documentArray = Array.isArray((documentsResult as any).content)
            ? (documentsResult as any).content
            : []
        }

        setDocumentData(
          documentArray.map((doc) => ({
            id: doc.id?.toString() || '',
            fileName: doc.documentName || '',
            documentType:
              doc.documentTypeDTO?.languageTranslationId?.configValue || '',
            uploadDate: doc.uploadDate || '',
            fileSize: parseInt(doc.documentSize || '0'),
          }))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [buildPartnerId])

  // Render contact fields with actual API data
  const renderContactFields = (
    contact: ContactData,
    title: string,
    isLast: boolean
  ) => {
    const fields = [
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_AUTH_NAME'),
        value:
          `${contact.arcFirstName || ''} ${contact.arcLastName || ''}`.trim() ||
          '',
        gridSize: 6,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_EMAIL_ADDRESS'),
        value: contact.arcContactEmail || ' ',
        gridSize: 6,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_BUSINESS_ADDRESS'),
        value:
          `${contact.arcContactAddressLine1 || ''} ${contact.arcContactAddressLine2 || ''}`.trim() ||
          '',
        gridSize: 6,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_POBOX'),
        value: contact.arcContactPoBox || '',
        gridSize: 6,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_COUNTRY_CODE'),
        value: contact.arcCountryMobCode || '',
        gridSize: 3,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_TELEPHONE_NUMBER'),
        value: contact.arcContactTelNo || '',
        gridSize: 3,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_MOBILE_NUMBER'),
        value: contact.arcContactMobNo || '',
        gridSize: 3,
      },
      {
        label: getBuildPartnerLabelDynamic('CDL_AR_FAX_NUMBER'),
        value: contact.arcContactFaxNo || '',
        gridSize: 3,
      },
    ]
    return (
      <Box sx={{ mb: 0 }}>
        <Typography
          sx={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 500,
            fontStyle: 'normal',
            fontSize: '16px',
            lineHeight: '28px',
            letterSpacing: '0.15px',
            verticalAlign: 'middle',
            mb: 2,
            color: isDarkMode ? '#F9FAFB' : '#1E2939',
          }}
        >
          {title}
        </Typography>
        <Grid container spacing={3}>
          {fields.map((field, idx) => (
            <Grid
              size={{ xs: 12, md: field.gridSize || 6 }}
              key={`${title}-${idx}`}
            >
              {renderDisplayField(
                field.label,
                field.value as string | number | null
              )}
            </Grid>
          ))}
        </Grid>
        {!isLast && (
          <Divider
            sx={{
              mb: 0,
              mt: 4,
              borderColor: isDarkMode ? '#334155' : '#E5E7EB',
            }}
          />
        )}
      </Box>
    )
  }



  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          backgroundColor: isDarkMode ? '#101828' : '#FFFFFFBF',
          borderRadius: '16px',
          margin: '0 auto',
          width: '100%',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GlobalLoading fullHeight className="min-h-[400px]" />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  // No data state
  if (!buildPartnerDetails) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No build partner details found.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Card
        sx={{
          boxShadow: 'none',
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
          width: '100%',
          margin: '0 auto',
          mb: 3,
          border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
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
                color: isDarkMode ? '#F9FAFB' : '#1E2939',
              }}
            >
              {getBuildPartnerLabelDynamic('CDL_AR_DETAILS')}
            </Typography>
            {!isReadOnly && (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={() => {
                  onEditStep?.(0)
                }}
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: isDarkMode ? '#93C5FD' : '#6B7280',
                  borderColor: isDarkMode ? '#334155' : '#D1D5DB',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: isDarkMode ? '#475569' : '#9CA3AF',
                    backgroundColor: isDarkMode
                      ? 'rgba(51, 65, 85, 0.3)'
                      : '#F9FAFB',
                  },
                }}
              >
                Edit
              </Button>
            )}
          </Box>
          <Divider
            sx={{
              mb: 3,
              borderColor: isDarkMode ? '#334155' : '#E5E7EB',
            }}
          />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_ID'),
                buildPartnerDetails.arDeveloperId
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_CIF'),
                buildPartnerDetails.arCifrera
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_REGNO'),
                buildPartnerDetails.arDeveloperRegNo
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_REGDATE'),
                buildPartnerDetails.arOnboardingDate
                  ? formatDate(
                      buildPartnerDetails.arOnboardingDate,
                      'DD/MM/YYYY'
                    )
                  : ' '
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_NAME'),
                buildPartnerDetails.arName
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_NAME_LOCALE'),
                buildPartnerDetails.arNameLocal
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_PROJECT'),
                buildPartnerDetails.arProjectName
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_MASTER_DEVELOPER'),
                buildPartnerDetails.arMasterDeveloper
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_MASTER_COMMUNITY'),
                buildPartnerDetails.arMasterCommunity
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_COMPANY_NUMBER'),
                buildPartnerDetails.arCompanyNumber
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_MASTER'),
                buildPartnerDetails.arMasterName
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_REGULATORY_AUTHORITY'),
                (buildPartnerDetails.arRegulatorDTO as any)
                  ?.languageTranslationId?.configValue || null
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_ADDRESS'),
                buildPartnerDetails.arContactAddress
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_MOBILE'),
                  buildPartnerDetails.arMobile
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_EMAIL'),
                buildPartnerDetails.arEmail
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_FAX'),
                buildPartnerDetails.arFax
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_LICENSE'),
                buildPartnerDetails.arLicenseNo
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_LICENSE_VALID'),
                  buildPartnerDetails.arLicenseExpDate
                  ? formatDate(
                      buildPartnerDetails.arLicenseExpDate,
                      'DD/MM/YYYY'
                    )
                  : ' '
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {renderCheckboxField(
                getBuildPartnerLabelDynamic('CDL_AR_WORLD_STATUS'),
                buildPartnerDetails.arWorldCheckFlag === 'true'
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {renderCheckboxField(
                'Migrated Data',
                buildPartnerDetails.arMigratedData === true
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_WORLD_REMARKS'),
                buildPartnerDetails.arWorldCheckRemarks
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                getBuildPartnerLabelDynamic('CDL_AR_NOTES'),
                buildPartnerDetails.arRemark
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {renderDisplayField(
                'Account Contact Number',
                  buildPartnerDetails.arContactTel
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Submitted Documents Section */}
      {documentData.length > 0 && (
        <Card
          sx={{
            boxShadow: 'none',
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            width: '100%',
            margin: '0 auto',
            mb: 3,
            border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
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
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                }}
              >
                Submitted Documents
              </Typography>
              {!isReadOnly && (
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => {
                    onEditStep?.(1)
                  }}
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: isDarkMode ? '#93C5FD' : '#6B7280',
                    borderColor: isDarkMode ? '#334155' : '#D1D5DB',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: isDarkMode ? '#475569' : '#9CA3AF',
                      backgroundColor: isDarkMode
                        ? 'rgba(51, 65, 85, 0.3)'
                        : '#F9FAFB',
                    },
                  }}
                >
                  Edit
                </Button>
              )}
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 'none',
                border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: isDarkMode ? '#1E293B' : '#F9FAFB',
                    }}
                  >
                    <TableCell
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: isDarkMode ? '#F9FAFB' : '#374151',
                        borderBottom: isDarkMode
                          ? '1px solid #334155'
                          : '1px solid #E5E7EB',
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: isDarkMode ? '#F9FAFB' : '#374151',
                        borderBottom: isDarkMode
                          ? '1px solid #334155'
                          : '1px solid #E5E7EB',
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: isDarkMode ? '#F9FAFB' : '#374151',
                        borderBottom: isDarkMode
                          ? '1px solid #334155'
                          : '1px solid #E5E7EB',
                      }}
                    >
                      Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documentData.map((doc, index) => (
                    <TableRow
                      key={doc.id || index}
                      sx={{
                        '&:hover': {
                          backgroundColor: isDarkMode ? '#334155' : '#F9FAFB',
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: isDarkMode ? '#E5E7EB' : '#374151',
                          borderBottom: isDarkMode
                            ? '1px solid #334155'
                            : '1px solid #E5E7EB',
                        }}
                      >
                        {doc.fileName}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: isDarkMode ? '#E5E7EB' : '#374151',
                          borderBottom: isDarkMode
                            ? '1px solid #334155'
                            : '1px solid #E5E7EB',
                        }}
                      >
                        {formatDate(doc.uploadDate, 'DD/MM/YYYY')}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '14px',
                          color: isDarkMode ? '#E5E7EB' : '#374151',
                          borderBottom: isDarkMode
                            ? '1px solid #334155'
                            : '1px solid #E5E7EB',
                        }}
                      >
                        {doc.documentType}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Contact Details Section */}
      {contactData.length > 0 && (
        <Card
          sx={{
            boxShadow: 'none',
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            width: '100%',
            margin: '0 auto',
            mb: 3,
            border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
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
                  color: isDarkMode ? '#F9FAFB' : '#1E2939',
                }}
              >
                {getBuildPartnerLabelDynamic('CDL_AR_CONTACT')}
              </Typography>
              {!isReadOnly && (
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => {
                    onEditStep?.(2)
                  }}
                  sx={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: isDarkMode ? '#93C5FD' : '#6B7280',
                    borderColor: isDarkMode ? '#334155' : '#D1D5DB',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: isDarkMode ? '#475569' : '#9CA3AF',
                      backgroundColor: isDarkMode
                        ? 'rgba(51, 65, 85, 0.3)'
                        : '#F9FAFB',
                    },
                  }}
                >
                  Edit
                </Button>
              )}
            </Box>
            <Divider
              sx={{
                mb: 3,
                borderColor: isDarkMode ? '#334155' : '#E5E7EB',
              }}
            />
            <Grid container spacing={3}>
              {contactData.map((contact, index) => (
                <Grid size={{ xs: 12 }} key={index}>
                  {renderContactFields(
                    contact,
                    `Contact ${index + 1}`,
                    index === contactData.length - 1
                  )}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default Step3
