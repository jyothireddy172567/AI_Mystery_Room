# Architecture

React/Vite uses a same-origin `/api/v1` base URL; Vite proxies it to Express during development. Express owns request validation, session checks, generation, answer evaluation, and response DTOs. The Gemini API key remains server-side. Mongoose persists cases and results when MongoDB is configured. Development without MongoDB uses an explicitly temporary in-process repository.

Generation runs through `generateMystery`: versioned prompt → Gemini JSON mode → Zod shape check → ID/reference consistency checks. For requested image evidence, the server generates fictional scene art with the configured Gemini image model, validates the returned MIME type and file signature, stores files under `server/storage/generated`, then saves private file metadata with the case. Image failures are isolated and leave a labeled UI placeholder; a failed text case never becomes playable. Public DTO construction omits `solution`, scenario, internal file names, and prompt metadata. Images are returned by an owner-session-checked endpoint.

Guest identity is a random 256-bit value in a signed HttpOnly cookie. Case queries include both case ID and session owner. A unique MongoDB index on `(caseId, owner)` prevents duplicate accusations. Repeating the same suspect is idempotent and returns the saved result; a different suspect receives a conflict and cannot change the first result.
