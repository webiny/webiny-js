# Plan 08: Consumer — Webiny Re-export

**Package:** `@webiny/webiny`
**Depends on:** 05-aws-package-exports
**Parallel with:** 06, 07

## Task

Add re-exports for `@webiny/api-opensearch-aws` in the `@webiny/webiny` package so consumers
can use the canonical `@webiny/webiny` import paths.

## Steps

1. Create `packages/webiny/src/api/opensearchAws.ts`:

```ts
export { createAwsOpenSearchClient } from "@webiny/api-opensearch-aws";
export { AwsOpenSearchClientFactoryFeature } from "@webiny/api-opensearch-aws/exports/api/opensearchAws.js";
```

2. Update `packages/webiny/package.json`:
   - Add dependency: `"@webiny/api-opensearch-aws": "0.0.0"`
   - Add exports entry for `./api/opensearchAws.js` pointing to `src/api/opensearchAws.ts`
   - Follow pattern from existing `./api/opensearch.js` entry

3. Update `packages/webiny/tsconfig.json`:
   - Add project reference to `api-opensearch-aws`

## Verification

- `yarn build -p @webiny/webiny 2>&1 | tail -30`
- Export path resolves correctly
