# ADR-004: Concepts deserve their own types

## Status

Accepted

## Context

When a new concept is structurally similar to an existing one, it is tempting to model it as a constrained variant: "an asset field is just an object field with a specific renderer." This avoids creating new infrastructure but introduces a hidden subtype that every consumer must detect with ad-hoc guards (`isAssetField()`, tag checks, renderer-name matching).

## Decision

If a concept has distinct behavior, validation, or schema, it gets its own type — even if it could technically be expressed as a constrained variant of an existing type. The discrimination should be by the type system (a distinct `type` string, a separate class, a dedicated interface), not by runtime guards on metadata.

## Examples

- **CMS asset field:** Was `type: "object"` + `renderer: "asset-input"` + tag `"wby:asset"`. Required `isAssetField()` checks in `ObjectToGraphQL`, a normalizer on every model save, and per-model type generation. Refactored to `type: "asset"` with its own `AssetToGraphQL` — clean discrimination by type string.
- **DomainEvent subclasses:** Each carries its own handler abstraction token rather than being dispatched by a string enum inside the publisher. The type is the discriminator.
- **AssetRequestOptions:** Was a union of every handler's options. Refactored to a generic bag — each handler casts to its own typed options interface (`ImageRequestOptions`).

## Consequences

**Positive:** No `isXyz()` guards scattered across the codebase. Tooling, type inference, and schema generation work naturally. Each concept's implementation is self-contained.

**Negative:** More files — each concept has its own type definition, GraphQL mapping, and builder. Worth it for anything with distinct behavior; not needed for trivial variations (e.g., a text field with a custom renderer).
