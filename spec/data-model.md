# Data Model Spec - Staff Uniform Ordering (v1)

## 1. Tables

### stores
- id (PK)
- name (TEXT, NOT NULL)

### roles
- id (PK)
- name (TEXT, NOT NULL, UNIQUE)  -- MANAGER / CASUAL

### staff
- id (PK)
- name (TEXT, NOT NULL)
- store_id (FK -> stores.id, NOT NULL)
- role_id (FK -> roles.id, NOT NULL)
- UNIQUE(name, store_id) -- Ensures idempotent imports: prevents creating duplicate staff members if the same CSV is uploaded multiple times.

### uniform_items
- id (PK)
- sku (TEXT, NOT NULL)
- size (TEXT, NOT NULL)
- item_name (TEXT, NOT NULL)
- stock_on_hand (INTEGER, NOT NULL, CHECK stock_on_hand >= 0)
- UNIQUE(sku, size) -- CRITICAL: Ensures items with the same EAN but different sizes are treated as distinct records, preventing UNIQUE constraint crashes during import.

### uniform_requests
- id (PK)
- staff_id (FK -> staff.id, NOT NULL)
- status (TEXT, NOT NULL, CHECK status IN ('REQUESTED','DISPATCHED','ARRIVED','COLLECTED'))
- requested_at (DATETIME, NOT NULL)
- dispatched_at (DATETIME, NULL)
- arrived_at (DATETIME, NULL)
- collected_at (DATETIME, NULL)

### uniform_request_items
- id (PK)
- request_id (FK -> uniform_requests.id, NOT NULL)
- uniform_item_id (FK -> uniform_items.id, NOT NULL)
- quantity (INTEGER, NOT NULL, CHECK quantity > 0)
- UNIQUE(request_id, uniform_item_id)

### import_jobs
- id (PK)
- file_name (TEXT, NOT NULL)
- total_rows (INTEGER, NOT NULL DEFAULT 0)
- valid_rows (INTEGER, NOT NULL DEFAULT 0)
- invalid_rows (INTEGER, NOT NULL DEFAULT 0)
- created_at (DATETIME, NOT NULL)

### import_row_errors
- id (PK)
- import_job_id (FK -> import_jobs.id, NOT NULL)
- row_number (INTEGER, NOT NULL)
- error_message (TEXT, NOT NULL)

## 2. Minimal index suggestions
- idx_staff_store on staff(store_id)
- idx_staff_role on staff(role_id)
- idx_req_staff on uniform_requests(staff_id)
- idx_req_status on uniform_requests(status)
