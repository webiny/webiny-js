# ADR-002: Dispatch by registry, not by conditional

## Status

Accepted

## Context

When a pipeline must handle different types differently (images vs documents vs videos), the naive approach is a conditional branch inside a monolithic strategy: `if (isImage) ... else if (isVideo) ...`. Each new type adds another branch, and every branch must be tested together.

## Decision

Use a registry of type handlers resolved from the DI container, not conditional branches in a monolithic strategy. Each handler self-registers with a `canHandle()` predicate and provides its own DI abstraction token for the implementation. The dispatcher resolves all registered types, finds the first match, and delegates.

This follows the `EventPublisher` / `EventHandler` pattern already established in the codebase: the event carries its own handler abstraction token, and the publisher resolves all handlers dynamically.

## Examples

- **AssetType registry:** `resolveAll(AssetType)` -> find `canHandle(asset)` -> `container.resolve(match.getHandlerAbstraction())`. Adding `VideoAssetType` = one new class + one `container.register()`. Zero changes to the processor.
- **EventPublisher:** `event.getHandlerAbstraction()` -> `container.resolveAll(token)`. Adding a handler for a new event = one new class registered against the event's token.
- **CmsModelFieldToGraphQLRegistry:** `[CmsModelFieldToGraphQL, { multiple: true }]` — every field type self-registers; the registry just does `.find(f => f.fieldType === type)`.

## Consequences

**Positive:** Zero-touch extensibility — plugins and downstream packages can register types without forking core. The dispatcher never changes.

**Negative:** Indirection — you cannot read a single file to see all supported types; you must trace DI registrations. Mitigated by feature files that list all registrations in one place.
