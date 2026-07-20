# Split api-opensearch: Base + AWS Package

**Date:** 2026-07-17
**Branch:** bruno/feat/api-headless-cms-pg-os
**Status:** Approved

## Problem

`@webiny/api-opensearch` bundles AWS SigV4 signing logic (`AwsSigv4Signer` from
`@opensearch-project/opensearch/aws`) unconditionally in `client.ts`. Every consumer —
including non-AWS deployments (PG+OS with self-hosted OpenSearch) — pulls AWS SDK
dependencies into their bundle. The PG+OS variant needs a standard OpenSearch client
without AWS coupling.

## Solution

Split into two packages:

- **`@webiny/api-opensearch`** (base) — standard OpenSearch client, all existing DI features,
  utilities, testing helpers. No AWS dependency.
- **`@webiny/api-opensearch-aws`** (new) — wraps base client with SigV4 signing, provides
  DI factory replacement for on-demand client creation.

## Package Changes

### `@webiny/api-opensearch` (base)

**Only `client.ts` changes:**

1. Remove `import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws"` (line 5)
2. Remove SigV4 fallback block (lines 37-64)
3. No auth = unsigned client (works for local/dev OpenSearch with security disabled)

Everything else unchanged: features (`OpenSearchClient`, `OpenSearchClientFactory`,
`OpenSearchField`, `OpenSearchIndex`, `OpenSearchQueryBuilderOperator`), testing
(`createTestOpenSearchClient`, `registerOpenSearchCoreForTests`), utilities, exports,
`registerOpenSearchCore`.

Client caching (SHA256 hash of options) and error handling preserved.

### `@webiny/api-opensearch-aws` (new)

```
packages/api-opensearch-aws/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                              # barrel: createAwsOpenSearchClient only
│   ├── createAwsOpenSearchClient.ts          # wrapper with SigV4
│   ├── exports/
│   │   └── api/
│   │       └── opensearchAws.ts              # canonical: createAwsOpenSearchClient + feature
│   └── features/
│       └── AwsOpenSearchClientFactory/
│           ├── AwsOpenSearchClientFactory.ts  # implementation (internal)
│           └── feature.ts                     # DI feature registration
```

**Export structure (minimal barrel exports):**

- `index.ts` — only `createAwsOpenSearchClient` (main public API)
- `exports/api/opensearchAws.ts` — `createAwsOpenSearchClient` + `AwsOpenSearchClientFactoryFeature`
  (canonical consumer path, matches base pattern)
- Feature implementation is internal — not exported from barrel
- Event handler imports feature from canonical path, not deep path

**Dependencies:**

- `@webiny/api-opensearch` — base client, types, abstractions
- `@opensearch-project/opensearch` — for `AwsSigv4Signer` from `/aws` subpath
- `@webiny/error` — for `WebinyError`

**`createAwsOpenSearchClient(options)`:**

- If `options.auth` present: passes through to base `createOpenSearchClient` unchanged
- If no `auth`: reads `AWS_REGION` (required), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_SESSION_TOKEN` from env, wraps options with `AwsSigv4Signer`, then calls base
- Throws `MISSING_AWS_REGION` if `AWS_REGION` absent
- Throws `MISSING_AWS_CREDENTIALS` if access key or secret key absent

**`AwsOpenSearchClientFactory`:**

- Implements `OpenSearchClientFactory.Interface` from base
- Uses `createAwsOpenSearchClient` internally
- Validates endpoint/node/nodes presence (same as base factory)

**`AwsOpenSearchClientFactoryFeature`:**

- Feature name: `opensearch.aws.clientFactory`
- Registers `AwsOpenSearchClientFactory` implementation for `OpenSearchClientFactory` abstraction
- Replaces base factory binding when registered

## Consumer Migration

### `@webiny/api-event-handler-aws-ddb-os`

Only consumer that needs changes:

```diff
- import { createOpenSearchClient, type OpenSearchClientOptions } from "@webiny/api-opensearch";
+ import { type OpenSearchClientOptions } from "@webiny/api-opensearch";
+ import { createAwsOpenSearchClient } from "@webiny/api-opensearch-aws";
+ import { AwsOpenSearchClientFactoryFeature } from "@webiny/api-opensearch-aws";

  // openSearchClientFromEnv:
- return createOpenSearchClient(openSearchClientOptions);
+ return createAwsOpenSearchClient(openSearchClientOptions);

  // registerRootStorage:
  OpenSearchClientFeature.register(container, openSearchClient);
- OpenSearchClientFactoryFeature.register(container);
+ AwsOpenSearchClientFactoryFeature.register(container);
```

Add `@webiny/api-opensearch-aws` to `package.json` dependencies.

### `@webiny/webiny`

Add re-export at `src/api/opensearchAws.ts`:

```ts
export { createAwsOpenSearchClient } from "@webiny/api-opensearch-aws";
export { AwsOpenSearchClientFactoryFeature } from "@webiny/api-opensearch-aws";
```

### AWS Template

`project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts` —
switch `createOpenSearchClient` import to `createAwsOpenSearchClient` from `@webiny/api-opensearch-aws`.

## What Stays Unchanged

- All DI abstractions (`OpenSearchClient`, `OpenSearchClientFactory`, `OpenSearchField`,
  `OpenSearchIndex`, `OpenSearchQueryBuilderOperator`) stay in base
- `registerOpenSearchCore` stays in base
- All testing helpers stay in base (they use `new Client()` directly)
- All utilities (sort, where, limit, normalize, cursors, indices, etc.) stay in base
- Canonical exports path `exports/api/opensearch.ts` stays in base
- 53 of 55 importers unchanged (only event handler + template change)

## Design Decisions

1. **Base stays `api-opensearch`** — renaming to `api-opensearch-server` would update 55 import
   sites for no functional gain.
2. **No auth = unsigned client** — works for local/dev OpenSearch. AWS package adds SigV4 on top.
3. **Wrapper function + DI feature** — covers both eager client creation (event handler calls
   `createAwsOpenSearchClient` directly) and on-demand creation (factory resolved from DI
   container). More explicit than pure-DI approach.
4. **Factory replacement, not decoration** — `AwsOpenSearchClientFactoryFeature` registers its
   own implementation for `OpenSearchClientFactory` abstraction, replacing base binding. Simpler
   than decorator chain for a single override.
