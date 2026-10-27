# AI Mystery Room

An interactive fictional detective game. Create a story seed, inspect the evidence, choose a suspect, and get a server-checked reveal.

## Stack

- React 18, Vite, React Router, CSS design tokens
- Node.js, Express, Zod, Mongoose
- Google Gemini through the official `@google/genai` SDK

## Run locally

Use Node.js 20 or newer. From the repository root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend runs at http://localhost:5173 and the API at http://localhost:5000. In `.env`, set `GEMINI_API_KEY` and `MONGODB_URI` for generated cases and persistent storage. `GEMINI_IMAGE_MODEL` defaults to `gemini-nano-banana-2.1`; it uses the same server-side Gemini key. MongoDB can be a local instance or an authorized hosted cluster. Configure `SESSION_SECRET` with a long random value.

When `MONGODB_URI` is blank in development, the server uses process-local memory storage and logs this limitation at startup. Those demo cases disappear when the server restarts. When `GEMINI_API_KEY` is blank, generation returns a clear configuration error; the app does not pretend fixture data came from Gemini.

## Environment

See `.env.example`. Server secrets are read only by Express and are never exposed as Vite client variables. In local development, `CLIENT_ORIGIN` must match the frontend origin. Production requires MongoDB, Gemini, session secret, and writable image storage configuration.

## Implemented

- Responsive landing page, creation form, investigation room, and results page.
- Scenario validation, difficulty and evidence selection, request loading/error feedback.
- Session-owned cases using a signed, HttpOnly cookie.
- Gemini JSON generation with bounded retry and schema/cross-reference validation.
- MongoDB case persistence, process-local development fallback, one saved accusation per case/session, server-side scoring.
- Public case DTO excludes the private solution; result endpoint reveals solution only after successful accusation persistence.
- Gemini-generated fictional scene images for image evidence, saved under private server storage and served through a session-owned API route. Failed image generation or loading falls back to a clearly labeled illustration placeholder.
- CCTV transcript treatment, chat and witness renderers.
- Idempotent same-suspect accusation retries; a conflicting second suspect cannot overwrite the saved result.
- Helmet, CORS, request limits, rate limits, request IDs, sanitized API errors, 14-day TTL cleanup for database cases.

## Current limitations

- MongoDB and Gemini credentials are needed for persistent AI-generated cases. Memory storage is only for local development.
- The application currently uses one in-memory process-local repository when MongoDB is absent; it is not suitable for production or multi-worker deployments.
- No video generation is integrated. CCTV remains transcript/storyboard evidence. Generated image files use local server storage; production deployments with ephemeral disks should configure persistent/object storage before deployment.
- CI and live MongoDB/Gemini provider integration tests are not included; deterministic server and frontend tests are included.

## Tests

Run `npm test` for the server API/domain tests and client component/API tests. The image and accusation tests use local fakes and do not make paid Gemini requests.

See `docs/architecture.md`, `docs/api-contract.md`, and `docs/data-models.md` for implementation details.

## Deploy to Render

Follow the complete walkthrough in [`docs/deployment.md`](docs/deployment.md). The repository includes a Dockerfile and `render.yaml` Blueprint for one service that serves both the React site and Express API. A paid Render service with a persistent disk is required for generated evidence images to survive deploys; MongoDB Atlas stores case data separately.
