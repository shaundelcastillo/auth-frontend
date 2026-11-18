# Express TypeScript Boilerplate with JWT Authentication

A modular, production-ready REST API built with Express, TypeScript, TypeORM, Joi, Winston, and bcrypt. This project features structured error handling, request validation, security middleware, and stateless JWT-based authentication to protect user management endpoints.

---

## Authentication Flow

1. **Registration (`POST /api/users`):** A new user submits their details. Input is validated via Joi, their password is hashed using `bcrypt`, and the account is saved to the database.
2. **Login (`POST /api/auth/login`):** The user provides their email and password. The server verifies the credentials against the stored hash and generates a signed JSON Web Token (JWT) containing the user's ID and email.
3. **Accessing Protected Routes:** The client includes the JWT in the `Authorization` header (`Bearer <token>`) on subsequent requests.
4. **Verification (`authMiddleware`):** Before reaching protected controllers, the middleware extracts the token, verifies its signature and expiration against `JWT_SECRET`, attaches the decoded user payload to `req.user`, and passes control forward—or rejects invalid/missing tokens with `401 Unauthorized`.

---

## How to Get a Token

Send a `POST` request to the login endpoint with valid user credentials:

**Endpoint:** `POST http://localhost:3000/api/auth/login`  
**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com"
    }
  }
}
```

---

## How to Use the Token

Include the token returned from `/api/auth/login` in the `Authorization` header using the `Bearer` scheme for any protected request:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## API Endpoints

### Public Endpoints (No Token Required)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Check server and database connection status |
| `POST` | `/api/users` | Register/create a new user account |
| `POST` | `/api/auth/login` | Authenticate user and receive a JWT token |

### Protected Endpoints (Bearer Token Required)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Retrieve the currently authenticated user's profile |
| `GET` | `/api/users` | Retrieve paginated list of all users |
| `GET` | `/api/users/:id` | Retrieve a single user by ID |
| `PUT` | `/api/users/:id` | Update an existing user's details |
| `DELETE` | `/api/users/:id` | Delete a user account |

---

## Reflection Questions

### 1. What is the difference between authentication and authorization? Give a real-world example of each.
Authentication is verifying *who* someone is, while authorization is checking *what* they are allowed to do once their identity is confirmed. In real life, showing your ID at the front desk of an office building to get a visitor badge is **authentication**. Using that badge at an elevator or door reader—where it lets you into the lobby and conference rooms, but blocks you from entering the server room—is **authorization**.

### 2. Why is JWT considered "stateless" and how does that benefit scalability?
A JWT is stateless because the server doesn't have to store active session records in memory or query a session table in the database on every request. Everything needed to identify the user is already inside the signed token itself. For scalability, this means you can run multiple backend server instances behind a load balancer without worrying about "sticky sessions" or syncing session storage across servers—any server with the same `JWT_SECRET` can immediately verify the token.

### 3. What are the three parts of a JWT token and what does each part do?
A JWT consists of three Base64Url-encoded strings separated by dots (`header.payload.signature`):
* **Header:** Identifies the token type (`JWT`) and the signing algorithm used (such as `HS256`).
* **Payload:** Contains the claims or data about the user—like `userId`, `email`, issued-at time (`iat`), and expiration (`exp`).
* **Signature:** A cryptographic hash generated using the encoded header, encoded payload, and the server's secret key. It ensures the token hasn't been tampered with in transit.

### 4. Why should you never put sensitive data (like passwords) in the JWT payload?
The JWT payload is only Base64Url-encoded, **not encrypted**. Anyone who gets their hands on the token can decode the payload in seconds using any online decoder or simple JavaScript function. Putting passwords, credit card numbers, or private personal info inside the payload exposes that data in plain text.

### 5. How does bcrypt protect user passwords? What is the purpose of the "salt" and "rounds"?
`bcrypt` turns plain-text passwords into irreversible cryptographic hashes so actual passwords are never stored in the database. 
* **Salt:** A random string added to each password before hashing. This guarantees that even if two users pick the exact same password (`Password123`), their resulting hashes look completely different, defeating precomputed rainbow table attacks.
* **Rounds (Cost Factor):** Controls how computationally expensive and slow the hashing process is. Increasing the rounds makes brute-force guessing drastically slower for attackers while remaining fast enough for a single normal login.

### 6. What happens if someone steals a JWT token? How can you mitigate this risk?
Because JWTs are stateless, anyone holding a valid, unexpired token can impersonate that user until it expires. To reduce this risk, you can keep access token lifespans short (e.g., 15 minutes to 1 hour), store tokens safely on the client (such as `HttpOnly` cookies rather than `localStorage` to protect against XSS), always transmit over HTTPS, and maintain a token blacklist/revocation list in Redis for forced logouts or compromised accounts.

### 7. Why is it important to use HTTPS when transmitting JWT tokens?
Without HTTPS, HTTP traffic travels across the network in plain text. Anyone on the same public Wi-Fi network or intercepting traffic along the route (a Man-in-the-Middle attack) can read the `Authorization: Bearer <token>` header directly and reuse that token to hijack the user's session. HTTPS encrypts the entire request and response pipeline.

### 8. What is the difference between a short-lived access token and a long-lived refresh token? When would you use each?
An **access token** has a short lifespan (e.g., 15 minutes) and is sent with every API request to access protected endpoints. A **refresh token** lasts much longer (e.g., 7 to 30 days) and is only used to request a new access token once the current one expires. You use the access token for normal day-to-day API calls to minimize damage if it gets intercepted, and you use the refresh token quietly in the background so users don't get forced to type their password every 15 minutes.

### 9. How does the auth middleware know which user is making the request?
When `authMiddleware` intercepts an incoming request, it pulls the token from the `Authorization` header and passes it to `jwt.verify()`. Once the signature is confirmed valid, `jwt.verify()` decodes the payload (which contains the `userId` and `email` embedded during login) and attaches it to the Express `req` object (`req.user`), allowing downstream controllers to know exactly who made the call.

### 10. If you had to implement role-based authorization (e.g., admin vs. regular user), how would you modify your current setup?
I would make four updates:
1. **User Entity & DTO:** Add a `role` column (e.g., `'user' | 'admin'`, defaulting to `'user'`) to the `User` entity and migration.
2. **JWT Payload:** Include `role: user.role` when signing the token inside `AuthService.login()`.
3. **Role Middleware:** Create an `authorizeRole(...allowedRoles)` middleware that runs right after `authMiddleware` and checks if `req.user.role` is in the allowed list, returning `403 Forbidden` if not.
4. **Routes:** Chain `authorizeRole('admin')` onto restricted endpoints like `DELETE /api/users/:id`.