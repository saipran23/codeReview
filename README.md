# codeReview

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
