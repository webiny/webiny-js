# Plan 07: Consumer — AWS Template

**Package:** `@webiny/project-aws`
**File:** `packages/project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts`
**Depends on:** 05-aws-package-exports
**Parallel with:** 06, 08

## Task

Update the AWS project template to use `@webiny/api-opensearch-aws` for client creation.

## Steps

1. Open `packages/project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts`

2. Current imports (line 8):
   ```ts
   import { createOpenSearchClient, type OpenSearchClientOptions } from "@webiny/api-opensearch";
   ```

   Change to:
   ```ts
   import { type OpenSearchClientOptions } from "@webiny/api-opensearch";
   import { createAwsOpenSearchClient } from "@webiny/api-opensearch-aws";
   ```

3. Current usage (line 26):
   ```ts
   const client = createOpenSearchClient(clientOptions);
   ```

   Change to:
   ```ts
   const client = createAwsOpenSearchClient(clientOptions);
   ```

4. Check if `project-aws/package.json` needs `@webiny/api-opensearch-aws` dependency.
   Templates may not directly declare deps (they're scaffolded into user projects).
   Follow existing pattern for how template deps are handled.

## Verification

- File compiles (or at least no obvious type errors in template)
- Import paths are correct
