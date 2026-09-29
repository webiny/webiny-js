# @webiny/feature-flags

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

A small, dependency-free library that models a project's feature-flag DTO (`IFeatureFlagsDto`) and answers "is this flag enabled / explicitly disabled" queries against it, including dotted-path lookups into nested group flags (e.g. `advancedAccessControlLayer.teams`). It is the base class that `api-core`'s license-aware feature flags and `project`'s config-level feature flags extend, so it is the canonical place other packages should reuse rather than re-implement their own boolean/"enabled-with-suboptions" flag semantics. Health is good: the logic is small, self-consistent, and its two traversal methods (`isEnabled`/`isExplicitlyDisabled`) are mirror images of each other with no divergence found.

## Public API

- `FeatureFlags` (`src/FeatureFlags.ts:31`) — `fromDto()`, constructor, `isEnabled()`, `isExplicitlyDisabled()`, `toDto()`. Directly instantiated/extended in ~6 places (`project-aws-template`/`project-standalone-template` `webiny.config.base.tsx`, `app-admin/src/features/featureFlags/FeatureFlagsService.ts`), and subclassed by `BuildLicenseDecoratedFeatureFlags`/`LicenseDecoratedFeatureFlags` in `packages/project`. Through those subclasses, `isEnabled`/`isExplicitlyDisabled` are called from ~50+ sites across `ai-powerups`, `api-core` (`IdentityContext`, `GroupsTeamsAuthorizer`), `app-aco`, and `project`.
- `IFeatureFlagsDto` and the nested `IAaclFeatureFlags`/`IAiPowerupsOptions`/`ICollaborationOptions` etc. (`src/types.ts`) — the wire/config shape consumed by the constructor and by `app-admin`'s `FeatureFlagsService`.
- `KnownFeatureFlag`/`FeatureFlagName` (`src/FeatureFlags.ts:3-29`) — the string-literal union of recognized dotted flag names, widened to `string & {}` so unknown/custom names still type-check.

## Bugs

None found.

## Duplication

No intra-package clones (jscpd: 0 duplicates). No obvious re-implementation of this logic found elsewhere; `api-core/src/features/featureFlags/FeatureFlags.ts` and `packages/project`'s decorators build on top of this class rather than duplicating its traversal logic.

## Dead code

None. All exports (`FeatureFlags`, `fromDto`, `isEnabled`, `isExplicitlyDisabled`, `toDto`, the types) have confirmed external consumers via codegraph.

## Convention issues

None meaningful — one class per file, types kept in a separate `types.ts`, no inline object types, no DI in this package (it is a plain data/logic library, not part of the `createImplementation`/DI layer).

## Test gaps

The package has **zero test files of its own** (no `__tests__` directory at all). `isEnabled`/`isExplicitlyDisabled` implement non-trivial recursive semantics (a boolean ancestor short-circuits all descendants to enabled/disabled, an object ancestor means "enabled with sub-options", `toDto()` re-derives every field independently), and none of this is exercised directly — only indirectly, through the subclasses' tests in `packages/api-core/__tests__/featureFlags/FeatureFlagsWithLicenseDecorator.test.ts` and `packages/app-aco/.../GetFolderLevelPermission.test.ts`. A regression in the base traversal (e.g. in the segment-walking loop) could go unnoticed if it happens to not be hit by those higher-level tests.

## Recommendations

1. Add direct unit tests for `FeatureFlags.isEnabled` / `isExplicitlyDisabled` / `toDto`, covering: boolean-true ancestor short-circuiting a descendant lookup, an explicit `false` on a group disabling all its children, and an empty-object group being treated as enabled. This is the single most-reused piece of logic in the package and currently has no dedicated coverage.
2. Nothing else is urgent; the package is small and stable enough that further refactors aren't warranted right now.
3. Consider a short code comment above `isEnabled`'s early `current === true` return explaining that a boolean ancestor fully enables all descendants — it's correct but not obvious on first read, and repo `AGENTS.md` comment conventions already prefer commented rationale for non-obvious control flow.
