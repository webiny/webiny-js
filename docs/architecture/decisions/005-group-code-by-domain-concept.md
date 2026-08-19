# ADR-005: Group code by domain concept, not by technical layer

## Status

Accepted

## Context

Layer-first organization (`abstractions/`, `transformation/`, `utils/`) groups files by what they are, not by what they do. A developer working on "image delivery" must hunt across multiple directories to find all relevant files. Worse, it is unclear which files in `transformation/` are image-specific and which are generic.

## Decision

Files that change together live together. Type-specific code is grouped by domain concept (e.g., `assetTypes/image/`), not scattered across generic layer directories. Generic pipeline code stays in its own directory.

## Examples

- **Image asset type:** `assetTypes/image/` contains `AssetKeyGenerator`, `utils`, `transformImage`, `imageFormat`, `imageTypes`, `normalizeImageOptions`, `ImageAssetType`, `ImageAssetTypeHandler`, `WidthCollection`. Everything image-specific is here.
- **Generic pipeline:** `transformation/` keeps only `TransformationAssetProcessor` and `CallableContentsReader` — code that is truly generic.
- **Future extensibility:** A `assetTypes/video/` directory would contain its own key generator, transform, types, and handler. Zero overlap with image files. Deleting a concept is `rm -rf` on one directory.

## Consequences

**Positive:** Adding a new domain concept is additive — create a directory, register it. The blast radius of changes is contained. New developers find everything in one place.

**Negative:** Barrel re-exports may be needed for backward compatibility when moving existing code. Some shared utilities (like `CallableContentsReader`) remain in a generic directory, which is correct — they are not type-specific.
