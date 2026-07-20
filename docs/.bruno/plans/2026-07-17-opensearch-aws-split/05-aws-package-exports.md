# Plan 05: AWS Package Exports

**Package:** `@webiny/api-opensearch-aws`
**Files:** `src/index.ts`, `src/exports/api/opensearchAws.ts`
**Depends on:** 04-aws-factory-feature

## Task

Set up barrel exports and canonical consumer exports path. Follow minimal barrel exports
principle — only export what external consumers need.

## Steps

1. Update `packages/api-opensearch-aws/src/index.ts` (barrel):

```ts
export { createAwsOpenSearchClient } from "./createAwsOpenSearchClient.js";
```

Only the main public API function. Feature is not in barrel — imported via canonical path.

2. Create `packages/api-opensearch-aws/src/exports/api/opensearchAws.ts` (canonical consumer path):

```ts
export { createAwsOpenSearchClient } from "~/createAwsOpenSearchClient.js";
export { AwsOpenSearchClientFactoryFeature } from "~/features/AwsOpenSearchClientFactory/feature.js";
```

Both the function and the DI feature available from canonical path.

3. Verify `package.json` exports field includes the canonical path:

```json
{
    "exports": {
        ".": "./src/index.ts",
        "./exports/api/opensearchAws.js": "./src/exports/api/opensearchAws.ts"
    }
}
```

Check how `api-opensearch/package.json` defines its exports field and follow the same pattern
(may use `dist/` paths, conditions like `import`/`require`, etc.).

## Notes

- Barrel (`index.ts`): minimal — `createAwsOpenSearchClient` only
- Canonical path (`exports/api/opensearchAws.ts`): function + feature
- Feature implementation (`AwsOpenSearchClientFactory`) stays internal

## Verification

- Both export paths resolve correctly
- No internal implementation details leak
