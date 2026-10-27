# Data models

`Mystery` stores the owner session ID, public case fields, input scenario, private solution, generation version, ready status, evidence asset metadata, and creation time. A TTL index expires mystery documents after 14 days. Image bytes are stored under `server/storage/generated/<caseId>` and remain outside public DTOs. `Result` stores owner, case, selected suspect, deterministic correctness/score, and timestamp; a unique compound index enforces one result per owner/case.

Public case DTO fields are explicitly enumerated: case ID, title, summary, setting, difficulty, incident time, suspects, evidence, timeline, and status. Evidence DTOs contain `assetStatus` and, only for ready images, a session-authorized `assetUrl`; internal asset filenames and MIME metadata are omitted. The private solution is joined into a result only after an accusation has been saved.
