## Authentication & Authorization (Scaffolding)

Current state:
- Roles defined (CUSTOMER, STORE, ADMIN)
- Auth guard exists
- User context is mocked (DEV only)

Planned:
- JWT-based authentication
- Phone/OTP login
- Real user extraction from token

Rules:
- Stores cannot access admin APIs
- Customers cannot access store APIs
- Authorization is enforced via guards

Phase 2: 
3️⃣ Authentication & Roles

⏱️ 2 days

Customer

Store staff

Admin

JWT / token-based auth.

Similar to role-based security in CRM.


   Work done: # Authentication & Authorization

This module handles authentication and role-based access control.

## Roles
- CUSTOMER
- STORE
- ADMIN

## Authentication
- JWT-based
- Stateless
- Token contains user id and role

## Login
- Phone-based login
- OTP is mocked in DEV
- Real OTP will be added later

## Authorization
- Enforced via authGuard
- Role checks happen at API level
- Store users cannot access admin APIs

## Design Principles
- Backend-controlled access
- No trust on client
- Environment-driven secrets

