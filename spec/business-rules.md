# Business Rules Spec - Staff Uniform Ordering (v1)

## 1. Allowance
1. Calculated per role, per staff, per calendar year.
2. MANAGER: max 5 items per year.
3. CASUAL: max 2 items per year.
4. Formula:
   - used = sum of request item quantities in current year for statuses REQUESTED/DISPATCHED/ARRIVED/COLLECTED
   - remaining = limit - used
5. Reject if requested total quantity > remaining.

## 2. Cooldown
1. Scope: per staff + SKU + size.
2. Duration: 30 days.
3. Starts from latest REQUESTED timestamp for the same staff + SKU + size.
4. Reject if request is inside cooldown window.

## 3. Stock deduction timing
1. Deduct stock at request creation time (status REQUESTED).
2. Create request + deduct stock must be in one DB transaction.
3. If any line fails stock check, reject the whole request (no partial success).

## 4. Status transitions
1. Allowed statuses: REQUESTED, DISPATCHED, ARRIVED, COLLECTED.
2. Only allowed transitions:
   - REQUESTED -> DISPATCHED
   - DISPATCHED -> ARRIVED
   - ARRIVED -> COLLECTED
3. No skipping, no backward transitions.
4. COLLECTED is terminal.

## 5. Must-reject cases
1. Quantity is not a positive integer.
2. Staff does not exist.
3. Uniform item (SKU+size) does not exist.
4. Insufficient stock.
5. Allowance exceeded.
6. Cooldown active.
7. Invalid status transition.

## 6. UX / System Rules
1. **Low Stock Threshold**: Any uniform item with `stock_on_hand <= 5` is classified as "Low Stock". The backend must compute and expose this indicator (`isLowStock`) dynamically to guide store managers during request creation.

## 7. Data Import Rules
1. **Partial Success (Row-Level Validation)**: Unlike order creation (which is strictly all-or-nothing), CSV data imports process on a per-row basis. Invalid rows are skipped and logged into `import_row_errors`, while valid rows are successfully persisted.
2. **Idempotency & Inventory Sync**: Repeated imports must not create duplicate records. The system applies different resolution strategies based on the domain entity:
   - **Staff Records (Idempotency)**: Uses `INSERT OR IGNORE` based on the `UNIQUE(name, store_id)` constraint. This prevents duplicate staff creation while safely preserving their historical request data and accumulated allowance state.
   - **Uniform Items (Inventory Sync)**: Uses `UPSERT` (Update on conflict) based on the `UNIQUE(sku, size)` constraint. If an item already exists, its `stock_on_hand` is dynamically overwritten by the new CSV value. This deliberate design choice allows the import endpoint to double as a real-world inventory synchronization tool for store managers.