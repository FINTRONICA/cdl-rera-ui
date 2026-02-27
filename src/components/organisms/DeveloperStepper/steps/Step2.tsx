'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Box, Card, CardContent, Button, useTheme, CircularProgress, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ContactData } from '../developerTypes'
import { RightSlideContactDetailsPanel } from '../../RightSlidePanel/RightSlideContactDetailsPanel'
import { ExpandableDataTable } from '../../ExpandableDataTable'
import { useTableState } from '@/hooks'
import { useDeleteConfirmation } from '@/store/confirmationDialogStore'
import {
  useDeleteBuildPartnerContact,
  useBuildPartnerContacts,
} from '@/hooks/useBuildPartners'
import { BuildPartnerContactResponse } from '@/services/api/buildPartnerService'
import { useBuildPartnerLabelsWithCache } from '@/hooks/useBuildPartnerLabelsWithCache'
import { getBuildPartnerLabel } from '@/constants/mappings/buildPartnerMapping'
import { useAppStore } from '@/store'
import {
  commonFieldStyles as sharedCommonFieldStyles,
  selectStyles as sharedSelectStyles,
  datePickerStyles as sharedDatePickerStyles,
  labelSx as sharedLabelSx,
  valueSx as sharedValueSx,
  calendarIconSx as sharedCalendarIconSx,
  cardStyles as sharedCardStyles,
  viewModeInputStyles,
  neutralBorder,
  neutralBorderHover,
} from '../styles'

interface Step2Props {
  contactData: ContactData[]
  onFeesChange: (contactData: ContactData[]) => void
  buildPartnerId?: string
  isReadOnly?: boolean
}

// const mapApiContactToContactData = (
//   apiContact: BuildPartnerContactResponse
// ): ContactData => {
//   return {
//     id: apiContact.id,
//     name: `${apiContact.bpcFirstName} ${apiContact.bpcLastName}`,
//     address:
//       apiContact.bpcContactAddressLine1 +
//       (apiContact.bpcContactAddressLine2
//         ? ` ${apiContact.bpcContactAddressLine2}`
//         : ''),
//     email: apiContact.bpcContactEmail,
//     pobox: apiContact.bpcContactPoBox,
//     countrycode: apiContact.bpcCountryMobCode,
//     mobileno: apiContact.bpcContactMobNo,
//     telephoneno: apiContact.bpcContactTelNo,
//     fax: apiContact.bpcContactFaxNo,
//     ...(apiContact.assetRegisterDTO && {
//       assetRegisterDTO: { id: apiContact.assetRegisterDTO.id },
//     }),
//   }
// }

const emptyDisplay = '-'

const mapApiContactToContactData = (
  apiContact: BuildPartnerContactResponse
): ContactData => {
  const firstName = apiContact.arcFirstName ?? apiContact.bpcFirstName ?? ''
  const lastName = apiContact.arcLastName ?? apiContact.bpcLastName ?? ''
  const address1 = apiContact.arcContactAddressLine1 ?? apiContact.bpcContactAddressLine1 ?? ''
  const address2 = apiContact.arcContactAddressLine2 ?? apiContact.bpcContactAddressLine2 ?? ''
  const email = apiContact.arcContactEmail ?? apiContact.bpcContactEmail ?? ''
  const name = `${firstName} ${lastName}`.trim()
  const address = `${address1} ${address2}`.trim()
  const pobox = apiContact.arcContactPoBox ?? apiContact.bpcContactPoBox ?? ''
  const countrycode = apiContact.arcCountryMobCode ?? apiContact.bpcCountryMobCode ?? ''
  const mobileno = apiContact.arcContactMobNo ?? apiContact.bpcContactMobNo ?? ''
  const telephoneno = apiContact.arcContactTelNo ?? apiContact.bpcContactTelNo ?? ''
  const fax = apiContact.arcContactFaxNo ?? apiContact.bpcContactFaxNo ?? ''
  return {
    id: apiContact.id,
    name: name || emptyDisplay,
    address: address || emptyDisplay,
    email: email || emptyDisplay,
    pobox: pobox || emptyDisplay,
    countrycode: countrycode || emptyDisplay,
    mobileno: mobileno || emptyDisplay,
    telephoneno: telephoneno || emptyDisplay,
    fax: fax || emptyDisplay,
    arcContactName: apiContact.arcContactName ?? null,
    arcFirstName: firstName ?? null,
    arcLastName: lastName ?? null,
    arcContactTelCode: apiContact.arcContactTelCode ?? null,
    arcContactTelNo: apiContact.arcContactTelNo ?? null,
    arcCountryMobCode: apiContact.arcCountryMobCode ?? null,
    arcContactMobNo: apiContact.arcContactMobNo ?? null,
    arcContactEmail: email ?? null,
    arcContactAddress: apiContact.arcContactAddress ?? null,
    arcContactAddressLine1: address1 ?? null,
    arcContactAddressLine2: address2 ?? null,
    arcContactPoBox: apiContact.arcContactPoBox ?? null,
    arcContactFaxNo: apiContact.arcContactFaxNo ?? null,
    enabled: apiContact.enabled ?? false,
    workflowStatus: apiContact.workflowStatus ?? null,
    deleted: apiContact.deleted ?? null,
    ...(apiContact.assetRegisterDTO && {
      assetRegisterDTO: { id: apiContact.assetRegisterDTO.id },
    }),
  } as ContactData
}

const Step2: React.FC<Step2Props> = ({
  contactData,
  onFeesChange,
  buildPartnerId,
  isReadOnly = false,
}) => {
  const theme = useTheme()
  const textPrimary = theme.palette.mode === 'dark' ? '#FFFFFF' : '#1E2939'
  const fieldStyles = React.useMemo(
    () => sharedCommonFieldStyles(theme),
    [theme]
  )
  const selectFieldStyles = React.useMemo(
    () => sharedSelectStyles(theme),
    [theme]
  )
  const dateFieldStyles = React.useMemo(
    () => sharedDatePickerStyles(theme),
    [theme]
  )
  const labelStyles = React.useMemo(() => sharedLabelSx(theme), [theme])
  const valueStyles = React.useMemo(() => sharedValueSx(theme), [theme])
  const cardBaseStyles = React.useMemo(
    () => (sharedCardStyles as any)(theme),
    [theme]
  )
  const viewModeStyles = viewModeInputStyles(theme)
  const neutralBorderColor = neutralBorder(theme)
  const neutralBorderHoverColor = neutralBorderHover(theme)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add')
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(
    null
  )
  const [selectedContactIndex, setSelectedContactIndex] = useState<
    number | null
  >(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [currentPageSize, setCurrentPageSize] = useState(20)

  const confirmDelete = useDeleteConfirmation()
  const deleteMutation = useDeleteBuildPartnerContact()

  const { data: buildPartnerLabels, getLabel } =
    useBuildPartnerLabelsWithCache()
  const currentLanguage = useAppStore((state) => state.language) || 'EN'

  const getAssetRegisterLabelDynamic = useCallback(
    (configId: string): string => {
      const fallback = getBuildPartnerLabel(configId)

      if (buildPartnerLabels) {
        return getLabel(configId, currentLanguage, fallback)
      }
      return fallback
    },
    [buildPartnerLabels, currentLanguage, getLabel]
  )

  const {
    data: apiContactsResponse,
    isLoading: contactsLoading,
    refetch: refetchContacts,
    updatePagination,
    apiPagination,
  } = useBuildPartnerContacts(buildPartnerId, currentPage, currentPageSize)

  const contacts: ContactData[] =
    apiContactsResponse?.content && apiContactsResponse.content.length > 0
      ? apiContactsResponse.content.map(mapApiContactToContactData)
      : contactData || []

  // Ensure every contact has table display fields (pobox, countrycode, etc.) and show '-' when empty
  const contactsForTable: ContactData[] = useMemo(
    () =>
      contacts.map((c) => {
        const name =
          c.name ?? `${(c.arcFirstName ?? '')} ${(c.arcLastName ?? '')}`.trim()
        const address =
          c.address ??
          [c.arcContactAddressLine1, c.arcContactAddressLine2]
            .filter(Boolean)
            .join(' ')
            .trim()
        const email = c.arcContactEmail ?? c.email ?? ''
        const pobox = c.arcContactPoBox ?? c.pobox ?? ''
        const countrycode = c.arcCountryMobCode ?? c.countrycode ?? ''
        const mobileno = c.arcContactMobNo ?? c.mobileno ?? ''
        const telephoneno = c.arcContactTelNo ?? c.telephoneno ?? ''
        const fax = c.arcContactFaxNo ?? c.fax ?? ''
        return {
          ...c,
          name: name || emptyDisplay,
          address: address || emptyDisplay,
          email: email || emptyDisplay,
          pobox: pobox || emptyDisplay,
          countrycode: countrycode || emptyDisplay,
          mobileno: mobileno || emptyDisplay,
          telephoneno: telephoneno || emptyDisplay,
          fax: fax || emptyDisplay,
        }
      }),
    [contacts]
  )

  // Sync form with API: hydrate when API has data, clear when API returns empty (e.g. after refresh or switch to another asset)
  useEffect(() => {
    if (!buildPartnerId || apiContactsResponse === undefined) return

    const content = apiContactsResponse?.content
    const hasContent = Array.isArray(content) && content.length > 0

    if (hasContent && (!contactData || contactData.length === 0)) {
      onFeesChange(content.map(mapApiContactToContactData))
    } else if (!hasContent && contactData && contactData.length > 0) {
      onFeesChange([])
    }
  }, [
    buildPartnerId,
    apiContactsResponse,
    contactData,
    onFeesChange,
  ])

  const addContact = () => {
    setEditMode('add')
    setSelectedContact(null)
    setSelectedContactIndex(null)
    setIsPanelOpen(true)
  }

  const handleContactAdded = (newContact: unknown) => {
    const updatedContacts = [...contacts, newContact as ContactData]
    onFeesChange(updatedContacts)

    if (buildPartnerId) {
      refetchContacts()
    }
  }

  const handleContactUpdated = (updatedContact: unknown, index: number) => {
    const updatedContacts = [...contacts]
    updatedContacts[index] = updatedContact as ContactData
    onFeesChange(updatedContacts)

    if (buildPartnerId) {
      refetchContacts()
    }
  }

  const handleEdit = (row: ContactData, index: number) => {
    setEditMode('edit')
    setSelectedContact(row)
    setSelectedContactIndex(index)
    setIsPanelOpen(true)
  }

  const handleDelete = (row: ContactData, index: number) => {
    confirmDelete({
      itemName: `contact: ${row.name}`,
      onConfirm: async () => {
        try {
          if (row.id) {
            await deleteMutation.mutateAsync(row.id)
          }

          const updatedContacts = contacts.filter((_, i) => i !== index)
          onFeesChange(updatedContacts)

          if (buildPartnerId) {
            refetchContacts()
          }
        } catch (error) {
          throw error
        }
      },
    })
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setEditMode('add')
    setSelectedContact(null)
    setSelectedContactIndex(null)
  }

  const tableColumns = [
    {
      key: 'name',
      label: getAssetRegisterLabelDynamic('CDL_AR_AUTH_NAME'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'address',
      label: getAssetRegisterLabelDynamic('CDL_AR_BUSINESS_ADDRESS'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'email',
      label: getAssetRegisterLabelDynamic('CDL_AR_EMAIL_ADDRESS'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'pobox',
      label: getAssetRegisterLabelDynamic('CDL_AR_POBOX'),
      type: 'text' as const,
      width: 'w-28',
      sortable: true,
    },
    {
      key: 'countrycode',
      label: getAssetRegisterLabelDynamic('CDL_AR_COUNTRY_CODE'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'mobileno',
      label: getAssetRegisterLabelDynamic('CDL_AR_MOBILE_NUMBER'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'telephoneno',
      label: getAssetRegisterLabelDynamic('CDL_AR_TELEPHONE_NUMBER'),
      type: 'text' as const,
      width: 'w-40',
      sortable: true,
    },
    {
      key: 'fax',
      label: getAssetRegisterLabelDynamic('CDL_AR_FAX_NUMBER'),
      type: 'text' as const,
      width: 'w-28',
      sortable: true,
    },
    ...(isReadOnly
      ? []
      : [
          {
            key: 'actions',
            label: 'Action',
            type: 'actions' as const,
            width: 'w-20',
          },
        ]),
  ]

  const totalRows = buildPartnerId
    ? apiPagination.totalElements
    : contacts.length
  const totalPages = buildPartnerId
    ? apiPagination.totalPages
    : Math.ceil(contacts.length / 20)

  const {
    search,
    paginated,
    startItem: localStartItem,
    endItem: localEndItem,
    page: localPage,
    rowsPerPage: localRowsPerPage,
    selectedRows,
    expandedRows,
    handleSearchChange,
    handlePageChange: handleLocalPageChange,
    handleRowsPerPageChange: handleLocalRowsPerPageChange,
    handleRowSelectionChange,
    handleRowExpansionChange,
  } = useTableState({
    data: contactsForTable,
    searchFields: [
      'name',
      'address',
      'email',
      'pobox',
      'countrycode',
      'mobileno',
      'telephoneno',
      'fax',
    ],
    initialRowsPerPage: 20,
  })

  // Filter contacts based on search state when buildPartnerId exists (client-side filtering)
  const filteredContacts = useMemo(() => {
    if (!buildPartnerId) return contactsForTable

    const hasSearchValues = Object.values(search).some(
      (val) => val.trim() !== ''
    )
    if (!hasSearchValues) return contactsForTable

    return contactsForTable.filter((contact) => {
      return [
        'name',
        'address',
        'email',
        'pobox',
        'countrycode',
        'mobileno',
        'telephoneno',
        'fax',
      ].every((field) => {
        const searchVal = search[field]?.trim() || ''
        if (!searchVal) return true

        const value = contact[field as keyof ContactData]
        const searchLower = searchVal.toLowerCase()
        const valueLower = String(value ?? '').toLowerCase()
        return valueLower.includes(searchLower)
      })
    })
  }, [contactsForTable, search, buildPartnerId])

  const page = buildPartnerId ? currentPage + 1 : localPage
  const rowsPerPage = buildPartnerId ? currentPageSize : localRowsPerPage

  const startItem = buildPartnerId
    ? currentPage * currentPageSize + 1
    : localStartItem
  const endItem = buildPartnerId
    ? Math.min((currentPage + 1) * currentPageSize, totalRows)
    : localEndItem

  const handlePageChange = (newPage: number) => {
    if (buildPartnerId) {
      const apiPage = newPage - 1
      setCurrentPage(apiPage)
      updatePagination(apiPage, currentPageSize)
    } else {
      handleLocalPageChange(newPage)
    }
  }

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    if (buildPartnerId) {
      setCurrentPage(0)
      setCurrentPageSize(newRowsPerPage)
      updatePagination(0, newRowsPerPage)
    } else {
      handleLocalRowsPerPageChange(newRowsPerPage)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card
        sx={{
          ...(cardBaseStyles as any),
          width: '94%',
          margin: '0 auto',
        }}
      >
        <CardContent sx={{ color: textPrimary }}>
          <Box display="flex" justifyContent="end" alignItems="center" mb={4}>
            {!isReadOnly && (
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineOutlinedIcon />}
                onClick={addContact}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  boxShadow: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '24px',
                  letterSpacing: '0.5px',
                  verticalAlign: 'middle',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? alpha('#FFFFFF', 0.3)
                      : theme.palette.primary.main,
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                Add Contact
              </Button>
            )}
          </Box>
          {buildPartnerId && contactsLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                gap: 2,
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Loading contacts…
              </Typography>
            </Box>
          ) : (
            <ExpandableDataTable<ContactData>
              data={buildPartnerId ? filteredContacts : paginated}
              columns={tableColumns}
              searchState={search}
              onSearchChange={handleSearchChange}
              paginationState={{
                page,
                rowsPerPage,
                totalRows,
                totalPages,
                startItem,
                endItem,
              }}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              selectedRows={selectedRows}
              onRowSelectionChange={handleRowSelectionChange}
              expandedRows={expandedRows}
              onRowExpansionChange={handleRowExpansionChange}
              {...(!isReadOnly && {
                onRowEdit: handleEdit,
                onRowDelete: handleDelete,
              })}
              showEditAction={!isReadOnly}
              showDeleteAction={!isReadOnly}
              showViewAction={false}
            />
          )}
        </CardContent>
      </Card>
      <RightSlideContactDetailsPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onContactAdded={handleContactAdded}
        onContactUpdated={handleContactUpdated}
        buildPartnerId={buildPartnerId}
        mode={editMode}
        {...(selectedContact && { contactData: selectedContact })}
        {...(selectedContactIndex !== null && {
          contactIndex: selectedContactIndex,
        })}
      />
    </LocalizationProvider>
  )
}

export default Step2