# Hospital Accounts Management System — Backend API Documentation

## Authentication

### POST /api/auth/login
- **Description:** Login and receive JWT tokens (set as cookies)
- **Body:** `{ "username": "string", "password": "string" }`
- **Response:** `{ user: { id, username, name, role } }`

### POST /api/auth/refresh
- **Description:** Refresh access token using refresh token cookie
- **Response:** `{ user: { id, username, name, role } }`

### POST /api/auth/logout
- **Description:** Logout and clear tokens
- **Permissions:** Authenticated

### POST /api/auth/register
- **Description:** Register a new user (admin only)
- **Permissions:** `user:create`

---

## Users

### GET /api/users
- **Description:** List all users
- **Permissions:** `user:read`

### GET /api/users/:id
- **Description:** Get user by ID
- **Permissions:** `user:read`

### PUT /api/users/:id
- **Description:** Update user
- **Permissions:** `user:update`

### DELETE /api/users/:id
- **Description:** Delete user
- **Permissions:** `user:delete`

### POST /api/users/:id/password
- **Description:** Change user password
- **Permissions:** `user:update`

---

## Roles

### GET /api/roles
- **Description:** List all roles
- **Permissions:** `role:read`

### POST /api/roles
- **Description:** Create role
- **Permissions:** `role:create`

### PUT /api/roles/:id
- **Description:** Update role
- **Permissions:** `role:update`

### DELETE /api/roles/:id
- **Description:** Delete role
- **Permissions:** `role:delete`

---

## Products

### GET /api/products
- **Description:** List all products
- **Permissions:** `product:read`

### POST /api/products
- **Description:** Create product (with supplementary bundling)
- **Permissions:** `product:create`

### PUT /api/products/:id
- **Description:** Update product
- **Permissions:** `product:update`

### DELETE /api/products/:id
- **Description:** Delete product
- **Permissions:** `product:delete`

---

## Sales (POS)

### GET /api/sales
- **Description:** List all sales
- **Permissions:** `sale:read`

### POST /api/sales
- **Description:** Create sale (with discount, supplementary bundling)
- **Permissions:** `sale:create`

---

## Expenses

### GET /api/expenses
- **Description:** List all expenses
- **Permissions:** `expense:read`

### POST /api/expenses
- **Description:** Create expense
- **Permissions:** `expense:create`

---

## Expense Categories

### GET /api/expense-categories
- **Description:** List all expense categories
- **Permissions:** `expenseCategory:read`

### POST /api/expense-categories
- **Description:** Create expense category
- **Permissions:** `expenseCategory:create`

---

## Sales Agents

### GET /api/sales-agents
- **Description:** List all sales agents
- **Permissions:** `salesAgent:read`

### POST /api/sales-agents
- **Description:** Create sales agent
- **Permissions:** `salesAgent:create`

---

## Patients

### GET /api/patients
- **Description:** List all patients
- **Permissions:** `patient:read`

### POST /api/patients
- **Description:** Create patient
- **Permissions:** `patient:create`

---

## Audit Logs

### GET /api/audit-logs
- **Description:** List all audit logs
- **Permissions:** `auditLog:read`

### POST /api/audit-logs
- **Description:** Create audit log entry
- **Permissions:** `auditLog:create`

---

## Settings

### GET /api/settings
- **Description:** List all settings
- **Permissions:** `settings:read`

### POST /api/settings
- **Description:** Create setting
- **Permissions:** `settings:create`

---

## Reports

### GET /api/reports/sales?start=YYYY-MM-DD&end=YYYY-MM-DD&category=string
- **Description:** Sales report (filterable)
- **Permissions:** `report:read`

### GET /api/reports/expenses?start=YYYY-MM-DD&end=YYYY-MM-DD&category=string
- **Description:** Expense report (filterable)
- **Permissions:** `report:read`

### GET /api/reports/agent-performance?start=YYYY-MM-DD&end=YYYY-MM-DD&agentId=number
- **Description:** Agent performance report
- **Permissions:** `report:read`

---

## Backup/Restore

### GET /api/backup
- **Description:** Download encrypted backup
- **Permissions:** `backup:read`

### POST /api/backup/restore
- **Description:** Restore from encrypted backup
- **Permissions:** `backup:restore`

---

## Language

### GET /api/lang
- **Description:** List available languages
- **Permissions:** `lang:read`

### GET /api/lang/:lang
- **Description:** Get language map
- **Permissions:** `lang:read`

---

## Real-time (WebSocket)
- **URL:** `ws://<server>:3000`
- **Events:**
  - `sale:new` — `{ saleId }`
  - `expense:new` — `{ expenseId }`
- **Description:** Receive real-time updates for new sales and expenses

---

## Permissions Reference
- Each endpoint requires specific permissions (see above)
- Permissions are managed via roles in `/api/roles`

---

## Example: Authenticated Request
```
curl -X GET http://localhost:3000/api/users \
  --cookie "access_token=<your_token>"
```

---



## Error Handling
- All endpoints return JSON errors with `message` field
- 401/403 for unauthorized/forbidden
- 404 for not found
- 500 for server errors 