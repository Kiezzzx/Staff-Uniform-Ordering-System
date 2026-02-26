# API Spec - Staff Uniform Ordering (v1.1)

Base URL: /api

## 0. Global Response Envelope
To ensure consistency and ease of parsing for frontend clients, all responses follow a standard envelope structure:

- Success (2xx): Always wrapped in a "data" object.
- Error (4xx/5xx): Always wrapped in an "error" object.

## 1. GET /staff
List all staff with their remaining allowance calculated dynamically.

Success 200:

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Daniel Perry",
        "role": "MANAGER",
        "storeName": "Brunswick",
        "remainingAllowance": 5
      }
    ]
  }
}
```

## 2. GET /uniform-items
List catalog items with dynamic low stock indicators.

Success 200:

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "sku": "89098",
        "itemName": "Summer T-Shirt",
        "size": "XXL",
        "stockOnHand": 10,
        "isLowStock": false
      }
    ]
  }
}
```

## 3. POST /requests
Create a new uniform request.

Request Body:

```json
{
  "staffId": 1,
  "items": [
    { "uniformItemId": 1, "quantity": 1 }
  ]
}
```

Success 201:

```json
{
  "data": {
    "id": 1001,
    "staffId": 1,
    "status": "REQUESTED",
    "requestedAt": "2026-02-24T12:30:00.000Z"
  }
}
```

## 4. GET /requests
List requests (optional filters: status/staff/store).

Success 200:

```json
{
  "data": {
    "items": [
      {
        "id": 1001,
        "staffName": "Alex Chen",
        "storeName": "Store A",
        "status": "DISPATCHED",
        "requestedAt": "2026-02-24T12:30:00.000Z"
      }
    ]
  }
}
```

## 5. GET /requests/:id
Get single request details including requested items.

Success 200:

```json
{
  "data": {
    "id": 1001,
    "staffName": "Alex Chen",
    "storeName": "Store A",
    "status": "DISPATCHED",
    "requestedAt": "2026-02-24T12:30:00.000Z",
    "items": [
      {
        "uniformItemId": 1,
        "itemName": "Summer T-Shirt",
        "size": "XXL",
        "quantity": 1
      }
    ]
  }
}
```

## 6. PATCH /requests/:id/status
Update the status of a request.

Request Body:

```json
{
  "status": "ARRIVED"
}
```

Rule:
Only REQUESTED -> DISPATCHED -> ARRIVED -> COLLECTED is valid.

Success 200:

```json
{
  "data": {
    "id": 1001,
    "status": "ARRIVED"
  }
}
```

## 7. POST /imports
Upload and import CSV (Staff Details & SKU List).

Data Mapping Note: The system automatically maps external CSV headers like EAN to the internal sku field, and parses size from the Name string to maintain domain integrity.

Response 201:

```json
{
  "data": {
    "importJobId": 501
  }
}
```

## 8. GET /imports/:id
Get import summary.

Success 200:

```json
{
  "data": {
    "totalRows": 100,
    "validRows": 95,
    "invalidRows": 5,
    "errors": [
      { "rowNumber": 8, "message": "Invalid quantity" }
    ]
  }
}
```

## 9. Standard Error Format
All 4xx and 5xx errors strictly follow this JSON structure:

Response (e.g., 400, 404, 409):

```json
{
  "error": {
    "code": "ALLOWANCE_EXCEEDED",
    "message": "Staff member has exhausted their annual allowance."
  }
}
```

Standard Codes:

- VALIDATION_ERROR
- NOT_FOUND
- INSUFFICIENT_STOCK
- ALLOWANCE_EXCEEDED
- COOLDOWN_ACTIVE
- INVALID_STATUS_TRANSITION

## 10. Extension: Role Allowance Config (v1.2 Extension)
These endpoints are an extension to support runtime configuration of role-based allowance limits.

### 10.1 GET /staff/role-limits
List all configured role allowance limits.

Success 200:

```json
{
  "data": {
    "items": [
      {
        "role": "MANAGER",
        "annualLimit": 5
      },
      {
        "role": "CASUAL",
        "annualLimit": 2
      }
    ]
  }
}
```

### 10.2 PATCH /staff/role-limits/:roleName
Update one role's annual allowance limit.

Request Body:

```json
{
  "annualLimit": 6
}
```

Rules:
- `roleName` must exist in `roles`.
- `annualLimit` must be an integer >= 0.

Success 200:

```json
{
  "data": {
    "role": "MANAGER",
    "annualLimit": 6
  }
}
```
