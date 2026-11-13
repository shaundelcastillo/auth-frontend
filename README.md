# Professional Express.js & TypeScript API Boilerplate

A production-ready, highly maintainable RESTful API boilerplate built with Express.js, TypeScript, TypeORM, Joi, and Winston logging. Designed with a layered architecture (Controllers, Services, Repositories, DTOs, and Middleware) to ensure scalability, security, and developer productivity.

---

##  Features

- **TypeScript Architecture**: Strict type safety, clean code structure, and modern ES features.
- **Layered Architecture**: Clear separation of concerns into Routes, Middleware, Controllers, Services, and Data Access (TypeORM).
- **TypeORM Integration**: Database abstraction supporting PostgreSQL/MySQL/SQLite with migration and seeding support.
- **Request Validation**: Schema-based validation using Joi for Request Body, Query Parameters, and URL Parameters.
- **Centralized Error Handling**: Custom error hierarchy (`AppError`, `ValidationError`, `NotFoundError`, etc.) with operational vs. system error differentiation.
- **Structured Logging**: Multi-transport Winston logging system capturing formatted console output, `logs/combined.log`, and `logs/error.log`.
- **Health Checks**: Dedicated endpoint monitoring application status and active database connectivity.
- **Graceful Shutdown**: Intercepts `SIGINT`/`SIGTERM` to safely terminate database connections and HTTP server listeners.

---

## Setup & Installation

### Prerequisites

- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Database**: PostgreSQL / MySQL / SQLite (configured via environment variables)

### Installation Steps

1. **Install dependencies:**
   npm install

2. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env`:
   cp .env.example .env

3. **Run Database Migrations & Seeds:**
   npm run migration:run
   npm run seed

4. **Start Development Server:**
   npm run dev
   The server will start at `http://localhost:3000`.

---

## Environment Variables Documentation

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP server port number | `3000` | No |
| `NODE_ENV` | Application environment (`development` \| `production` \| `test`) | `development` | Yes |
| `DB_HOST` | Database host address | `localhost` | Yes |
| `DB_PORT` | Database connection port | `5432` | Yes |
| `DB_USERNAME` | Database user name | `postgres` | Yes |
| `DB_PASSWORD` | Database user password | `postgres` | Yes |
| `DB_DATABASE` | Database name | `boilerplate_db` | Yes |
| `LOG_LEVEL` | Logging level (`debug` \| `info` \| `warn` \| `error`) | `debug` | No |

---

## API Endpoints Documentation

### Health Check

| Method | Endpoint | Description | Query / Body Params | Response Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Application status & DB connection check | None | `200 OK` / `503 Service Unavailable` |
| `GET` | `/health/crash-test` | Triggers a 500 error for testing `error.log` | None | `500 Internal Server Error` |

### User Management (`/api/users`)

| Method | Endpoint | Description | Request Body / Query Params | Response Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List paginated users | `page` (default: 1)<br>`limit` (default: 10)<br>`sort` (createdAt\|name\|email)<br>`order` (ASC\|DESC) | `200 OK` |
| `GET` | `/api/users/:id` | Get user by ID | Path param: `:id` (positive integer) | `200 OK` / `404 Not Found` |
| `POST` | `/api/users` | Create a new user | `{ name, email, password, age? }` | `201 Created` / `400 Bad Request` / `409 Conflict` |
| `PUT` | `/api/users/:id` | Update existing user | Path param: `:id`<br>Body: `{ name?, email?, age?, isActive? }` | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/api/users/:id` | Delete user by ID | Path param: `:id` (positive integer) | `200 OK` / `404 Not Found` |

---

## Database Migrations & Seeders

### Running Migrations

- **Run all pending migrations:**
  npm run migration:run

- **Revert the last executed migration:**
  npm run migration:revert

- **Generate a new migration file:**
  npm run migration:generate -- src/database/migrations/CreateUsersTable

### Running Seeders

- **Execute database seeding:**
  npm run seed

---

## Reflection & Architecture Summary

### 1. Architectural Decisions & Layered Structure
The application adopts a **Layered (N-Tier) Architecture** with strict boundaries:
- **Routes & Middleware Layer**: Captures HTTP requests, executes authentication/validation middleware, and delegates execution to controllers.
- **Controller Layer**: Handles HTTP request parsing, response formatting, and status code assignment without directly containing business logic.
- **Service Layer**: Houses core domain logic, transaction boundaries, and reusable business operations.
- **Repository/ORM Layer**: Manages database queries via TypeORM data mappers, ensuring data storage abstractions remain decoupled from business rules.

### 2. Error Handling & Resilience Strategy
The application distinguishes explicitly between **Operational Errors** and **System / Programmer Errors**:
- **Operational Errors** (e.g., `400 Validation Error`, `404 Not Found`, `409 Conflict`): Caught by Joi or thrown as instances of `AppError`. They log as `warn`/`info` level events and return formatted JSON error responses without disrupting server execution.
- **System Errors** (e.g., Database drops, syntax errors, uncaught exceptions): Logged directly via `logger.error()` with full stack traces, capturing diagnostic data in `logs/error.log`.

### 3. Logging Strategy & Monitoring
Winston is configured with dual transports:
- `logs/combined.log`: Captures all log outputs (`info`, `warn`, `error`) for complete auditing.
- `logs/error.log`: Specifically filters for `level: 'error'` logs, enabling rapid debugging of system crashes and unhandled exceptions.
- `Console`: Formatted with colorized, human-readable strings during development mode for real-time diagnostics.