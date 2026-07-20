# Plan 01: Base Client Cleanup

**Package:** `@webiny/api-opensearch`
**File:** `packages/api-opensearch/src/client.ts`
**Depends on:** nothing
**Parallel with:** 02-new-package-scaffold

## Task

Remove AWS SigV4 logic from `client.ts`. After this change, `createOpenSearchClient` creates
an unsigned client when no auth is provided.

## Steps

1. Open `packages/api-opensearch/src/client.ts`
2. Remove line 5: `import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";`
3. Remove the entire `if (!clientOptions.auth) { ... }` block (lines 37-64)
4. Keep everything else: client caching, error handling, `Client` re-export, types

## Expected Result

```ts
export const createOpenSearchClient = (options: OpenSearchClientOptions): Client => {
    const key = createClientKey(options);
    const existing = clients.get(key);
    if (existing) {
        return existing;
    }

    const { endpoint, node, ...rest } = options;
    const clientOptions: ClientOptions = {
        node: endpoint || node,
        ...rest
    };

    try {
        const client = new Client(clientOptions);
        clients.set(key, client);
        return client;
    } catch (ex) {
        const data = {
            error: ex,
            node: endpoint || node,
            ...rest,
            auth: undefined
        };
        console.error(data);
        throw new WebinyError("Could not connect to OpenSearch.", "OPENSEARCH_CLIENT_ERROR", data);
    }
};
```

## Verification

- `yarn build -p @webiny/api-opensearch 2>&1 | tail -30` — must compile
- No other files in `api-opensearch` change
