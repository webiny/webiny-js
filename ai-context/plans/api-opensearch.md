# api-opensearch Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new `@webiny/api-opensearch` package that replaces `@elastic/elasticsearch`, `aws-elasticsearch-connector`, and `elastic-ts` with `@opensearch-project/opensearch` and its native types.

**Architecture:** The new `api-opensearch` package is a near-identical copy of `api-elasticsearch`, with the client library swapped, the AWS connector replaced by the built-in `AwsSigv4Signer`, and all `elastic-ts` types replaced with native types from `@opensearch-project/opensearch/api/types`. All public class/plugin names stay the same so consumers can migrate by changing the import path only.

**Tech Stack:** `@opensearch-project/opensearch`, `@webiny/plugins`, `@webiny/api`, `@webiny/error`, `@webiny/db-dynamodb`

---

## Document Info

- **Version:** 1.0
- **Created:** 2026-03-20
- **Purpose:** Implementation guide for creating `packages/api-opensearch`

---

## Table of Contents

1. [Goals & Non-Goals](#1-goals--non-goals)
2. [Type Mapping: elastic-ts → opensearch native](#2-type-mapping-elastic-ts--opensearch-native)
3. [Package Structure](#3-package-structure)
4. [Client Setup](#4-client-setup)
5. [Type Definitions](#5-type-definitions)
6. [Plugin Definitions](#6-plugin-definitions)
7. [Core Logic Files](#7-core-logic-files)
8. [Index / Entry Point](#8-index--entry-point)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Goals & Non-Goals

### Goals

| Goal                                 | Description                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **New package**                      | `packages/api-opensearch` — a fresh package, `api-elasticsearch` is NOT modified                                        |
| **Drop elastic-ts**                  | All types from `elastic-ts` are replaced with native `@opensearch-project/opensearch` types or local aliases            |
| **Drop aws-elasticsearch-connector** | Use the built-in `AwsSigv4Signer` from `@opensearch-project/opensearch/aws`                                             |
| **API parity**                       | All exported symbols, plugin classes, and utility functions have the same shape — consumers change only the import path |
| **Naming**                           | Rename `Elasticsearch*` prefixes to `OpenSearch*` throughout the new package                                            |

### Non-Goals

| Non-Goal                        | Reason                                      |
| ------------------------------- | ------------------------------------------- |
| Modify `api-elasticsearch`      | It stays untouched as the legacy package    |
| Migrate every consuming package | Out of scope for this plan; done separately |
| Index mapping changes           | No semantic changes to OpenSearch query DSL |
| Add new features                | Pure migration only                         |

---

## 2. Type Mapping: elastic-ts → opensearch native

`elastic-ts` types are imported from `@opensearch-project/opensearch/api/types` (re-exported as `Types` below). Some types don't exist natively and get a local alias instead.

```typescript
import type * as Types from "@opensearch-project/opensearch/api/types";
```

| elastic-ts type                | opensearch native                 | Notes                                                       |
| ------------------------------ | --------------------------------- | ----------------------------------------------------------- |
| `Query` (aliased as `esQuery`) | `Types.QueryDslQueryContainer`    | Direct equivalent                                           |
| `BoolQueryConfig`              | `Types.QueryDslBoolQuery`         | Direct equivalent                                           |
| `Sort`                         | `Types.Sort`                      | Verify after install — may be `SortCombinations[]`          |
| `SortType`                     | `Record<string, Types.FieldSort>` | `SortType` is the object form of a single sort entry        |
| `FieldSortOptions`             | `Types.FieldSort`                 | Verify field name after install                             |
| `SortOrder`                    | `Types.SortOrder`                 | Same `"asc" \| "desc"`                                      |
| `SearchBody`                   | `Types.SearchRequest['body']`     | Or inline the relevant subset                               |
| `PrimitiveValue`               | Local alias                       | `type PrimitiveValue = null \| number \| string \| boolean` |

> **Important:** After installing `@opensearch-project/opensearch`, run `node -e "const t = require('@opensearch-project/opensearch/api/types'); console.log(Object.keys(t).filter(k => /sort/i.test(k)))"` to verify the exact exported names for Sort types before writing code.

---

## 3. Package Structure

```
packages/api-opensearch/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                          # Entry point + context plugin
    ├── client.ts                         # OpenSearch client factory (replaces aws-elasticsearch-connector)
    ├── types.ts                          # All types; imports from @opensearch-project/opensearch/api/types
    ├── sort.ts                           # createSort() — same logic, updated types
    ├── where.ts                          # applyWhere(), parseWhereKey() — same logic
    ├── indices.ts                        # getLastAddedIndexPlugin()
    ├── limit.ts                          # getLimit()
    ├── normalize.ts                      # normalizeValue()
    ├── compression.ts                    # compress/decompress helpers
    ├── cursors.ts                        # cursor encode/decode
    ├── operators.ts                      # getOpenSearchOperators()
    ├── sharedIndex.ts                    # shared index helpers
    ├── indexPrefix.ts                    # index prefix helpers
    ├── indexConfiguration/
    │   ├── base.ts
    │   ├── common.ts
    │   └── index.ts
    ├── plugins/
    │   ├── index.ts
    │   ├── definition/
    │   │   ├── index.ts
    │   │   ├── OpenSearchBodyModifierPlugin.ts
    │   │   ├── OpenSearchFieldPlugin.ts
    │   │   ├── OpenSearchIndexPlugin.ts
    │   │   ├── OpenSearchQueryBuilderOperatorPlugin.ts
    │   │   ├── OpenSearchQueryModifierPlugin.ts
    │   │   └── OpenSearchSortModifierPlugin.ts
    │   └── operator/
    │       ├── index.ts
    │       ├── andIn.ts
    │       ├── between.ts
    │       ├── contains.ts
    │       ├── equal.ts
    │       ├── gt.ts
    │       ├── gte.ts
    │       ├── in.ts
    │       ├── lt.ts
    │       ├── lte.ts
    │       ├── not.ts
    │       ├── notBetween.ts
    │       ├── notContains.ts
    │       ├── notIn.ts
    │       ├── notStartsWith.ts
    │       └── startsWith.ts
    ├── operations/
    │   ├── index.ts
    │   ├── types.ts
    │   ├── OpenSearchCatHealth.ts
    │   ├── OpenSearchCatNodes.ts
    │   └── stripConnectionFromException.ts
    ├── db/
    │   ├── index.ts
    │   ├── table.ts
    │   ├── entity.ts
    │   └── types.ts
    └── utils/
        ├── index.ts
        ├── createIndex.ts
        └── waitUntilHealthy/
            ├── index.ts
            ├── UnhealthyClusterError.ts
            ├── WaitUntilHealthy.ts
            ├── WaitingHealthyClusterAbortedError.ts
            └── reason/
                ├── index.ts
                ├── ClusterHealthReason.ts
                ├── IReason.ts
                ├── MemoryReason.ts
                └── ProcessorReason.ts
```

---

## 4. Client Setup

### 4.1 `package.json`

Copy `packages/api-elasticsearch/package.json` and apply these changes:

```json
{
  "name": "@webiny/api-opensearch",
  "description": "A set of plugins to work with OpenSearch.",
  "dependencies": {
    "@opensearch-project/opensearch": "^3.0.0",
    "@webiny/api": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/db-dynamodb": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/plugins": "0.0.0"
  }
}
```

**Removed:** `@elastic/elasticsearch`, `aws-elasticsearch-connector`, `elastic-ts`
**Added:** `@opensearch-project/opensearch`

> Check the latest stable version of `@opensearch-project/opensearch` on npm before pinning. As of early 2025 it is `^3.x`.

### 4.2 `src/client.ts`

The key difference from `api-elasticsearch/src/client.ts` is:

1. Import `Client` and `AwsSigv4Signer` from the opensearch package instead of using `aws-elasticsearch-connector`
2. Use the provider-based `AwsSigv4Signer` API instead of building credential objects manually

```typescript
import crypto from "crypto";
import { Client, type ClientOptions } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import WebinyError from "@webiny/error";

export interface OpenSearchClientOptions extends ClientOptions {
  endpoint?: string;
}

export { Client, type ClientOptions };

const clients = new Map<string, Client>();

const createClientKey = (options: OpenSearchClientOptions): string => {
  const key = JSON.stringify(options);
  const hash = crypto.createHash("sha1");
  hash.update(key);
  return hash.digest("hex");
};

export const createOpenSearchClient = (options: OpenSearchClientOptions): Client => {
  const key = createClientKey(options);
  const existing = clients.get(key);
  if (existing) {
    return existing;
  }

  const { endpoint, node, ...rest } = options;

  let clientOptions: ClientOptions = {
    node: endpoint || node,
    ...rest
  };

  if (!clientOptions.auth) {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new WebinyError("Missing AWS_REGION", "MISSING_AWS_REGION");
    }

    clientOptions = {
      ...clientOptions,
      ...AwsSigv4Signer({
        region,
        service: "es", // use "aoss" for OpenSearch Serverless
        getCredentials: () => {
          const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
          const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
          const sessionToken = process.env.AWS_SESSION_TOKEN;

          if (!accessKeyId || !secretAccessKey) {
            throw new WebinyError("Missing AWS credentials", "MISSING_AWS_CREDENTIALS");
          }

          return Promise.resolve({ accessKeyId, secretAccessKey, sessionToken });
        }
      })
    };
  }

  try {
    const client = new Client(clientOptions);
    clients.set(key, client);
    return client;
  } catch (ex) {
    throw new WebinyError("Could not connect to OpenSearch.", "OPENSEARCH_CLIENT_ERROR", {
      error: ex,
      node: endpoint || node
    });
  }
};
```

> **Note on `AwsSigv4Signer` API:** The exact signature of `AwsSigv4Signer` may differ slightly between `@opensearch-project/opensearch` v2 and v3. Check the package README after installing and adjust accordingly. The v3 API uses a `getCredentials` async function; v2 accepts `credentials` directly.

---

## 5. Type Definitions

### 5.1 `src/types.ts`

Replace all `elastic-ts` imports and the `export * from "elastic-ts"` re-export. Define a local `PrimitiveValue`. Import query/sort types from the opensearch package.

```typescript
import type { Client } from "@opensearch-project/opensearch";
import type * as Types from "@opensearch-project/opensearch/api/types";
import type { Context, GenericRecord } from "@webiny/api/types.js";

// ---------------------------------------------------------------------------
// Re-export the opensearch Types namespace so consumers can import from here
// ---------------------------------------------------------------------------
export type { Types };

// ---------------------------------------------------------------------------
// Local aliases that replace elastic-ts primitives
// ---------------------------------------------------------------------------
export type PrimitiveValue = null | number | string | boolean;

// Query DSL (replaces elastic-ts Query, BoolQueryConfig)
export type OpenSearchQuery = Types.QueryDslQueryContainer;
export type OpenSearchBoolQueryBase = Types.QueryDslBoolQuery;

// Sort (replaces elastic-ts Sort, SortType, FieldSortOptions, SortOrder)
export type OpenSearchSort = Types.Sort;
// SortType = the object shape used when building a sort map (e.g. { "field.keyword": { order: "asc" } })
export type SortType = Record<string, Types.FieldSort>;
export type FieldSortOptions = Types.FieldSort;
export type SortOrder = Types.SortOrder; // "asc" | "desc"

// Search body (replaces elastic-ts SearchBody)
export type SearchBody = Types.SearchRequest["body"];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export interface OpenSearchContext extends Context {
  opensearch: Client;
}

// ---------------------------------------------------------------------------
// Bool query with required arrays (our own convention on top of the base type)
// ---------------------------------------------------------------------------
export interface OpenSearchBoolQueryConfig extends OpenSearchBoolQueryBase {
  must: OpenSearchQuery[];
  filter: OpenSearchQuery[];
  should: OpenSearchQuery[];
  must_not: OpenSearchQuery[];
}

// ---------------------------------------------------------------------------
// Operator plugin args
// ---------------------------------------------------------------------------
export type OpenSearchQueryOperator =
  | "eq"
  | "not"
  | "in"
  | "not_in"
  | "contains"
  | "not_contains"
  | "between"
  | "not_between"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | string;

export interface OpenSearchQueryBuilderArgsPlugin {
  name: string;
  path: string;
  basePath: string;
  value: any;
  keyword: boolean;
}

// ---------------------------------------------------------------------------
// Search response shapes (keep the same structure, no dependency on elastic-ts)
// ---------------------------------------------------------------------------
export interface OpenSearchSearchResponseHit<T> {
  _index: string;
  _type: string;
  _id: string;
  _score: number | null;
  _source: T;
  sort: PrimitiveValue[];
}

export interface OpenSearchSearchResponseAggregationBucket<T> {
  key: T;
  doc_count: number;
}

export interface OpenSearchSearchResponseBodyHits<T> {
  hits: OpenSearchSearchResponseHit<T>[];
  total: {
    value: number;
  };
}

export interface OpenSearchSearchResponseBodyAggregations<T> {
  [key: string]: {
    buckets: OpenSearchSearchResponseAggregationBucket<T>[];
  };
}

export interface OpenSearchSearchResponseBody<T> {
  hits: OpenSearchSearchResponseBodyHits<T>;
  aggregations: OpenSearchSearchResponseBodyAggregations<T>;
}

export interface OpenSearchSearchResponse<T = GenericRecord> {
  body: OpenSearchSearchResponseBody<T>;
}

// ---------------------------------------------------------------------------
// Index request body shapes — copied verbatim from api-elasticsearch/types.ts
// since these are our own definitions, not from elastic-ts
// ---------------------------------------------------------------------------
export interface OpenSearchIndexRequestBodyMappingsDynamicTemplate {
  [key: string]: {
    path_match?: string;
    path_unmatch?: string;
    match_mapping_type?: string;
    match?: string;
    unmatch?: string;
    mapping?: {
      numeric_detection?: boolean;
      date_detection?: boolean;
      type?: string;
      search_analyzer?: string;
      analyzer?: string;
      fields?: {
        [key: string]:
          | {
              type: string;
              ignore_above?: number;
              search_analyzer?: string;
              analyzer?: string;
              [key: string]: any;
            }
          | undefined;
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// ... (copy ElasticsearchIndexRequestBody verbatim, renamed to OpenSearchIndexRequestBody)
export interface OpenSearchIndexRequestBody {
  settings?: {
    index?: {
      number_of_shards?: number;
      number_of_replicas?: number;
      max_result_window?: number;
      total_fields?: { limit?: number };
      analysis?: { [key: string]: any };
      [key: string]: any;
    };
  };
  mappings: {
    numeric_detection?: boolean;
    dynamic_templates?: OpenSearchIndexRequestBodyMappingsDynamicTemplate[];
    properties?: {
      [key: string]: {
        analyzer?: string;
        type?: string;
        normalizer?: string;
        index?: string;
        fields?: {
          [key: string]: {
            type: string;
            ignore_above?: number;
            [key: string]: any;
          };
        };
        [key: string]: any;
      };
    };
    [key: string]: any;
  };
  aliases?: {
    [key: string]: {
      filter?: { [key: string]: any };
      is_write_index?: boolean;
      routing?: string;
      [key: string]: any;
    };
  };
}
```

> **Backward-compat note:** `api-elasticsearch` used `export * from "elastic-ts"` which leaked all elastic-ts types into consuming packages. `api-opensearch` should NOT re-export the entire opensearch types namespace — instead consumers should import from `@opensearch-project/opensearch/api/types` directly. Only export what Webiny code explicitly needs.

---

## 6. Plugin Definitions

### 6.1 `OpenSearchBodyModifierPlugin.ts`

Identical to `ElasticsearchBodyModifierPlugin.ts`, replacing `SearchBody` source:

```typescript
import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import type { SearchBody } from "~/types.js";

export interface ModifyBodyParams {
  body: SearchBody;
}

export interface ModifyBodyCallable<T extends ModifyBodyParams> {
  (params: T): void;
}

export abstract class OpenSearchBodyModifierPlugin<
  T extends ModifyBodyParams = ModifyBodyParams
> extends Plugin {
  private readonly callable?: ModifyBodyCallable<T>;

  public constructor(callable?: ModifyBodyCallable<T>) {
    super();
    this.callable = callable;
  }

  public modifyBody(params: T): void {
    if (typeof this.callable !== "function") {
      throw new WebinyError(`Missing modification for the body.`, "BODY_MODIFICATION_MISSING", {
        params
      });
    }
    this.callable(params);
  }
}
```

### 6.2 `OpenSearchSortModifierPlugin.ts`

```typescript
import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import type { OpenSearchSort } from "~/types.js";

export interface ModifySortParams {
  sort: OpenSearchSort;
}

export abstract class OpenSearchSortModifierPlugin<
  T extends ModifySortParams = ModifySortParams
> extends Plugin {
  private readonly callable?: (params: T) => void;

  public constructor(callable?: (params: T) => void) {
    super();
    this.callable = callable;
  }

  public modifySort(params: T): void {
    if (typeof this.callable !== "function") {
      throw new WebinyError(`Missing modification for the sort.`, "SORT_MODIFICATION_MISSING", {
        params
      });
    }
    this.callable(params);
  }
}
```

### 6.3 `OpenSearchFieldPlugin.ts`

Same as `ElasticsearchFieldPlugin.ts`, with `FieldSortOptions` and `SortOrder` imported from `~/types.js` (which now points at opensearch native types):

```typescript
import { Plugin } from "@webiny/plugins";
import type { FieldSortOptions, SortOrder } from "~/types.js";

// ... identical implementation, just rename the class and the static type string
export class OpenSearchFieldPlugin extends Plugin {
  public static override readonly type: string = "opensearch.fieldDefinition";
  public static readonly ALL: string = "*";
  // ... rest identical to ElasticsearchFieldPlugin
}
```

### 6.4 `OpenSearchQueryBuilderOperatorPlugin.ts`

```typescript
import { Plugin } from "@webiny/plugins";
import type { OpenSearchBoolQueryConfig, OpenSearchQueryBuilderArgsPlugin } from "~/types.js";

export abstract class OpenSearchQueryBuilderOperatorPlugin extends Plugin {
  public static override readonly type: string = "opensearch.queryBuilder.operator";

  public abstract getOperator(): string;
  public abstract apply(
    query: OpenSearchBoolQueryConfig,
    params: OpenSearchQueryBuilderArgsPlugin
  ): void;
}
```

### 6.5 Operator plugins (`src/plugins/operator/*.ts`)

All operator files (`equal.ts`, `not.ts`, `in.ts`, etc.) are copied verbatim from `api-elasticsearch/src/plugins/operator/`. Only change:

- Import from `~/types.js` (which now re-exports opensearch native types)
- Replace `ElasticsearchBoolQueryConfig` / `ElasticsearchQueryBuilderArgsPlugin` with `OpenSearchBoolQueryConfig` / `OpenSearchQueryBuilderArgsPlugin`

The query DSL object shapes are identical between Elasticsearch 7.x and OpenSearch 2.x/3.x, so no logic changes are needed.

---

## 7. Core Logic Files

These files are copied from `api-elasticsearch/src/` with the following mechanical replacements:

| Find                                  | Replace                            |
| ------------------------------------- | ---------------------------------- |
| `Elasticsearch`                       | `OpenSearch`                       |
| `elasticsearch`                       | `opensearch`                       |
| `@elastic/elasticsearch`              | `@opensearch-project/opensearch`   |
| `ElasticsearchBoolQueryConfig`        | `OpenSearchBoolQueryConfig`        |
| `ElasticsearchQueryBuilderArgsPlugin` | `OpenSearchQueryBuilderArgsPlugin` |
| `ElasticsearchFieldPlugin`            | `OpenSearchFieldPlugin`            |
| `ElasticsearchContext`                | `OpenSearchContext`                |
| `createElasticsearchClient`           | `createOpenSearchClient`           |
| `getElasticsearchOperators`           | `getOpenSearchOperators`           |

**Files to copy + rename:**

- `sort.ts` → imports `FieldSortOptions, SortOrder, SortType` from `~/types.js` (unchanged logic)
- `where.ts` → replace `ElasticsearchBoolQueryConfig` with `OpenSearchBoolQueryConfig`
- `indices.ts`, `limit.ts`, `normalize.ts`, `compression.ts`, `cursors.ts`, `operators.ts`, `sharedIndex.ts`, `indexPrefix.ts` → rename `Elasticsearch` references only
- `indexConfiguration/` → copy verbatim, rename `ElasticsearchIndexPlugin` to `OpenSearchIndexPlugin`
- `operations/OpenSearchCatHealth.ts` → use `Client` from `~/client.js`, response shape is identical
- `utils/createIndex.ts` → import `Client` from `@opensearch-project/opensearch`
- `utils/waitUntilHealthy/` → copy verbatim, rename prefixes
- `db/` → copy verbatim (DynamoDB code, no elasticsearch-specific types)

### `sort.ts` — important note

`createSort` returns `SortType` which is `Record<string, FieldSortOptions>`. After the type mapping, `FieldSortOptions = Types.FieldSort`. Verify the `Types.FieldSort` shape has `order`, `unmapped_type` fields (it does in opensearch v2/v3). No logic changes needed.

---

## 8. Index / Entry Point

### `src/index.ts`

```typescript
import WebinyError from "@webiny/error";
import type { OpenSearchContext } from "~/types.js";
import { ContextPlugin } from "@webiny/api";
import type { OpenSearchClientOptions } from "~/client.js";
import { createOpenSearchClient, Client } from "~/client.js";
import { getOpenSearchOperators } from "~/operators.js";

export * from "./indexConfiguration/index.js";
export * from "./plugins/index.js";
export * from "./sort.js";
export * from "./indices.js";
export * from "./where.js";
export * from "./limit.js";
export * from "./normalize.js";
export * from "./compression.js";
export * from "./operators.js";
export * from "./cursors.js";
export * from "./client.js";
export * from "./utils/index.js";
export * from "./operations/index.js";
export * from "./sharedIndex.js";
export * from "./indexPrefix.js";
export * from "./db/index.js";

export default (params: OpenSearchClientOptions | Client): ContextPlugin<OpenSearchContext> => {
  return new ContextPlugin<OpenSearchContext>(context => {
    if (context.opensearch) {
      throw new WebinyError(
        "OpenSearch client is already initialized.",
        "OPENSEARCH_ALREADY_INITIALIZED"
      );
    }
    context.opensearch = params instanceof Client ? params : createOpenSearchClient(params);

    context.plugins.register(getOpenSearchOperators());
  });
};
```

---

## 9. Implementation Phases

### Phase 1: Package scaffolding

- [ ] Create `packages/api-opensearch/` directory
- [ ] Create `package.json` with `@opensearch-project/opensearch` dependency (no `elastic-ts`, no `aws-elasticsearch-connector`)
- [ ] Copy `tsconfig.json` from `api-elasticsearch`, update `name`
- [ ] Run `yarn` to install dependencies
- [ ] After install, verify what type names the opensearch package exports:
  ```bash
  node -e "const t = require('@opensearch-project/opensearch/api/types'); const keys = Object.keys(t); console.log(keys.filter(k => /sort/i.test(k))); console.log(keys.filter(k => /query/i.test(k)).slice(0,10));"
  ```
  Update the type mapping table in section 2 with the verified names before writing any other code.
- [ ] Commit: `chore: scaffold api-opensearch package`

### Phase 2: Client and types

- [ ] Create `src/client.ts` using `AwsSigv4Signer` (see section 4.2)
- [ ] Create `src/types.ts` with all native-type replacements (see section 5.1)
  - Verify the actual type names from Phase 1 before writing
- [ ] Build package, fix any TypeScript errors
- [ ] Commit: `feat(api-opensearch): client factory and type definitions`

### Phase 3: Plugin definitions

- [ ] Create `src/plugins/definition/OpenSearchBodyModifierPlugin.ts`
- [ ] Create `src/plugins/definition/OpenSearchSortModifierPlugin.ts`
- [ ] Create `src/plugins/definition/OpenSearchFieldPlugin.ts`
- [ ] Create `src/plugins/definition/OpenSearchQueryBuilderOperatorPlugin.ts`
- [ ] Create `src/plugins/definition/OpenSearchQueryModifierPlugin.ts` (copy + rename)
- [ ] Create `src/plugins/definition/OpenSearchIndexPlugin.ts` (copy + rename)
- [ ] Create `src/plugins/definition/index.ts`
- [ ] Build and fix TS errors
- [ ] Commit: `feat(api-opensearch): plugin definition classes`

### Phase 4: Operator plugins

- [ ] Copy all `src/plugins/operator/*.ts` files from `api-elasticsearch`, applying the mechanical find-replace from section 7
- [ ] Create `src/plugins/operator/index.ts`
- [ ] Create `src/plugins/index.ts`
- [ ] Build and fix TS errors
- [ ] Commit: `feat(api-opensearch): operator plugins`

### Phase 5: Core logic files

- [ ] Copy and rename: `sort.ts`, `where.ts`, `operators.ts`
- [ ] Copy verbatim: `indices.ts`, `limit.ts`, `normalize.ts`, `compression.ts`, `cursors.ts`, `sharedIndex.ts`, `indexPrefix.ts`
- [ ] Copy `indexConfiguration/` (rename `Elasticsearch` → `OpenSearch` in class names and plugin type strings)
- [ ] Build and fix TS errors
- [ ] Commit: `feat(api-opensearch): core logic (sort, where, operators)`

### Phase 6: Operations and utils

- [ ] Create `src/operations/OpenSearchCatHealth.ts` (copy, rename, use `Client` from `~/client.js`)
- [ ] Create `src/operations/OpenSearchCatNodes.ts` (copy + rename)
- [ ] Copy `src/operations/stripConnectionFromException.ts`, `src/operations/types.ts`
- [ ] Create `src/operations/index.ts`
- [ ] Copy `src/utils/createIndex.ts` — update `Client` import to `@opensearch-project/opensearch`
- [ ] Copy `src/utils/waitUntilHealthy/` verbatim (no opensearch-specific types)
- [ ] Copy `src/db/` verbatim (DynamoDB only)
- [ ] Build and fix TS errors
- [ ] Commit: `feat(api-opensearch): operations and utils`

### Phase 7: Entry point and final wiring

- [ ] Create `src/index.ts` (see section 8)
- [ ] Final full build: `yarn build -p @webiny/api-opensearch 2>&1 | tail -30`
- [ ] Fix any remaining TS errors
- [ ] Run `node scripts/generateTsConfigsInPackages.js`
- [ ] Run `yarn adio` — fix any dependency issues
- [ ] Run `npx pretty-quick > /dev/null 2>&1`
- [ ] Commit: `feat: add api-opensearch package`

---

## Appendix: Key Differences from api-elasticsearch

| Area                         | api-elasticsearch                       | api-opensearch                                                    |
| ---------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| Client package               | `@elastic/elasticsearch`                | `@opensearch-project/opensearch`                                  |
| AWS signing                  | `aws-elasticsearch-connector` (patched) | Built-in `AwsSigv4Signer`                                         |
| Type source                  | `elastic-ts` + custom                   | `@opensearch-project/opensearch/api/types` + local aliases        |
| Context property             | `context.elasticsearch`                 | `context.opensearch`                                              |
| Plugin type strings          | `"elasticsearch.*"`                     | `"opensearch.*"`                                                  |
| Class name prefix            | `Elasticsearch*`                        | `OpenSearch*`                                                     |
| `PrimitiveValue`             | from `elastic-ts`                       | local `type PrimitiveValue = null \| number \| string \| boolean` |
| `export * from "elastic-ts"` | yes (leaks all types)                   | removed                                                           |
