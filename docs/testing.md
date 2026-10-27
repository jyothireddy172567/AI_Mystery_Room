# Verification status

Run all tests with `npm test`. Server coverage includes case schema/reference checks, public solution privacy, session ownership, server scoring, API-level idempotent accusation retries, conflicting duplicate prevention, and generated image storage/ownership using a fake image provider. Client coverage includes network/API errors, double-submit locking, restoring a saved result, conflict recovery, and image rendering/fallback. The production frontend build is `npm run build`.

The following live provider and browser scenarios still require MongoDB/Gemini configuration and a running browser:

1. `npm run dev` and check landing/create pages.
2. Confirm invalid scenario and empty evidence choices are rejected.
3. With MongoDB and Gemini configured, create a case and inspect all eight evidence items.
4. Confirm public `GET` response has no `solution` or `culpritId`.
5. Submit one accusation, inspect score and result, then confirm a second is rejected.
6. Attempt to access that case with a fresh browser session and confirm it is unavailable.
