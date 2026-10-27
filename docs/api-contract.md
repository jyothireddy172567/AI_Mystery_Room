# API contract

Base path: `/api/v1`; JSON requests use credentialed cookies.

- `GET /health` → `{ "status": "ok" }`
- `POST /mysteries` body `{ scenario, difficulty, evidenceTypes }` → `201` public case DTO
- `GET /mysteries/:caseId` → authorized public case DTO only
- `GET /mysteries/:caseId/evidence/:evidenceId/image` → session-authorized generated image bytes
- `POST /mysteries/:caseId/accusations` body `{ suspectId }` → persisted verdict, score, and solution
- `GET /mysteries/:caseId/result` → saved result after accusation only

Repeating an accusation with the same suspect returns the previously saved result (idempotent retry). A different suspect receives `409 ALREADY_SUBMITTED`; it cannot replace the original result.

Errors use `{ error: { code, message, requestId, details } }`. Implemented codes include validation, not found, access by indistinguishable 404, provider/output failures, duplicate accusation, and rate limit.
