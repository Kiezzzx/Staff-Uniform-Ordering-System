# Product Spec - Staff Uniform Ordering (v1)

## 1. What the system does
The system provides 3 core capabilities:
1. Import and transform CSV data (Staff, Store, Role, Uniform items) with built-in ETL logic (e.g., mapping external `EAN` to internal `SKU`, dynamically extracting sizes).
2. Allow a store manager to create uniform requests.
3. Track request status (REQUESTED -> DISPATCHED -> ARRIVED -> COLLECTED).

## 2. What the system does not do
1. No authentication/authorization.
2. No advanced analytics/reporting.
3. No multi-warehouse or external logistics integration.
4. No native mobile app (web only).

## 3. Primary use cases
1. Manager uploads a CSV and sees import results (valid/invalid rows, error reasons) without the system crashing on dirty data.
2. Manager selects staff + uniform items + quantities, guided by dynamic "Low Stock" indicators, and submits a request.
3. System validates quantity, stock, allowance, and cooldown rules atomically.
4. Manager views requests and updates status through the lifecycle.

## 4. Success criteria
1. Import handles invalid rows gracefully (e.g., negative stock, missing fields) and provides clear error summaries.
2. Request creation strictly enforces all core business rules and prevents race conditions.
3. Status can only move in the allowed sequential order.
4. UI is clean, modern, and foolproof for non-technical retail staff.