# Plan 06: Consumer — Event Handler

**Package:** `@webiny/api-event-handler-aws-ddb-os`
**File:** `packages/api-event-handler-aws-ddb-os/src/createWebinyApiHandler.ts`
**Depends on:** 05-aws-package-exports
**Parallel with:** 07, 08

## Task

Update the AWS DDB+OS event handler to use `@webiny/api-opensearch-aws` for client creation
and factory registration.

## Steps

1. Update `packages/api-event-handler-aws-ddb-os/package.json`:
   - Add dependency: `"@webiny/api-opensearch-aws": "0.0.0"`

2. Update `packages/api-event-handler-aws-ddb-os/src/createWebinyApiHandler.ts`:

   **Imports — change:**
   ```diff
   - import { createOpenSearchClient, type OpenSearchClientOptions } from "@webiny/api-opensearch";
   + import { type OpenSearchClientOptions } from "@webiny/api-opensearch";
   + import { createAwsOpenSearchClient } from "@webiny/api-opensearch-aws";
   ```

   **Import for factory — change:**
   ```diff
   - import { OpenSearchClientFactoryFeature } from "@webiny/api-opensearch/features/OpenSearchClientFactory/feature.js";
   + import { AwsOpenSearchClientFactoryFeature } from "@webiny/api-opensearch-aws/exports/api/opensearchAws.js";
   ```

   **`openSearchClientFromEnv` function (line 50) — change:**
   ```diff
   - return createOpenSearchClient(openSearchClientOptions);
   + return createAwsOpenSearchClient(openSearchClientOptions);
   ```

   **`registerRootStorage` (line 63) — change:**
   ```diff
   - OpenSearchClientFactoryFeature.register(container);
   + AwsOpenSearchClientFactoryFeature.register(container);
   ```

   **Keep unchanged:**
   - `OpenSearchClientFeature` import and registration (line 21, 62)
   - `OpenSearchQueryBuilderOperatorFeature` import and registration (line 23, 64)
   - `OpenSearchFieldFeature` import and registration (line 24, 65)
   - `OpenSearchIndexFeature` import and registration (line 25, 66)
   - `openSearchClient` config type (line 32)
   - All other code

3. Update `packages/api-event-handler-aws-ddb-os/tsconfig.json`:
   - Add project reference to `api-opensearch-aws`

## Verification

- TypeScript compiles: `yarn build -p @webiny/api-event-handler-aws-ddb-os 2>&1 | tail -30`
- Import paths resolve correctly
- Only 4 lines change in the handler file
