# ADR-001: Domain objects carry only their own concerns

## Status

Accepted

## Context

When a feature targets a specific subtype (e.g., images within a generic file/asset pipeline), it is tempting to add type-specific properties directly to the generic domain object — "it's just one optional field." Over time this accumulates: every new subtype adds more optional fields, and every consumer of the generic object must decide which ones to ignore.

## Decision

A domain object represents one concept at one level of abstraction. It must not carry fields, methods, or type definitions that belong to a specific subtype.

Type-specific data is loaded by type-specific handlers, not baked into the carrier.

## Examples

- **Asset delivery:** `Asset` carried `imageEdit?: AssetImageEdit` and `getImageEdit()`. Every PDF and ZIP asset hauled image interfaces it never used. Refactored: `Asset` carries only `id`, `tenant`, `key`, `size`, `contentType`. The image handler loads crop data via a use case.
- **AssetRequestOptions:** Had typed image fields (`width`, `format`, `quality`, `crop`, `focal`, `aspectRatio`). A video handler's `bitrate` would end up on the same interface. Refactored: generic `{ original?, [key]: unknown }` — each handler parses its own options.
- **EventPublisher:** Does NOT carry event-specific payload types — it is generic over `DomainEvent`. Each event carries its own typed payload.

## Consequences

**Positive:** Adding a new variant (video asset, new event type) never touches the base class. The generic object stays stable and testable.

**Negative:** Handlers must explicitly load and parse what they need — slightly more code per handler. This is the right tradeoff: a small per-handler cost vs. an ever-growing generic type that nobody fully understands.
