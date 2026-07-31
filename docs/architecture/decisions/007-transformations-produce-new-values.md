# ADR-007: Transformations produce new values

## Status

Accepted

## Context

Functions that transform data (option parsing, value normalization, asset cloning) can either mutate their input or return a new object. Mutation is shorter to write but makes data flow harder to trace: the caller's variable silently changes, properties appear or disappear, and the order of mutations creates hidden coupling.

## Decision

Functions that transform data return new objects rather than mutating their inputs. This applies to:

- Option parsing / normalization functions
- Domain object transformations (`withProps`, `clone`)
- Value normalizers and converters

The input is treated as read-only. The output is a fresh value.

## Examples

- **normalizeImageOptions:** Was mutating `options` in place (`delete options.width; options.format = parsed`). Refactored to return a new `ImageRequestOptions` object. A test verifies the input is not modified.
- **Asset.withProps():** Creates a new `Asset` instance with merged props — never mutates the original.
- **normalizeToAsset():** Returns a new `WebinyAsset` from any legacy input shape without modifying the input.

## Consequences

**Positive:** Data flow is traceable — each variable holds one value for its lifetime. Easier to debug, test, and reason about. No surprises from shared references.

**Negative:** More object allocations. In hot paths (inner loops, high-frequency operations) this could matter. In request-level processing — which is where most of our transformations happen — it is negligible.
