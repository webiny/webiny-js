# Plan 04: AWS Factory DI Feature

**Package:** `@webiny/api-opensearch-aws`
**Dir:** `packages/api-opensearch-aws/src/features/AwsOpenSearchClientFactory/`
**Depends on:** 03-aws-client-wrapper

## Task

Create `AwsOpenSearchClientFactory` implementation and its DI feature. This replaces the base
`OpenSearchClientFactory` binding when registered, so on-demand client creation uses SigV4.

## Steps

1. Create `packages/api-opensearch-aws/src/features/AwsOpenSearchClientFactory/AwsOpenSearchClientFactory.ts`:

```ts
import { OpenSearchClientFactory } from "@webiny/api-opensearch/features/OpenSearchClientFactory/abstraction.js";
import { type Client, type OpenSearchClientOptions } from "@webiny/api-opensearch";
import { createAwsOpenSearchClient } from "~/createAwsOpenSearchClient.js";

class AwsOpenSearchClientFactoryImpl implements OpenSearchClientFactory.Interface {
    public getClient(params: OpenSearchClientOptions): Client {
        if (!params.endpoint && !params.node && !params.nodes) {
            throw new Error(
                "OpenSearch client requires an endpoint, nodes or node to be specified."
            );
        }
        return createAwsOpenSearchClient(params);
    }
}

export const AwsOpenSearchClientFactory = OpenSearchClientFactory.createImplementation({
    implementation: AwsOpenSearchClientFactoryImpl,
    dependencies: []
});
```

2. Create `packages/api-opensearch-aws/src/features/AwsOpenSearchClientFactory/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api/index.js";
import { AwsOpenSearchClientFactory } from "./AwsOpenSearchClientFactory.js";

export const AwsOpenSearchClientFactoryFeature = createFeature({
    name: "opensearch.aws.clientFactory",
    register(container) {
        container.register(AwsOpenSearchClientFactory).inSingletonScope();
    }
});
```

## Notes

- Implementation mirrors base `OpenSearchClientFactory` (same validation, same interface)
- Only difference: calls `createAwsOpenSearchClient` instead of `createOpenSearchClient`
- Feature name `opensearch.aws.clientFactory` distinguishes from base `opensearch.internal.clientFactory`
- Check how base factory uses `createImplementation` — follow same pattern exactly.
  If base uses `OpenSearchClientFactory.createImplementation()`, do the same.
  If base just instantiates directly, match that.

## Verification

- TypeScript compiles
- Feature follows same DI pattern as base `OpenSearchClientFactoryFeature`
