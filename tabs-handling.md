# Tab Handling Architecture Documentation

## Overview

This document explains how tab-based data handling works in the activities pages (pending and involved). The system uses a reusable architecture that handles tab changes, API calls, payload mapping, and UI rendering dynamically based on the active tab.

## Problem Statement

### Original Issue

The original implementation had the following problems:

1. **Code Duplication**: Both `pending/page.tsx` and `involved/page.tsx` contained nearly identical logic (~90% similar code)
2. **Hardcoded Payload Mapping**: Both pages hardcoded extraction of `bpName`, `bpCifrera`, `bpLicenseNo` from `payloadJson`, which only works for `BUILD_PARTNER` module
3. **Same Data for All Tabs**: All tabs showed the same data because:
   - Payload mapping was hardcoded for BUILD_PARTNER structure
   - UI columns were static and didn't change based on active tab
   - No dynamic field extraction based on module type

### Example of the Problem

**BUILD_PARTNER payloadJson:**
```json
{
  "bpName": "A C A A CPAX PAWAWP YPRPXYPAPNW",
  "bpCifrera": "76786786",
  "bpLicenseNo": "7938939",
  "bpEmail": "testdemo@gmail.com"
}
```

**CAPITAL_PARTNER payloadJson:**
```json
{
  "investorFirstName": "John",
  "investorLastName": "Doe",
  "investorId": "INV-123",
  "nationality": "US",
  "email": "john@example.com"
}
```

The old code always tried to extract `bpName` and `bpCifrera`, which don't exist in CAPITAL_PARTNER payloads, resulting in all tabs showing "-" or incorrect data.

## Solution Architecture

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         Pages (pending/involved)        │
│  - Use useTabData hook                  │
│  - Use generateTableColumns utility     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         useTabData Hook                  │
│  - Tab state management                  │
│  - API calls (pending/involved)          │
│  - Payload mapping via service           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Services Layer                      │
│  - tabsService: Tab/module mapping       │
│  - payloadMapperService: Dynamic mapping │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      API Layer                           │
│  - workflowRequestService                │
│  - React Query hooks                     │
└──────────────────────────────────────────┘
```

### Component Structure (Atomic Design)

- **Atoms**: Basic UI components (Button, Input, Badge)
- **Molecules**: Composite components (TabNavigation, SearchBar)
- **Organisms**: Complex components (ExpandableDataTable, TablePageLayout)
- **Templates**: Page layouts (TablePageLayout)
- **Pages**: Application pages (pending, involved)

## Key Components

### 1. Tabs Service (`src/services/tabsService.ts`)

**Purpose**: Centralized tab configuration and module mapping.

**Key Functions**:
- `getModuleNameFromTabId(tabId)`: Maps tab ID to module name
- `getNavigationPath(tabId, id)`: Generates navigation path for entity view
- `TAB_TO_MODULE_MAP`: Maps tab IDs to module names

**Example**:
```typescript
import { getModuleNameFromTabId, getNavigationPath } from '@/services/tabsService'

const moduleName = getModuleNameFromTabId('buildPartner') // 'BUILD_PARTNER'
const path = getNavigationPath('capitalPartner', '123') // '/capital-partner/123?mode=view'
```

### 2. Payload Mapper Service (`src/services/payloadMapperService.ts`)

**Purpose**: Dynamically maps `payloadJson` to UI-friendly data based on module type.

**Key Functions**:
- `mapPayloadToUIData(payloadJson, moduleName)`: Maps payload to structured data
- `getPayloadDisplayName(payloadJson, moduleName)`: Gets display name for table
- `getPayloadIdentifier(payloadJson, moduleName)`: Gets identifier for table

**How It Works**:

Each module has a field mapping configuration:

```typescript
BUILD_PARTNER: {
  displayName: ['bpName', 'bpMasterName'],
  identifier: ['bpCifrera', 'bpDeveloperId'],
  status: ['taskStatusDTO', 'name'],
}

CAPITAL_PARTNER: {
  displayName: ['investorFirstName', 'investorLastName', 'investorMiddleName', 'arabicName'],
  identifier: ['investorId', 'idNumber'],
  status: ['status', 'investorType'],
}
```

The service tries each path in order until it finds a non-null value.

**Example**:
```typescript
import { mapPayloadToUIData } from '@/services/payloadMapperService'

const payload = {
  investorFirstName: "John",
  investorLastName: "Doe",
  investorId: "INV-123"
}

const mapped = mapPayloadToUIData(payload, 'CAPITAL_PARTNER')
// Result: {
//   displayName: "John Doe",
//   identifier: "INV-123"
// }
```

### 3. useTabData Hook (`src/hooks/useTabData.ts`)

**Purpose**: Reusable hook that handles all tab-related logic for both pending and involved pages.

**Features**:
- Tab state management
- API calls based on page type (pending/involved)
- Automatic payload mapping based on active tab
- Pagination support
- Loading and error states

**Usage**:
```typescript
const {
  activeTab,
  handleTabChange,
  workflowData,
  isLoading,
  error,
  refetch,
  getNavigationPath,
  hasNoData,
} = useTabData({
  pageType: 'pending', // or 'involved'
  initialTab: 'buildPartner',
  pageSize: 20,
})
```

**What It Does**:
1. Manages `activeTab` state
2. Converts tab ID to module name
3. Calls appropriate API hook (`useAwaitingActionsUIData` or `useEngagementsActionsUIData`)
4. Maps each item's `payloadJson` based on module type
5. Returns transformed data with `displayName`, `identifier`, `status` fields

### 4. Table Column Configuration (`src/utils/tableColumnConfig.ts`)

**Purpose**: Generates dynamic table columns based on active tab and page type.

**Key Functions**:
- `generateTableColumns(tabId, pageType, getLabel)`: Generates columns for table
- `getSearchFields(tabId, pageType)`: Returns searchable fields

**How It Works**:

Columns are built from:
1. **Base columns**: Common across all tabs (moduleName, stageKey)
2. **Module-specific columns**: Based on tab ID (displayName, identifier)
3. **Common columns**: Amount, currency
4. **Page-specific columns**: myRemarks (for involved page)
5. **Footer columns**: createdAt, status, actions

**Example**:
```typescript
import { generateTableColumns } from '@/utils/tableColumnConfig'

const columns = generateTableColumns('capitalPartner', 'pending', getLabel)
// Returns columns with "Investor Name" and "Investor ID" instead of "BP Name" and "CIFRERA"
```

## Data Flow

### Tab Click → API Call → UI Update

```
1. User clicks tab
   ↓
2. handleTabChange(tabId) called
   ↓
3. useTabData hook updates activeTab state
   ↓
4. Module name derived from tab ID
   ↓
5. API hook called with moduleName filter
   ↓
6. API returns data filtered by module
   ↓
7. Each item's payloadJson mapped based on module type
   ↓
8. Table columns regenerated based on active tab
   ↓
9. UI updates with tab-specific data and columns
```

### Payload Mapping Flow

```
API Response Item
  ↓
payloadJson extracted
  ↓
Module name determined from activeTab
  ↓
payloadMapperService.mapPayloadToUIData()
  ↓
Field paths tried in order (e.g., ['bpName', 'bpMasterName'])
  ↓
First non-null value used
  ↓
Mapped data added to item (displayName, identifier, status)
  ↓
Item ready for table display
```

## Usage Examples

### Pending Activities Page

```typescript
import { useTabData } from '@/hooks/useTabData'
import { TABS } from '@/services/tabsService'
import { generateTableColumns, getSearchFields } from '@/utils/tableColumnConfig'

const PendingActivitiesPage = () => {
  const {
    activeTab,
    handleTabChange,
    workflowData,
    isLoading,
    error,
    refetch,
    getNavigationPath,
    hasNoData,
  } = useTabData({
    pageType: 'pending',
    initialTab: 'buildPartner',
    pageSize: 20,
  })

  const tableColumns = useMemo(
    () => generateTableColumns(activeTab, 'pending', getLabel),
    [activeTab, getLabel]
  )

  // ... rest of component
}
```

### Involved Activities Page

```typescript
const InvolvedActivitiesPage = () => {
  const {
    activeTab,
    handleTabChange,
    workflowData,
    isLoading,
    error,
    refetch,
    getNavigationPath,
    hasNoData,
  } = useTabData({
    pageType: 'involved',
    initialTab: 'buildPartner',
    pageSize: 20,
  })

  const tableColumns = useMemo(
    () => generateTableColumns(activeTab, 'involved', getLabel),
    [activeTab, getLabel]
  )

  // ... rest of component
}
```

## Module-Specific Field Mappings

### BUILD_PARTNER

**Payload Fields**:
- `bpName`, `bpMasterName` → `displayName`
- `bpCifrera`, `bpDeveloperId` → `identifier`
- `taskStatusDTO.name` → `status`

**Table Columns**:
- Display Name: "Build Partner Name"
- Identifier: "CIFRERA No"

### CAPITAL_PARTNER

**Payload Fields**:
- `investorFirstName`, `investorLastName`, `investorMiddleName`, `arabicName` → `displayName`
- `investorId`, `idNumber` → `identifier`
- `status`, `investorType` → `status`

**Table Columns**:
- Display Name: "Investor Name"
- Identifier: "Investor ID"

### BUILD_PARTNER_ASSET

**Payload Fields**:
- `projectName`, `name`, `assetName` → `displayName`
- `projectId`, `assetId`, `id` → `identifier`

**Table Columns**:
- Display Name: "Project Name"
- Identifier: "Project ID"

### PAYMENTS

**Payload Fields**:
- `transactionId`, `referenceId`, `id` → `displayName`
- `transactionNumber`, `referenceNumber` → `identifier`

**Table Columns**:
- Display Name: "Transaction ID"
- Identifier: "Reference"

### SURETY_BOND

**Payload Fields**:
- `bondName`, `guaranteeName`, `name` → `displayName`
- `bondNumber`, `guaranteeNumber`, `referenceId` → `identifier`

**Table Columns**:
- Display Name: "Bond Name"
- Identifier: "Bond Number"

## Extending the System

### Adding a New Tab

1. **Update `tabsService.ts`**:
```typescript
export const TABS: Tab[] = [
  // ... existing tabs
  { id: 'newModule', label: 'New Module' },
]

export const TAB_TO_MODULE_MAP: Record<TabId, ModuleName> = {
  // ... existing mappings
  newModule: 'NEW_MODULE',
}
```

2. **Add Navigation Path**:
```typescript
export function getNavigationPath(tabId: TabId, id: string | number): string {
  const navigationMap: Record<TabId, (id: string | number) => string> = {
    // ... existing paths
    newModule: (id) => `/new-module/${id}?mode=view`,
  }
  // ...
}
```

3. **Add Payload Mapping**:
```typescript
const PAYLOAD_FIELD_MAPPINGS: Record<ModuleName, PayloadFieldMapping> = {
  // ... existing mappings
  NEW_MODULE: {
    displayName: ['name', 'title'],
    identifier: ['id', 'code'],
    status: ['status'],
  },
}
```

4. **Add Table Columns**:
```typescript
function getModuleSpecificColumns(
  tabId: TabId,
  getLabel: GetLabelFunction,
  pageType: ActivityPageType
): TableColumn[] {
  switch (tabId) {
    // ... existing cases
    case 'newModule':
      columns.push(
        {
          key: 'displayName',
          label: 'Module Name',
          // ...
        }
      )
      break
  }
}
```

## Performance Considerations

1. **Memoization**: 
   - `workflowData` is memoized based on `workflowResponse` and `moduleName`
   - `tableColumns` are memoized based on `activeTab` and `getLabel`
   - `workflowFilters` are memoized based on `moduleName`

2. **API Calls**:
   - Only one API call per tab (React Query handles caching)
   - Filters prevent unnecessary data fetching
   - Pagination resets on tab change to avoid stale data

3. **State Management**:
   - Tab state is local to the hook
   - No global state pollution
   - Clean state reset on tab change

## Testing Considerations

### Unit Tests

1. **Tabs Service**:
   - Test `getModuleNameFromTabId` with all tab IDs
   - Test `getNavigationPath` with all tab IDs and various IDs
   - Test edge cases (invalid tab IDs)

2. **Payload Mapper Service**:
   - Test mapping for each module type
   - Test with missing fields (should return "-")
   - Test with nested objects (e.g., `taskStatusDTO.name`)
   - Test with null/undefined payloads

3. **useTabData Hook**:
   - Test tab state management
   - Test API call triggering on tab change
   - Test payload mapping integration
   - Test pagination reset on tab change

### Integration Tests

1. Test tab switching in pending page
2. Test tab switching in involved page
3. Verify correct data displayed for each tab
4. Verify correct columns displayed for each tab
5. Test navigation paths for each tab

## Troubleshooting

### Issue: All tabs show same data

**Possible Causes**:
1. API not filtering by moduleName correctly
2. Payload mapping not working
3. Table columns not updating

**Solutions**:
1. Check `workflowFilters` in hook - should contain `moduleName`
2. Check API response - verify it's filtered correctly
3. Check payload mapping - verify correct module name passed
4. Check table columns - verify they regenerate on tab change

### Issue: Wrong fields displayed

**Possible Causes**:
1. Payload mapping configuration incorrect
2. Field paths in mapping don't match actual payload structure

**Solutions**:
1. Check `PAYLOAD_FIELD_MAPPINGS` in `payloadMapperService.ts`
2. Verify actual payload structure from API
3. Update field paths to match actual structure

### Issue: Navigation not working

**Possible Causes**:
1. Navigation path not configured for tab
2. ID not available in row data

**Solutions**:
1. Check `getNavigationPath` in `tabsService.ts`
2. Verify row has `id` field
3. Check navigation path format

## Summary

The new architecture provides:

✅ **Reusable Logic**: Single hook and services used by both pages
✅ **Dynamic Mapping**: Payload fields extracted based on module type
✅ **Dynamic Columns**: Table columns change based on active tab
✅ **Type Safety**: Full TypeScript support
✅ **Maintainability**: Easy to extend with new tabs/modules
✅ **Performance**: Memoization and efficient state management
✅ **Consistency**: Same behavior across pending and involved pages

The system now correctly handles different payload structures for each module type, ensuring that each tab displays the appropriate data and columns.

