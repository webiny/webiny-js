# ADR-003: Handlers are autonomous

## Status

Accepted

## Context

A "helpful" pipeline that pre-fetches type-specific data or pre-parses type-specific options on behalf of handlers creates invisible coupling. The pipeline must know what every handler needs, and adding a new handler type requires changing the pipeline's pre-fetch/parse logic.

## Decision

A handler receives the minimum generic context (a request, an entity ID) and is responsible for:

1. **Loading its own domain data** via use cases or repositories
2. **Parsing its own options** from the raw request parameters
3. **Producing its output** using its own key generation, caching, and transformation logic

The generic pipeline provides only the dispatch mechanism and the raw inputs.

## Examples

- **Image handler:** `SharpTransform.handle()` calls `GetFileUseCase` to load `imageEdit` and calls `normalizeImageOptions()` to parse image query params. The resolver passes raw query params through — it does not know about `width`, `format`, or `crop`.
- **Private files processor:** `PrivateFilesAssetProcessor` loads the file via `GetFileUseCase` for authorization. It does not expect the resolver to pre-load file records.
- **Anti-pattern (old design):** `MetadataWriter` persisted `imageEdit` to KV store, `S3AssetResolver` read it back and injected it into `Asset.create()`. The generic resolver knew about image data and carried it for the handler.

## Consequences

**Positive:** Each handler can evolve independently; its data contract is private. Adding a video handler with completely different metadata requires zero changes to the pipeline.

**Negative:** May duplicate some lookups (e.g., `GetFileUseCase` called by both the private-files decorator and the image handler). Optimize with caching at the use-case level, not by coupling the pipeline to handler-specific data.
