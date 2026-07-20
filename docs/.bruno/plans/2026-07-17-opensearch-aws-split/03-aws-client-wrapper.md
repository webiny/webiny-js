# Plan 03: AWS Client Wrapper

**Package:** `@webiny/api-opensearch-aws`
**File:** `packages/api-opensearch-aws/src/createAwsOpenSearchClient.ts`
**Depends on:** 02-new-package-scaffold

## Task

Create the `createAwsOpenSearchClient` function — wraps base `createOpenSearchClient` with
AWS SigV4 signing when no auth is provided.

## Steps

1. Create `packages/api-opensearch-aws/src/createAwsOpenSearchClient.ts`

2. Implementation — extract SigV4 logic from old `client.ts` (lines 37-64):

```ts
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import {
    createOpenSearchClient,
    type OpenSearchClientOptions,
    type Client
} from "@webiny/api-opensearch";
import WebinyError from "@webiny/error";

export const createAwsOpenSearchClient = (options: OpenSearchClientOptions): Client => {
    if (options.auth) {
        return createOpenSearchClient(options);
    }

    const region = process.env.AWS_REGION;
    if (!region) {
        throw new WebinyError(
            "Missing AWS_REGION environment variable.",
            "MISSING_AWS_REGION"
        );
    }

    return createOpenSearchClient({
        ...options,
        ...AwsSigv4Signer({
            region,
            service: "es",
            getCredentials: () => {
                const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
                const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
                const sessionToken = process.env.AWS_SESSION_TOKEN;

                if (!accessKeyId || !secretAccessKey) {
                    throw new WebinyError(
                        "Missing AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY).",
                        "MISSING_AWS_CREDENTIALS"
                    );
                }

                return Promise.resolve({ accessKeyId, secretAccessKey, sessionToken });
            }
        })
    });
};
```

## Notes

- When `auth` present: passes through to base unchanged (basic auth for local/self-managed)
- When no `auth`: adds SigV4 then calls base (AWS managed OpenSearch)
- Error codes match existing ones from old `client.ts` for backwards compat

## Verification

- TypeScript compiles (types from base package resolve)
