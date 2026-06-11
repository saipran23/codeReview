# codeReview

## Day 3: PostgreSQL + Sequelize Setup (Local)

i am testing this
Test PR created for review system testing

1. Install PostgreSQL locally and start it (default port `5432`).
2. Create the database:
   - `psql -U postgres`
   - `CREATE DATABASE codereview;`
3. Install project dependencies:
   - `npm install`
4. Create environment file:
   - `cp .env.example .env`
5. Update DB values in `.env`:
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_NAME=codereview`
   - `DB_USER=postgres`
   - `DB_PASSWORD=postgres`
6. Start backend:
   - `npm run dev`
7. Verify setup:
   - Server logs should show successful database connection.
   - OAuth callback stores GitHub user profile in the `users` table.

## Optional: Neon (Cloud PostgreSQL)

1. Create a Neon project and copy its connection values.
2. Keep the same backend setup, but update `.env` DB fields with Neon values.
3. Set `DB_SSL=true` in `.env`.
4. Run `npm run dev` and confirm database connection succeeds.

## Local GitHub OAuth Setup

1. Install dependencies:
   - `npm install`
2. Create your local env file:
   - `cp .env.example .env`
   - Fill `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `JWT_SECRET`.
3. Create a GitHub OAuth App:
   - GitHub Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback`
4. Start backend:
   - `npm run dev` (or `npm start`)
5. Test OAuth flow locally:
   - Start frontend: `npm run client:dev`
   - Open `http://localhost:5173`
   - Click **Login with GitHub**
   - Complete login and authorization on GitHub.
   - Backend callback redirects to frontend with `token` query parameter.
   - Frontend stores token in `localStorage` (`authToken`) and removes it from URL.

## Auth Endpoints

- `GET /api/auth/github` - redirect to GitHub OAuth
- `GET /api/auth/callback` - GitHub OAuth callback
- `GET /api/auth/me` - get current user from JWT bearer token
- `GET /api/reviews` - public list of reviews
- `GET /api/reviews/mine` - protected list of current user's reviews
- `POST /api/reviews` - protected create review

## Day 5 Manual Validation

1. Install dependencies:
   - `npm install`
2. Start backend:
   - `npm run dev`
3. Start frontend in another terminal:
   - `npm run client:dev`
4. Login from `http://localhost:5173`.
5. Confirm token persistence:
   - Browser DevTools → Application → Local Storage → `authToken`.
6. Refresh page and verify user stays logged in.
7. Create a review from the form (protected request).
8. Delete `authToken` from localStorage and try create again:
   - Request should fail with `401` and UI should require login.
