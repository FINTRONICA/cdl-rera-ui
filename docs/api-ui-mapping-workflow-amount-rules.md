# API → UI Mapping Documentation: Workflow Amount Rules

## Overview

This document describes the API response structure, mapping logic, and UI rendering flow for the Workflow Amount Rules feature. It serves as a reference for developers when debugging data display issues or updating the mapping logic.

## API Response Structure

### Sample API Response

```json
{
  "id": 9007199254740991,
  "currency": "USD",
  "minAmount": 0.1,
  "maxAmount": 0.1,
  "priority": 1073741824,
  "requiredMakers": 1073741824,
  "requiredCheckers": 1073741824,
  "workflowDefinitionDTO": "string" | { "id": 123, "name": "Workflow Name" } | 123,
  "workflowId": 9007199254740991,
  "amountRuleName": "string",
  "workflowAmountStageOverrideDTOS": [...],
  "enabled": true,
  "deleted": true,
  "active": true
}
```

### Key API Fields

| API Field | Type | Description | Notes |
|-----------|------|-------------|-------|
| `id` | number/string | Unique identifier | Required |
| `currency` | string | Currency code (e.g., "USD", "EUR") | Can be empty string or placeholder "string" |
| `minAmount` | number | Minimum amount threshold | Required |
| `maxAmount` | number | Maximum amount threshold | Can be null |
| `priority` | number | Rule priority | Required |
| `requiredMakers` | number | Number of required makers | Can be null |
| `requiredCheckers` | number | Number of required checkers | Can be null |
| `workflowDefinitionDTO` | string/object/number | Workflow definition reference | **Variable type** - see mapping logic |
| `workflowId` | number/string | Workflow ID | Used as fallback for workflow definition lookup |
| `amountRuleName` | string | Rule name | Optional |
| `enabled` | boolean | Whether rule is enabled | Used for status display |
| `active` | boolean | Whether rule is active | Alternative to `enabled` |

## Data Flow

### 1. API Service Layer
**File**: `src/services/api/workflowApi/workflowAmountRuleService.ts`

- **Endpoint**: `/workflow-amount-rule/find-all?deleted.equals=false&enabled.equals=true`
- **Method**: `getWorkflowAmountRules(page, size, filters)`
- **Returns**: `PaginatedResponse<WorkflowAmountRuleDTO>`

### 2. React Hook Layer
**File**: `src/hooks/workflow/useWorkflowAmountRules.ts`

- **Hook**: `useWorkflowAmountRules(page, size, filters)`
- **Returns**: React Query result with `data.content` array of `WorkflowAmountRuleDTO`

### 3. Mapping Function
**File**: `src/services/api/workflowApi/workflowAmountRuleService.ts`

- **Function**: `mapWorkflowAmountRuleToUI(apiData: WorkflowAmountRuleDTO)`
- **Returns**: `WorkflowAmountRuleUIData`
- **Purpose**: Transforms API response to UI-friendly format

### 4. Page Component
**File**: `src/app/admin/workflow/amount-rule/page.tsx`

- **Component**: `WorkflowAmountRulesPageImpl`
- **Process**:
  1. Fetches data via `useWorkflowAmountRules()`
  2. Maps each item using `mapWorkflowAmountRuleToUI()`
  3. Enriches with workflow definition names from `workflowDefinitionNameMap`
  4. Renders table rows

## Mapping Logic

### `mapWorkflowAmountRuleToUI()` Function

#### Currency Mapping
```typescript
// Handles placeholder values and empty strings
let currency = apiData.currency
if (currency && typeof currency === 'string') {
  currency = currency.trim()
  // Filter out placeholder "string" values
  if (currency.toLowerCase() === 'string' || currency === '') {
    currency = ''
  }
}
```

#### Workflow Definition DTO Mapping
**Critical**: `workflowDefinitionDTO` can be one of three types:

1. **String** (ID reference):
   ```typescript
   if (typeof workflowDefDTO === 'string') {
     workflowDefId = parseInt(workflowDefDTO, 10) || workflowDefDTO
     // Name will be empty - must be looked up separately
   }
   ```

2. **Number** (ID):
   ```typescript
   if (typeof workflowDefDTO === 'number') {
     workflowDefId = workflowDefDTO
     // Name will be empty - must be looked up separately
   }
   ```

3. **Object** (Full definition):
   ```typescript
   if (typeof workflowDefDTO === 'object' && workflowDefDTO !== null) {
     workflowDefName = workflowDefDTO.name || workflowDefDTO.workflowDefinitionName || ''
     workflowDefId = workflowDefDTO.id || workflowDefDTO.workflowId || 0
   }
   ```

#### Fallback Logic
```typescript
// Use workflowId if workflowDefinitionDTO didn't provide an ID
if (!workflowDefId && apiData.workflowId) {
  workflowDefId = apiData.workflowId
}
```

#### Enabled/Active Status
```typescript
// Check both enabled and active fields
const enabled = apiData.enabled ?? apiData.active ?? false
```

### Page Component Mapping

#### Workflow Definition Name Resolution
The page component uses a three-tier fallback:

1. **From mapped UI data**: `uiData.workflowDefinitionDTO?.name`
2. **From raw API response**: `item.workflowDefinitionDTO.name` (if object)
3. **From workflow definitions map**: `workflowDefinitionNameMap.get(workflowId)`

```typescript
const workflowDefinitionName = 
  row.workflowDefinitionName ||
  workflowDefinitionNameMap.get(String(row.workflowId)) ||
  workflowDefinitionNameMap.get(row.workflowId.toString()) ||
  displayValue(row.workflowId)
```

## UI Display

### Table Columns

| Column Key | Label Config ID | Display Logic |
|------------|----------------|---------------|
| `currency` | `CDL_WAR_CURRENCY` | `displayValue(row.currency)` |
| `minAmount` | `CDL_WAR_MIN_AMOUNT` | `displayValue(row.minAmount)` |
| `maxAmount` | `CDL_WAR_MAX_AMOUNT` | `displayValue(row.maxAmount)` |
| `priority` | `CDL_WAR_PRIORITY` | `displayValue(row.priority)` |
| `requiredMakers` | `CDL_WAR_REQUIRED_MAKERS` | `displayValue(row.requiredMakers)` |
| `requiredCheckers` | `CDL_WAR_REQUIRED_CHECKERS` | `displayValue(row.requiredCheckers)` |
| `workflowId` | `CDL_WAR_WORKFLOW_DEFINITION` | Name resolution with fallbacks |
| `status` | `CDL_WAR_ACTIVE` | "Active" or "Inactive" based on `enabled` |

### Display Value Function

**File**: `src/utils/nullHandling.ts`

The `displayValue()` function handles:
- `null`/`undefined` → `"-"`
- Empty strings → `"-"`
- Objects → `"-"` (with console warning in dev)
- Arrays → Join with commas or `"-"` if contains objects
- Primitives → String conversion

## Common Issues & Solutions

### Issue 1: Currency Shows "-" or "string"
**Cause**: API returns placeholder "string" value or empty string
**Solution**: Mapping function filters out "string" and treats empty as missing

### Issue 2: Workflow Definition Shows "-"
**Cause**: `workflowDefinitionDTO` is a string/number ID without name
**Solution**: 
1. Lookup name from `workflowDefinitionNameMap` using `workflowId`
2. Ensure `useFindAllWorkflowDefinitions()` is called to populate the map

### Issue 3: Numbers Show "-"
**Cause**: API returns `null` for optional numeric fields
**Solution**: Mapping function uses `?? 0` fallback, but `displayValue()` shows "-" for 0
**Fix**: Consider using `displayValue(value, '0')` for numeric fields

### Issue 4: All Fields Show "-"
**Cause**: API response structure changed or mapping function not called
**Solution**: 
1. Check browser console for API response logs (dev mode)
2. Verify `mapWorkflowAmountRuleToUI()` is being called
3. Check that `apiResponse.content` is not empty

## Manual Test Checklist

### Pre-Test Setup
- [ ] Ensure backend API is running and accessible
- [ ] Verify at least 2 workflow amount rules exist in database
- [ ] Ensure at least one workflow definition exists
- [ ] Clear browser cache/localStorage

### Test Case 1: Basic Data Display
1. Navigate to `/admin/workflow/amount-rule`
2. **Expected**: Table displays with columns: Currency, Min Amount, Max Amount, Priority, Required Makers, Required Checkers, Workflow Definition, Active, Actions
3. **Verify**: 
   - [ ] All columns have headers
   - [ ] At least one row is visible
   - [ ] Currency shows actual value (not "-" or "string")
   - [ ] Min/Max Amount show numbers (not "-")
   - [ ] Priority shows number (not "-")
   - [ ] Required Makers/Checkers show numbers (not "-")
   - [ ] Workflow Definition shows name or ID (not "-")
   - [ ] Active column shows "Active" or "Inactive" badge

### Test Case 2: Workflow Definition Name Resolution
1. Create a workflow amount rule with a workflow definition ID
2. Refresh the page
3. **Verify**:
   - [ ] Workflow Definition column shows the workflow definition name (not ID)
   - [ ] If name not available, shows ID (not "-")

### Test Case 3: Empty/Null Values
1. Create a workflow amount rule with:
   - Empty currency field
   - Null maxAmount
   - Null requiredMakers
2. **Verify**:
   - [ ] Currency shows "-" (not "string")
   - [ ] Max Amount shows "-" (not error)
   - [ ] Required Makers shows "-" (not error)

### Test Case 4: Search & Filter
1. Enter search term in any column filter
2. **Verify**:
   - [ ] Table filters correctly
   - [ ] Filtered results still display all fields correctly

### Test Case 5: Pagination
1. If more than 20 records exist, navigate to page 2
2. **Verify**:
   - [ ] Page 2 data displays correctly
   - [ ] All fields show proper values (not "-")

### Test Case 6: Edit Flow
1. Click "Edit" (eye icon) on a row
2. **Verify**:
   - [ ] Side panel opens
   - [ ] All form fields are populated with correct values
   - [ ] Currency field shows actual value (not "-")
   - [ ] Workflow Definition dropdown shows correct selection

### Test Case 7: Add New Flow
1. Click "Add New Amount Rule" button
2. Fill in all required fields
3. Submit
4. **Verify**:
   - [ ] New row appears in table
   - [ ] All fields display correctly
   - [ ] No "-" values for filled fields

## Debugging Steps

### Step 1: Check Network Tab
1. Open browser DevTools → Network tab
2. Filter by "workflow-amount-rule"
3. Find the API call
4. **Check**:
   - Response status is 200
   - Response body contains `content` array
   - Each item has expected fields

### Step 2: Check Console Logs
1. Open browser DevTools → Console tab
2. Look for logs (dev mode only):
   - `"Raw WorkflowAmountRule API Response:"`
   - `"Mapped WorkflowAmountRule UI Data:"`
3. **Verify**:
   - API response structure matches expected format
   - Mapped data has all fields populated

### Step 3: Check React DevTools
1. Install React DevTools extension
2. Inspect `WorkflowAmountRulesPageImpl` component
3. **Check**:
   - `apiResponse` state has data
   - `workflowAmountRulesData` has mapped items
   - `workflowDefinitionNameMap` is populated

### Step 4: Verify Mapping Function
1. Add breakpoint in `mapWorkflowAmountRuleToUI()`
2. Step through execution
3. **Verify**:
   - `workflowDefinitionDTO` type is handled correctly
   - All fields are extracted properly
   - Fallback values are applied

## Files Modified

1. **`src/services/api/workflowApi/workflowAmountRuleService.ts`**
   - Updated `WorkflowAmountRuleDTO` interface to support string/number/object for `workflowDefinitionDTO`
   - Enhanced `mapWorkflowAmountRuleToUI()` with better type handling and fallbacks

2. **`src/app/admin/workflow/amount-rule/page.tsx`**
   - Fixed column label bug (maxAmount using MIN_AMOUNT label)
   - Improved workflow definition name extraction logic
   - Enhanced fallback chain for workflow definition names

3. **`src/hooks/workflow/useWorkflowAmountRules.ts`**
   - Updated `convertToUIData()` to use centralized mapping function

## Future Improvements

1. **Type Safety**: Consider creating discriminated union types for `workflowDefinitionDTO`
2. **Caching**: Implement better caching strategy for workflow definition names
3. **Error Handling**: Add user-friendly error messages when workflow definition lookup fails
4. **Performance**: Memoize workflow definition name map lookups
5. **Testing**: Add unit tests for mapping function with various API response structures

## Related Files

- `src/constants/mappings/workflowMapping.js` - Label mappings
- `src/utils/nullHandling.ts` - Display value utilities
- `src/components/organisms/ExpandableDataTable` - Table component
- `src/components/organisms/RightSlidePanel/RightSlideWorkflowAmountRulePanel.tsx` - Edit panel

## Last Updated

2025-01-11 - Initial documentation created after API → UI mapping audit and fixes.
