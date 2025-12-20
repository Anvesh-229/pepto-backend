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

