# Authentication API with Email Verification & Password Reset

This backend service handles user registration, email verification, JWT-based login, and password resets. Building on the base boilerplate and MySQL setup, it adds real account verification through Nodemailer and time-bound, single-use tokens so users actually own the email addresses they register with and can recover access safely if they forget their password.

## Features

- **Account Registration with Verification:** Creates a new user with `isVerified` set to `false` by default, generates a verification token, and emails a verification link.
- **Login Guardrails:** Blocks sign-in attempts if the account hasn't verified its email yet, if the account is inactive, or if the credentials don't match.
- **Email Verification & Resend:** Validates the verification token, marks the account as verified, clears the token, and lets users request a fresh verification email when needed.
- **Forgot & Reset Password:** Sends a password reset link when requested while returning a generic success response to avoid leaking whether an account exists, then updates the password hash and invalidates the reset token once used.
- **JWT Protected Routes:** Issues signed tokens on login and protects endpoints like `/api/auth/me`.

---

## Authentication Flows

### 1. Registration & Email Verification Flow
1. A client sends `POST /api/auth/register` with `name`, `email`, `password`, and optional `age`.
2. The service checks for duplicate emails (`409 Conflict` if already taken), hashes the password with `bcrypt`, and generates a random verification token along with an expiration timestamp.
3. The user record is saved with `isVerified = false`, and `EmailService` sends a verification email containing `http://localhost:4200/verify-email?token=<token>`.
4. Until the user verifies their email, `POST /api/auth/login` rejects the login with `401 Unauthorized`.
5. When the client calls `GET /api/auth/verify-email?token=<token>`, the server checks that the token is valid and unexpired, sets `isVerified = true`, clears the verification token and expiry fields, and returns a success message.
6. If the user never got or lost the email, `POST /api/auth/resend-verification` generates a fresh token and sends another email.

### 2. Login & Protected Access Flow
1. Once verified, the user calls `POST /api/auth/login` with `email` and `password`.
2. The server verifies the account is verified and active, checks the password against the stored `bcrypt` hash, and signs a JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`).
3. The client includes `Authorization: Bearer <token>` on protected requests such as `GET /api/auth/me`.

### 3. Forgot & Reset Password Flow
1. A user calls `POST /api/auth/forgot-password` with their `email`.
2. If the email exists, the server generates a short-lived reset token and expiry, saves it, and sends a reset link (`http://localhost:4200/reset-password?token=<token>`). Either way, the API returns a standard success response.
3. The user submits `POST /api/auth/reset-password` with `token` and `newPassword`.
4. If the token is valid and not expired, the server hashes `newPassword`, updates the user's password, clears the reset token and expiry, and confirms the reset.

---

## Setup & Testing with Ethereal Email

### Environment Variables (`.env`)
Make sure your `.env` includes your database settings, a strong `JWT_SECRET` (at least 32 characters), and your SMTP details:

```env
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=midterm_shaun
DB_PASSWORD=admin123
DB_DATABASE=boilerplate_db
FRONTEND_URL=http://localhost:4200
JWT_SECRET=your-32-character-or-longer-secret-key
JWT_EXPIRES_IN=24h
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user
SMTP_PASS=your_ethereal_pass
EMAIL_FROM=noreply@yourapp.com
```

### Viewing Sent Emails in Ethereal
1. Start the API server (`npm run dev`) and confirm both the database and email service initialize cleanly.
2. Trigger `POST /api/auth/register` or `POST /api/auth/forgot-password` in EchoAPI or Postman.
3. Check the terminal logs where `npm run dev` is running for the Ethereal preview URL (`https://ethereal.email/message/...`).
4. Open that URL in your browser to inspect the rendered HTML/plain-text email and copy the `token` value from the link (joining any wrapped characters at the end without spaces or line breaks).

---

## API Endpoints & Examples

> Note: Replace `:3002` with whatever `PORT` you configured in `.env`.

### `POST /api/auth/register`
Registers a new account and sends a verification email.


{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "age": 21
}
```

### `GET /api/auth/verify-email?token=<token>`
Verifies a user's email address using the token from the verification email.

- **Example:** `GET http://localhost:3002/api/auth/verify-email?token=31ef625fe78f1f7d260f1b1c19ffe5e21bbb60330b76fb49184e4262be62c7b7`
- **Success (`200`):** `{"success": true, "message": "Email verified successfully. You can now log in."}`

### `POST /api/auth/resend-verification`
Sends a new verification email if the account is still unverified.


{
  "email": "john.doe@example.com"
}
```

### `POST /api/auth/login`
Authenticates a verified user and returns a JWT token.


{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

### `GET /api/auth/me`
Returns the current authenticated user's profile.

- **Header:** `Authorization: Bearer <jwt_token>`

### `POST /api/auth/forgot-password`
Initiates the password reset email flow.


{
  "email": "john.doe@example.com"
}
```

### `POST /api/auth/reset-password`
Resets the user's password using a valid reset token.


{
  "token": "2b1350baa9a51636958d03489317cd8889ceb0444ba642e9e749b8e9cd51f8e7",
  "newPassword": "NewPassword456"
}
```

---

## Security Features Implemented

- **Cryptographically Secure Tokens:** Generated with `crypto.randomBytes(32)` rather than predictable random or timestamp functions.
- **One-Time Use & Expiration:** Verification and reset tokens expire after a set window and are cleared once consumed so replaying an old link fails.
- **Password Hashing:** Passwords are never stored in plain text and are hashed with `bcrypt`.
- **Anti-Enumeration Responses:** Forgot-password responses stay consistent regardless of whether an email exists in the database.
- **Environment Validation:** Startup configuration is validated with `Joi` so missing or weak settings fail fast.

---

## Reflection Questions

### 1. Why is email verification important for security? What problems does it prevent?
Email verification confirms that the person signing up actually controls the inbox they entered. Without it, attackers can register accounts using someone else's email address—either to spam that person's inbox, tie unwanted accounts to their identity, or set up confusion around password resets later. It also cuts down on bot sign-ups and fake accounts made with random or mistyped addresses, giving you a cleaner user base and a reliable channel for critical account notices.

### 2. Explain the "always return success" pattern in forgot password. Why is it a security best practice?
The "always return success" pattern means `POST /api/auth/forgot-password` responds with a generic success message whether the email address is in the database or not. If the endpoint returned `404 Not Found` for unknown emails and `200 OK` for existing ones, anyone could test a list of emails and find out which ones have accounts on your platform. Returning the same message either way hides that information while still sending the reset email behind the scenes when a matching user exists.

### 3. What's the difference between a verification token and a reset token? Why do they have different expiration times?
A verification token proves ownership of an email address when confirming a new account, while a reset token authorizes changing the password on an existing account. Reset tokens carry higher immediate risk because anyone with a valid reset token—if intercepted—can take over the account by setting a new password, so they are given a short expiration window (such as 1 hour). Verification tokens are lower risk for account takeover on their own, so giving users a longer window (such as 24 hours) is practical when they might not check their email right away.

### 4. Why do we use `crypto.randomBytes(32)` instead of `Math.random()` or `Date.now()` for token generation?
`Math.random()` is not cryptographically secure—its output can be predicted if an attacker observes enough values—and `Date.now()` is based on the current time, which is easy to guess within a narrow window. `crypto.randomBytes(32)` pulls from the operating system's cryptographic random number generator to produce 256 bits of high-entropy data, making tokens practically impossible to guess or brute-force.

### 5. What happens if a user never verifies their email? How does your system handle this?
In this system, an unverified user has `isVerified` set to `false`, so `AuthService.login()` blocks them from logging in and returns a `401 Unauthorized` response asking them to verify their email first. If they missed the original email or their token expired, they can call `/api/auth/resend-verification` to get a new link. In a full production app, you might also periodically clean up stale unverified accounts or remind users before sending non-essential notifications.

### 6. Explain why tokens are cleared after use. What security risk does this prevent?
Clearing the token (and its expiration field) in the database as soon as it is used makes it strictly single-use. If a token stayed stored and valid after being redeemed, anyone who found that link later in browser history, logs, or a forwarded email could replay it—for instance, resetting a user's password a second time without their knowledge.

### 7. What is email enumeration and how does your implementation prevent it?
Email enumeration is when an attacker probes endpoints like login, registration, or forgot-password to figure out whether a specific email is registered in the system. Our forgot-password flow prevents this by returning a uniform success response regardless of whether the email exists in `users`, and login errors use clear, non-revealing messaging where appropriate rather than exposing internal lookup details.

### 8. If you had to implement two-factor authentication (2FA) on top of this system, how would you approach it?
I would add 2FA right after primary credential checks (`email` + `password`) during login, before issuing the final session/access JWT:
- Add fields on `User` such as `twoFactorEnabled` (`boolean`), `twoFactorSecret` (stored encrypted at rest), and hashed backup recovery codes.
- Support TOTP authenticator apps (like Google Authenticator or Authy) by generating a secret/QR URI during setup and verifying a 6-digit time-based code.
- During `POST /api/auth/login`, if `twoFactorEnabled` is true, return a short-lived pending/challenge token (or require a `twoFactorCode` step) instead of full access, and only issue the full JWT once the second factor passes.

### 9. What are the trade-offs between using Ethereal (test service) vs. SendGrid (production service)?
Ethereal is great for local development and testing because it's free, requires zero risk of emailing real people, and gives you an instant web preview to inspect links and templates—but messages aren't delivered to real external inboxes and aren't meant for production traffic. SendGrid (or another transactional email provider) is built for real-world delivery with dedicated infrastructure, deliverability monitoring, analytics, and higher sending capacity, though it requires account setup, domain authentication, API key management, and paid tiers as volume grows.

### 10. How would you handle a situation where a user's email provider marks your emails as spam?
First, I'd check email authentication records on the sending domain—**SPF**, **DKIM**, and **DMARC**—since missing or misconfigured records are a top reason legitimate mail lands in spam. Next, I'd review the email content and sending behavior (clear "From" address matching the domain, helpful plain-text fallback alongside HTML, no spammy wording or link shorteners, and low bounce/complaint rates). Finally, I'd guide users in the UI/email to check their Spam/Junk folder, add the sender address to their contacts, and use the resend option if needed.