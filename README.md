# codeReview

## Day 3: PostgreSQL + Sequelize Setup (Local)

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
   - Open `http://localhost:3000/api/auth/github`
   - Complete login and authorization on GitHub.
   - You will be redirected to frontend with a `token` query parameter.

## Auth Endpoints

- `GET /api/auth/github` - redirect to GitHub OAuth
- `GET /api/auth/callback` - GitHub OAuth callback
- `GET /api/auth/me` - get current user from JWT bearer token
