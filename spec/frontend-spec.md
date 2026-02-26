# UI/UX Spec - Staff Uniform Ordering Frontend (v1.0)

## 1. Purpose
Build a clean, simple web interface for store managers/staff to:
1. Import CSV data
2. Create uniform requests
3. Track and update request status
4. Check staff allowance and item stock context

No authentication in v1.

## 2. UX Principles
1. Clean, simple, modern layout
2. Easy for mixed technical skill levels
3. Clear validation and error messages
4. Fast task completion with minimal steps
5. Consistent UI patterns across screens

## 3. Information Architecture
Top navigation:
1. Create Request
2. Requests
3. Import Data
4. Staff
5. Uniform Items

## 4. Screen Specifications

### 4.1 Import Data
Goal: upload CSV and review import results safely.

UI:
1. Upload area (drag/drop + file picker)
2. Primary action: `Import CSV`
3. Summary panel:
   - totalRows
   - validRows
   - invalidRows
4. Error table:
   - rowNumber
   - message

Behavior:
1. Accept `.csv` only
2. Disable button while uploading
3. Show loading/progress state
4. Show success summary and row-level errors
5. On backend error, show message from `error.message`

### 4.2 Create Request
Goal: create valid requests with clear guidance.

Form:
1. Staff member selector
2. Repeating item rows:
   - uniform item selector (`Name (Size) - SKU`)
   - quantity input
3. Add/remove row controls
4. Primary action: `Create Request`

Live context:
1. Remaining allowance for selected staff
2. Current stock for selected item
3. Low-stock indicator when `isLowStock = true`
4. Cart summary (total requested)

Validation:
1. Quantity must be positive integer
2. Required fields enforced
3. Disable submit for clearly invalid state
4. Preserve form values on failed submit
5. Frontend validation improves UX. Backend remains the source of truth for business rule enforcement.

### 4.3 Requests List
Goal: quickly locate and review requests.

Table columns:
1. ID
2. Staff Name
3. Store Name
4. Status
5. Requested At
6. Action (`View`)

Filters:
1. status
2. staffId
3. storeId

Behavior:
1. Default sort: newest first
2. Empty state for no results

### 4.4 Request Detail
Goal: inspect a request and advance status safely.

Header:
1. id
2. staffName
3. storeName
4. status
5. requestedAt

Items:
1. uniformItemId
2. itemName
3. size
4. quantity

Status action:
1. Show only next valid status action
2. Hide actions when status is `COLLECTED`
3. Show backend rejection message when transition fails

Valid transitions:
REQUESTED → DISPATCHED → ARRIVED → COLLECTED

### 4.5 Staff
Goal: planning reference.

Table columns:
1. id
2. name
3. role
4. storeName
5. remainingAllowance

### 4.6 Uniform Items
Goal: stock reference.

Table columns:
1. id
2. sku
3. itemName
4. size
5. stockOnHand
6. isLowStock badge

Behavior:
1. Search by name or SKU
2. Highlight low-stock rows subtly

## 5. Interaction & Feedback Standards
1. Loading indicators on async actions
2. Disable invalid/incomplete submissions
3. Global error handling from backend envelope:
   - `{ error: { code, message } }`
4. No silent failures
5. After successful mutations, relevant list/detail data should refresh.

## 6. Validation Message Standards
Style: short, direct, actionable.

Examples:
1. `Please select a staff member.`
2. `Quantity must be a positive whole number.`
3. `Requested quantity exceeds available stock.`
4. `Request exceeds remaining allowance.`
5. `Cooldown is still active for this item.`

## 7. Accessibility
1. Proper labels for all controls
2. Keyboard-accessible forms/tables
3. Clear focus states
4. Sufficient color contrast
5. Errors shown near related fields

## 8. Visual Style
1. Light neutral base
2. Clean spacing and typography
3. Status colors:
   - REQUESTED: gray
   - DISPATCHED: blue
   - ARRIVED: amber
   - COLLECTED: green

## 9. Out of Scope (v1.0)
1. Authentication/authorization
2. Editing dispatched requests
3. Advanced analytics/reporting
4. Multi-language support
