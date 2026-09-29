# @webiny/aws-layers

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A tiny, config-only package: it holds a static map of AWS Lambda layer ARNs (Sharp, Chromium, and two vendor-published layers) per region, plus a single lookup helper `getLayerArn(name, region)`. No business logic beyond a lookup and two guard clauses; the package is a data table with one accessor.

## Public API
- `getLayerArn(name, region)` (`packages/aws-layers/index.js:4`) — looks up `layers[name][region]`, falling back to `process.env.AWS_REGION` when no region is passed, and throws a formatted `Error` if the layer name or the region for that layer is unknown.
- `layers` (`packages/aws-layers/layers.js:1`) — the raw ARN table, exported for anyone who wants direct access instead of going through the helper.

Consumers: only 2 files import `@webiny/aws-layers` in the repo — `packages/project-aws/src/pulumi/apps/api/ApiFileManager.ts` and `packages/project-aws/src/pulumi/apps/api/ApiBackgroundTask.ts` (both use it to attach the Sharp/Chromium layers to Pulumi Lambda resources).

## Bugs
None found. The two guard clauses in `getLayerArn` are correct (unknown layer name vs. unknown region for a known layer are distinguished), and the `AWS_REGION` fallback only kicks in when `region` is falsy.

## Duplication
N/A — no jscpd report was generated for this package (it has no `src` directory), and the file is too small/data-heavy for meaningful clone analysis. The four region-ARN tables in `layers.js` are structurally identical (same list of AWS regions repeated four times with different ARN suffixes), but this is a data table, not logic duplication, so it isn't a refactор-worthy clone.

## Dead code
None found — both exports are consumed by `project-aws`.

## Convention issues
None meaningful. The package predates the current DI/one-per-file conventions but is simple enough (a data file + a one-function helper) that they don't really apply.

## Test gaps
No tests exist for this package. The only real branch logic — the two `throw` guards and the `AWS_REGION` env fallback — is untested. Given the small blast radius (2 call sites, both under `project-aws`), this is low priority.

## Recommendations
1. Leave as-is; the package is small, correct, and has a tiny, stable consumer set.
2. If a new layer/region is ever added, consider extracting the flat region list (present in all four tables) into a shared constant to avoid a fifth copy-pasted table.
3. Not a priority, but a couple of unit tests for `getLayerArn`'s error paths would be cheap insurance given it throws (rather than returning undefined) and is used inside Pulumi resource construction.
