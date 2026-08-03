# ADR-006: Deprecate incrementally

## Status

Accepted

## Context

When replacing an approach (client-side CSS rendering with server-side pixel delivery, a legacy value shape with a unified one), it is tempting to delete the old implementation in the same change. But if multiple consumers depend on the old approach and they migrate at different rates, deleting prematurely breaks the ones that are not ready.

## Decision

When replacing an approach, keep the old path functional until every consumer has migrated to the new one. Each consumer migrates on its own schedule. Budget the cleanup of the old path as an explicit follow-up task, not "someday."

Mark deprecated code clearly (JSDoc `@deprecated`, comments referencing the replacement), but do not delete until the last consumer is migrated.

## Examples

- **CSS rendering layer:** `Image`, `getImageProps`, and the geometry modules were deleted when Next.js moved to server-side delivery — but React and Vue renderers still used the CSS approach. Had to be restored.
- **ImageValue -> Asset:** The old type is retained and `normalizeToAsset()` converts transparently. Existing page data renders without a storage migration.
- **hotspot -> focalPoint:** The old `ImageHotspot` type is kept; `normalizeToAsset` maps `hotspot.{x,y}` to `focalPoint`. Old values work without re-saving.

## Consequences

**Positive:** No broken deployments; each adapter/consumer migrates independently. Existing data works without migration.

**Negative:** Temporary duplication — two rendering paths, two value shapes coexist. This is the cost of not breaking production. The key discipline is tracking what is deprecated and scheduling the cleanup.
