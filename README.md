# Group7Project_backend_express

## Admin Signup Secret
- Generate a secret for admin registration:
  - Command: `npm run secret:admin`
  - Copy the printed value and set it as `ADMIN_SIGNUP_SECRET` in your `.env`

- Register an admin via API (requires the secret):
  - POST `/api/v1/mongo/auth/register`
  - Body must include: `role: "admin"` and `adminSecret: "<your-secret>"`

- Notes
  - Login with the created admin, then use admin-only endpoints like products/colors management.
  - To revoke all sessions for a user, use `POST /api/v1/mongo/auth/logout-all`.
