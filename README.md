# Auth Frontend (`auth-frontend`)

An Angular authentication frontend built to integrate with a Node.js authentication backend. It covers user registration, email verification, sign-in, password recovery, route protection, HTTP interceptors, and a protected dashboard view.

## Features

* **Authentication Pages:** User registration, email verification (`?token=...`), login with `returnUrl` redirect support, forgot password, and reset password.
* **Centralized Auth State & API Layer:** `AuthService` manages authentication state and communicates with the backend API.
* **Route Guards:** Protects private routes like `/dashboard` from unauthenticated users and keeps authenticated users away from guest-only auth pages.
* **HTTP Interceptors:** `authInterceptor` attaches auth tokens/credentials to outgoing requests, while `errorInterceptor` handles API errors consistently.
* **Lazy-Loaded Feature Routes:** Splits feature components (`login`, `register`, `verify-email`, `forgot-password`, `reset-password`, `dashboard`) into separate chunks loaded on demand.
* **Protected Dashboard:** Displays authenticated user information once logged in.

## Setup Instructions

### Prerequisites

* **Node.js** and **npm** installed
* **Angular CLI** (`ng`)
* The companion **Node.js backend** running (for example, on `http://localhost:3002`)

### Installation & Running

1. Navigate to the frontend directory:
  
   cd auth-frontend
   

2. Install dependencies:
  
   npm install
  

3. Verify your configuration:
   * Check `src/app/app.config.ts` to confirm `provideRouter(routes)` and `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))` are registered (and ensure `provideAnimations()` is either removed or `@angular/animations` is installed).
   * Check `src/main.ts` to ensure `import 'zone.js';` is imported before bootstrapping when using Zone-based change detection.
   * Confirm the API base URL in your service/environment points to your running Node.js backend.

4. Start the development server:
   
   ng serve
   

5. Open `http://localhost:4200` in your browser.

## Screenshots

Replace the placeholder paths below with your actual screenshots once saved in your repo (for example, under `docs/screenshots/`):

* **Login Page:** `![Login Page](./docs/screenshots/login.png)`
* **Register Page:** `![Register Page](./docs/screenshots/register.png)`
* **Verify Email Page:** `![Verify Email Page](./docs/screenshots/verify-email.png)`
* **Forgot Password Page:** `![Forgot Password Page](./docs/screenshots/forgot-password.png)`
* **Reset Password Page:** `![Reset Password Page](./docs/screenshots/reset-password.png)`
* **Dashboard Page:** `![Dashboard Page](./docs/screenshots/dashboard.png)`

## Reflection

### 1. What are the three main modern Angular features you used in this project? How do they improve the developer experience?

Three modern Angular features that stand out in this project are **standalone components**, **functional route guards and HTTP interceptors**, and **signals (`signal()`)** for reactive state. Instead of wrapping everything in `NgModule` boilerplate or class-based interceptors/guards with heavy dependency setups, standalone components and functional guards/interceptors keep files focused, easier to read, and simpler to wire up in `app.config.ts` and `app.routes.ts`. Signals also make local reactive state (like component titles or UI state) straightforward to read and update without extra ceremony.

### 2. Explain the difference between Signals and RxJS. When would you use each?

Signals are synchronous, reactive state containers that hold a current value and track dependencies automatically—great for UI state and component values where you always want a reliable current snapshot. RxJS is built around asynchronous event streams over time (like HTTP requests, debounced inputs, or multi-step async flows) with rich operators for combining, retrying, or cancelling streams. In practice, I use RxJS when dealing with async data streams like `HttpClient` calls, and Signals when managing synchronous reactive state in components or services.

### 3. Why is it important to have both an auth interceptor and an error interceptor?

Separating them keeps responsibilities clean instead of cramming everything into one place. An **auth interceptor** focuses on outgoing requests—attaching tokens or auth headers consistently so individual services do not have to repeat that logic on every request. An **error interceptor** focuses on incoming responses—catching HTTP failures (such as `401` unauthorized or server errors) in one central place so error handling and user feedback stay consistent across the app.

### 4. How do route guards improve security and user experience?

For security and access flow, route guards stop unauthorized visitors from opening protected routes like `/dashboard` directly by URL, and they prevent already-logged-in users from getting stuck on guest screens like `/auth/login`. For user experience, they can redirect users smoothly—for example, sending someone who tried to visit `/dashboard` to `/auth/login?returnUrl=%2Fdashboard` so they land right where they intended after signing in.

### 5. What is lazy loading and why is it important for performance?

Lazy loading means feature code is split into separate chunks and only downloaded when the user actually navigates to that route, rather than bundling everything into the initial download. In this build, routes like `login-component`, `register-component`, `verify-email-component`, `forgot-password-component`, `reset-password-component`, and `dashboard-component` load as separate lazy chunks. That keeps the initial bundle smaller and helps the app start up faster.

### 6. Explain the "single source of truth" principle in the context of your AuthService.

Having `AuthService` act as the single source of truth means authentication state (whether the user is logged in, current user info, token/session handling, and auth actions) lives in one place rather than being duplicated across login, register, navbar, and dashboard components. When login, logout, or verification happens, every part of the app reads from that same service, which prevents conflicting states or stale UI.

### 7. What challenges did you face when connecting the Angular frontend to the Node.js backend? How did you solve them?

Getting the frontend and backend talking smoothly took a few practical fixes:
* **Startup & configuration snags:** Missing `@angular/animations` caused a browser resolution error until `provideAnimations()` was removed/handled, `NG0908` needed `import 'zone.js';` at the top of `main.ts`, and `app.html` still had the default starter template above `<router-outlet />` until cleaned up.
* **Request & verification flow:** Making sure the backend was running on the expected port, requests weren't blocked by CORS/browser shields or bad payloads, and registration emails in Ethereal opened the right `/verify-email?token=...` link so the account actually became verified before logging in.

### 8. If you had to add a new feature (e.g., user profile editing), how would you approach it using the patterns you learned?

I would follow the existing feature-oriented structure: create a dedicated profile feature component (lazy-loaded in the routes and protected by the auth guard), add profile fetch/update methods in a service (reusing the auth/error interceptors for tokens and error handling), build a clean form with validation and clear feedback banners, and update shared user state from a single source so the dashboard reflects the new profile details right away.

### 9. What security considerations did you implement in the frontend (token storage, XSS prevention, etc.)?

On the frontend, I rely on Angular's built-in template escaping/sanitization to help prevent XSS, guard protected routes so unauthenticated users are bounced to login, and handle auth errors centrally via interceptors. At the same time, frontend checks are never enough on their own—token handling should avoid exposing sensitive secrets unnecessarily, and real authorization, password hashing, and verification token validation (like time-limited email verification links) must always be enforced on the backend.

### 10. How does this Angular frontend demonstrate the "Integrative Programming" concepts from this course?

Integrative Programming is all about connecting distinct systems and services so they work together as one cohesive application. Here, the Angular client communicates over HTTP with a separate Node.js authentication API, coordinates multi-step workflows (registering a user, triggering an email with a verification token, verifying that token, and unlocking a protected dashboard), and applies clean separation of concerns through routing, guards, interceptors, and a central service.