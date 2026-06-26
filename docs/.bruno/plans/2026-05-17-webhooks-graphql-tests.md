# Webhooks GraphQL Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add end-to-end GraphQL integration tests for all webhooks resolvers (CRUD, deliveries, events, trigger), and fix list resolver bugs discovered during planning.

**Architecture:** Create a `useGraphQLHandler` test helper (API Gateway-style handler with convenience methods), define all GraphQL query/mutation strings, then write tests against each resolver. Fix the list resolvers that incorrectly use `Response` instead of `ListResponse`.

**Tech Stack:** Vitest, `@webiny/handler-aws` (createHandler), existing DynamoDB test presets.

---

## File Map

### New Files (tests)
| File | Responsibility |
|------|---------------|
| `packages/webhooks/__tests__/helpers/useGraphQLHandler.ts` | API Gateway-style handler with `invoke()` + convenience methods |
| `packages/webhooks/__tests__/graphql/webhookQueries.ts` | GraphQL strings for webhook CRUD operations |
| `packages/webhooks/__tests__/graphql/deliveryQueries.ts` | GraphQL strings for delivery operations |
| `packages/webhooks/__tests__/graphql/eventQueries.ts` | GraphQL strings for available events |
| `packages/webhooks/__tests__/graphql/triggerQueries.ts` | GraphQL strings for trigger mutation |
| `packages/webhooks/__tests__/graphql/webhookCrud.test.ts` | CRUD resolver tests (~14 tests) |
| `packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts` | Delivery resolver tests (~5 tests) |
| `packages/webhooks/__tests__/graphql/webhookEvents.test.ts` | Event resolver tests (~2 tests) |
| `packages/webhooks/__tests__/graphql/webhookTrigger.test.ts` | Trigger resolver tests (~3 tests) |

### Modified Files (bug fixes)
| File | Change |
|------|--------|
| `packages/webhooks/src/api/graphql/WebhookCrudSchema.ts` | `listWebhooks`: `Response` → `ListResponse`, `ErrorResponse` → `ListErrorResponse` |
| `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts` | `listWebhookDeliveries`: `Response` → `ListResponse`, `ErrorResponse` → `ListErrorResponse` |

---

### Task 1: Create the GraphQL handler helper

**Files:**
- Create: `packages/webhooks/__tests__/helpers/useGraphQLHandler.ts`

- [ ] **Step 1: Write the GraphQL handler helper**

This adapts the existing `useHandler` pattern to create an API Gateway-style handler that accepts GraphQL POST requests. It mirrors `packages/api-mailer/__tests__/graphQLHandler.ts`.

```ts
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { createIdentity, createPermissions } from "./helpers.js";
import type { PermissionsArg } from "./helpers.js";
import { createHandler } from "@webiny/handler-aws";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { Extension } from "~/api/Extension.js";
import { NoopTaskServiceFeature, noopTaskService } from "./NoopTaskService.js";
import { TestWebhookProviderFeature } from "./TestWebhookProvider.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface UseGraphQLHandlerParams {
    plugins?: PluginCollection;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
}

interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params?: UseGraphQLHandlerParams) => {
    const { plugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
            }),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                permissions: createPermissions(params?.permissions),
                identity: createIdentity(params?.identity)
            }),
            createHeadlessCmsContext(),
            createHeadlessCmsGraphQL(),
            graphQLHandlerPlugins(),
            createRegisterExtensionPlugin(context => {
                NoopTaskServiceFeature.register(context.container);
                TestWebhookProviderFeature.register(context.container);
                Extension.register(context.container);
            }),
            ...plugins
        ],
        debug: false
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams): Promise<[T, any]> => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body)
            } as unknown as APIGatewayEvent,
            {} as unknown as LambdaContext
        );
        return [JSON.parse(response.body || "{}"), response];
    };

    return {
        invoke,
        noopTaskService
    };
};
```

- [ ] **Step 2: Verify the file compiles**

Run: `yarn build -p @webiny/webhooks 2>&1 | tail -20`

(If the package name doesn't match, use `yarn check -p @webiny/webhooks` or just proceed to the next task — the tests will validate compilation.)

---

### Task 2: Create GraphQL query/mutation strings

**Files:**
- Create: `packages/webhooks/__tests__/graphql/webhookQueries.ts`
- Create: `packages/webhooks/__tests__/graphql/deliveryQueries.ts`
- Create: `packages/webhooks/__tests__/graphql/eventQueries.ts`
- Create: `packages/webhooks/__tests__/graphql/triggerQueries.ts`

- [ ] **Step 1: Create webhook CRUD query strings**

File: `packages/webhooks/__tests__/graphql/webhookQueries.ts`

```ts
const ERROR = /* GraphQL */ `
    error {
        message
        code
        data
    }
`;

const WEBHOOK_FIELDS = /* GraphQL */ `
    id
    name
    slug
    endpointUrl
    description
    enabled
    events
    signingSecret
    createdOn
    modifiedOn
`;

export const CREATE_WEBHOOK = /* GraphQL */ `
    mutation CreateWebhook($input: CreateWebhookInput!) {
        webhooks {
            createWebhook(input: $input) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const UPDATE_WEBHOOK = /* GraphQL */ `
    mutation UpdateWebhook($id: ID!, $input: UpdateWebhookInput!) {
        webhooks {
            updateWebhook(id: $id, input: $input) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const DELETE_WEBHOOK = /* GraphQL */ `
    mutation DeleteWebhook($id: ID!) {
        webhooks {
            deleteWebhook(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const GET_WEBHOOK = /* GraphQL */ `
    query GetWebhook($id: ID!) {
        webhooks {
            getWebhook(id: $id) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const LIST_WEBHOOKS = /* GraphQL */ `
    query ListWebhooks($where: ListWebhooksWhereInput, $limit: Int, $after: String) {
        webhooks {
            listWebhooks(where: $where, limit: $limit, after: $after) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                ${ERROR}
            }
        }
    }
`;
```

- [ ] **Step 2: Create delivery query strings**

File: `packages/webhooks/__tests__/graphql/deliveryQueries.ts`

```ts
const ERROR = /* GraphQL */ `
    error {
        message
        code
        data
    }
`;

const DELIVERY_FIELDS = /* GraphQL */ `
    id
    webhookId
    backgroundTaskId
    eventType
    status
    payload
    requestHeaders
    responseTime
    responseStatus
    responseBody
    createdOn
`;

export const LIST_WEBHOOK_DELIVERIES = /* GraphQL */ `
    query ListWebhookDeliveries($webhookId: ID!, $limit: Int, $after: String) {
        webhooks {
            listWebhookDeliveries(webhookId: $webhookId, limit: $limit, after: $after) {
                data {
                    ${DELIVERY_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                ${ERROR}
            }
        }
    }
`;

export const GET_WEBHOOK_DELIVERY = /* GraphQL */ `
    query GetWebhookDelivery($id: ID!) {
        webhooks {
            getWebhookDelivery(id: $id) {
                data {
                    ${DELIVERY_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const RESEND_WEBHOOK_DELIVERY = /* GraphQL */ `
    mutation ResendWebhookDelivery($id: ID!) {
        webhooks {
            resendWebhookDelivery(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
```

- [ ] **Step 3: Create event query strings**

File: `packages/webhooks/__tests__/graphql/eventQueries.ts`

```ts
export const LIST_AVAILABLE_WEBHOOK_EVENTS = /* GraphQL */ `
    query ListAvailableWebhookEvents {
        webhooks {
            listAvailableWebhookEvents {
                data {
                    app
                    entity
                    eventName
                    label
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
```

- [ ] **Step 4: Create trigger mutation strings**

File: `packages/webhooks/__tests__/graphql/triggerQueries.ts`

```ts
const DELIVERY_FIELDS = /* GraphQL */ `
    id
    webhookId
    backgroundTaskId
    eventType
    status
    payload
    requestHeaders
    responseTime
    responseStatus
    responseBody
    createdOn
`;

export const TRIGGER_WEBHOOK = /* GraphQL */ `
    mutation TriggerWebhook($id: ID!, $payload: JSON!) {
        webhooks {
            triggerWebhook(id: $id, payload: $payload) {
                data {
                    ${DELIVERY_FIELDS}
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
```

- [ ] **Step 5: Commit infrastructure files**

```bash
git add packages/webhooks/__tests__/helpers/useGraphQLHandler.ts
git add packages/webhooks/__tests__/graphql/
git commit -m "test(webhooks): add GraphQL test infrastructure — handler helper + query strings"
```

---

### Task 3: Write webhook CRUD GraphQL tests + fix list resolver bug

**Files:**
- Create: `packages/webhooks/__tests__/graphql/webhookCrud.test.ts`
- Modify: `packages/webhooks/src/api/graphql/WebhookCrudSchema.ts` (fix listWebhooks resolver)

- [ ] **Step 1: Write the CRUD test file**

File: `packages/webhooks/__tests__/graphql/webhookCrud.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import {
    CREATE_WEBHOOK,
    GET_WEBHOOK,
    LIST_WEBHOOKS,
    UPDATE_WEBHOOK,
    DELETE_WEBHOOK
} from "./webhookQueries.js";

const VALID_INPUT = {
    name: "Shop Sync",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook CRUD GraphQL", () => {
    const handler = useGraphQLHandler();

    it("should create a webhook via GraphQL", async () => {
        const [response] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });

        const result = response.data.webhooks.createWebhook;
        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            name: "Shop Sync",
            slug: "shop-sync",
            endpointUrl: "https://example.com/hook",
            enabled: false,
            events: ["cms.entry.product.published"]
        });
        expect(result.data.id).toEqual(expect.any(String));
        expect(result.data.signingSecret).toEqual(expect.any(String));
    });

    it("should get a webhook by id via GraphQL", async () => {
        const [createResponse] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK,
                variables: { id }
            }
        });

        const result = response.data.webhooks.getWebhook;
        expect(result.error).toBeNull();
        expect(result.data.id).toBe(id);
        expect(result.data.name).toBe("Shop Sync");
    });

    it("should return error when getting non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK,
                variables: { id: "non-existent-id" }
            }
        });

        const result = response.data.webhooks.getWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should list webhooks via GraphQL", async () => {
        const [create1] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Webhook A"
                    }
                }
            }
        });
        expect(create1.data.webhooks.createWebhook.error).toBeNull();

        const [create2] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Webhook B",
                        slug: "webhook-b"
                    }
                }
            }
        });
        expect(create2.data.webhooks.createWebhook.error).toBeNull();

        const [response] = await handler.invoke({
            body: { query: LIST_WEBHOOKS }
        });

        const result = response.data.webhooks.listWebhooks;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 2
        });
    });

    it("should filter webhooks by enabled status", async () => {
        const [create1] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Enabled Hook",
                        enabled: true
                    }
                }
            }
        });
        expect(create1.data.webhooks.createWebhook.error).toBeNull();

        const [create2] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Disabled Hook",
                        slug: "disabled-hook",
                        enabled: false
                    }
                }
            }
        });
        expect(create2.data.webhooks.createWebhook.error).toBeNull();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOKS,
                variables: { where: { enabled: true } }
            }
        });

        const result = response.data.webhooks.listWebhooks;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Enabled Hook");
    });

    it("should update a webhook via GraphQL", async () => {
        const [createResponse] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: UPDATE_WEBHOOK,
                variables: {
                    id,
                    input: {
                        name: "Updated Name",
                        enabled: true
                    }
                }
            }
        });

        const result = response.data.webhooks.updateWebhook;
        expect(result.error).toBeNull();
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.enabled).toBe(true);
        expect(result.data.endpointUrl).toBe("https://example.com/hook");
    });

    it("should return error when updating non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: UPDATE_WEBHOOK,
                variables: {
                    id: "non-existent-id",
                    input: { name: "Nope" }
                }
            }
        });

        const result = response.data.webhooks.updateWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should delete a webhook via GraphQL", async () => {
        const [createResponse] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const [deleteResponse] = await handler.invoke({
            body: {
                query: DELETE_WEBHOOK,
                variables: { id }
            }
        });

        expect(deleteResponse.data.webhooks.deleteWebhook.data).toBe(true);
        expect(deleteResponse.data.webhooks.deleteWebhook.error).toBeNull();

        const [getResponse] = await handler.invoke({
            body: {
                query: GET_WEBHOOK,
                variables: { id }
            }
        });

        expect(getResponse.data.webhooks.getWebhook.data).toBeNull();
        expect(getResponse.data.webhooks.getWebhook.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should return error when deleting non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: DELETE_WEBHOOK,
                variables: { id: "non-existent-id" }
            }
        });

        const result = response.data.webhooks.deleteWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should reject duplicate slug via GraphQL", async () => {
        const [first] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        expect(first.data.webhooks.createWebhook.error).toBeNull();

        const [second] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });

        const result = second.data.webhooks.createWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
        expect(result.error.message).toContain("already taken");
    });

    it("should reject non-HTTPS endpoint URL via GraphQL", async () => {
        const [response] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        endpointUrl: "http://external-server.com/hook"
                    }
                }
            }
        });

        const result = response.data.webhooks.createWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should fail create without write permission", async () => {
        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });

        const result = response.data.webhooks.createWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should fail list without read permission", async () => {
        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "w" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: { query: LIST_WEBHOOKS }
        });

        const result = response.data.webhooks.listWebhooks;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should fail delete without delete permission", async () => {
        const createHandler = useGraphQLHandler();
        const [createResponse] = await createHandler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "rw" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: {
                query: DELETE_WEBHOOK,
                variables: { id }
            }
        });

        const result = response.data.webhooks.deleteWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
```

- [ ] **Step 2: Run the tests — expect list tests to fail**

Run: `yarn test packages/webhooks --testPathPattern=graphql/webhookCrud 2>&1 | tail -50`

The `listWebhooks` and `filter by enabled` tests should fail because the resolver uses `new Response(result.value)` which produces `{ data: { items: [...], meta: {...} }, error: null }` instead of the expected `{ data: [...], meta: {...}, error: null }`.

- [ ] **Step 3: Fix the listWebhooks resolver**

File: `packages/webhooks/src/api/graphql/WebhookCrudSchema.ts`

Add `ListResponse` and `ListErrorResponse` to imports:
```ts
import { ListResponse } from "@webiny/handler-graphql";
import { ListErrorResponse } from "@webiny/handler-graphql";
```

Replace the listWebhooks resolver body:
```ts
builder.addResolver<IListWebhooksInput>({
    path: "WebhookQuery.listWebhooks",
    dependencies: [ListWebhooksUseCase],
    resolver: (listWebhooks: ListWebhooksUseCase.Interface) => {
        return async ({ args }) => {
            const result = await listWebhooks.execute(args);
            if (result.isFail()) {
                return new ListErrorResponse(result.error);
            }
            return new ListResponse(result.value.items, result.value.meta);
        };
    }
});
```

- [ ] **Step 4: Run the tests — all CRUD tests should pass**

Run: `yarn test packages/webhooks --testPathPattern=graphql/webhookCrud 2>&1 | tail -50`

Expected: All 14 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/__tests__/graphql/webhookCrud.test.ts
git add packages/webhooks/src/api/graphql/WebhookCrudSchema.ts
git commit -m "test(webhooks): add webhook CRUD GraphQL tests + fix list resolver (Response → ListResponse)"
```

---

### Task 4: Write delivery GraphQL tests + fix delivery list resolver

**Files:**
- Create: `packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts`
- Modify: `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts` (fix list resolver)

- [ ] **Step 1: Write the delivery test file**

File: `packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { TRIGGER_WEBHOOK } from "./triggerQueries.js";
import {
    LIST_WEBHOOK_DELIVERIES,
    GET_WEBHOOK_DELIVERY,
    RESEND_WEBHOOK_DELIVERY
} from "./deliveryQueries.js";

const VALID_INPUT = {
    name: "Delivery Test Hook",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook Deliveries GraphQL", () => {
    const handler = useGraphQLHandler();

    const createWebhookAndTrigger = async () => {
        const [createRes] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const [triggerRes] = await handler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: webhookId,
                    payload: { test: true }
                }
            }
        });
        const delivery = triggerRes.data.webhooks.triggerWebhook.data;

        return { webhookId, delivery };
    };

    it("should list deliveries for a webhook", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { webhookId }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].webhookId).toBe(webhookId);
        expect(result.data[0].status).toBe("pending");
        expect(result.meta.totalCount).toBe(1);
    });

    it("should return empty list for webhook with no deliveries", async () => {
        const [createRes] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: { ...VALID_INPUT, slug: "no-deliveries-hook" } }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { webhookId }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(0);
        expect(result.meta.totalCount).toBe(0);
    });

    it("should get a single delivery by id", async () => {
        const { delivery } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK_DELIVERY,
                variables: { id: delivery.id }
            }
        });

        const result = response.data.webhooks.getWebhookDelivery;
        expect(result.error).toBeNull();
        expect(result.data.id).toBe(delivery.id);
        expect(result.data.eventType).toBe("test.trigger");
        expect(result.data.status).toBe("pending");
    });

    it("should return error for non-existent delivery", async () => {
        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK_DELIVERY,
                variables: { id: "non-existent-id" }
            }
        });

        const result = response.data.webhooks.getWebhookDelivery;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_DELIVERY_NOT_FOUND");
    });

    it("should resend a delivery", async () => {
        const { delivery } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: RESEND_WEBHOOK_DELIVERY,
                variables: { id: delivery.id }
            }
        });

        const result = response.data.webhooks.resendWebhookDelivery;
        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
    });
});
```

- [ ] **Step 2: Fix the listWebhookDeliveries resolver**

File: `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts`

Add `ListResponse` and `ListErrorResponse` to imports:
```ts
import { ListResponse } from "@webiny/handler-graphql";
import { ListErrorResponse } from "@webiny/handler-graphql";
```

Replace the listWebhookDeliveries resolver body:
```ts
builder.addResolver<IListDeliveriesArgs>({
    path: "WebhookQuery.listWebhookDeliveries",
    dependencies: [ListWebhookDeliveriesUseCase],
    resolver: (listDeliveries: ListWebhookDeliveriesUseCase.Interface) => {
        return async ({ args }) => {
            const result = await listDeliveries.execute({
                where: { webhookId: args.webhookId },
                limit: args.limit ?? undefined,
                after: args.after ?? undefined
            });
            if (result.isFail()) {
                return new ListErrorResponse(result.error);
            }
            return new ListResponse(result.value.items, result.value.meta);
        };
    }
});
```

- [ ] **Step 3: Run the delivery tests**

Run: `yarn test packages/webhooks --testPathPattern=graphql/webhookDeliveries 2>&1 | tail -50`

Expected: All 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts
git add packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts
git commit -m "test(webhooks): add delivery GraphQL tests + fix delivery list resolver"
```

---

### Task 5: Write event and trigger GraphQL tests

**Files:**
- Create: `packages/webhooks/__tests__/graphql/webhookEvents.test.ts`
- Create: `packages/webhooks/__tests__/graphql/webhookTrigger.test.ts`

- [ ] **Step 1: Write event tests**

File: `packages/webhooks/__tests__/graphql/webhookEvents.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { LIST_AVAILABLE_WEBHOOK_EVENTS } from "./eventQueries.js";

describe("Webhook Events GraphQL", () => {
    it("should list available webhook events", async () => {
        const handler = useGraphQLHandler();

        const [response] = await handler.invoke({
            body: { query: LIST_AVAILABLE_WEBHOOK_EVENTS }
        });

        const result = response.data.webhooks.listAvailableWebhookEvents;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(3);
        expect(result.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    app: "cms",
                    entity: "product",
                    eventName: "cms.entry.product.created"
                }),
                expect.objectContaining({
                    app: "cms",
                    entity: "product",
                    eventName: "cms.entry.product.published"
                }),
                expect.objectContaining({
                    app: "wb",
                    entity: "page",
                    eventName: "wb.page.published"
                })
            ])
        );
    });

    it("should fail without read permission", async () => {
        const handler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "w" }]
        });

        const [response] = await handler.invoke({
            body: { query: LIST_AVAILABLE_WEBHOOK_EVENTS }
        });

        const result = response.data.webhooks.listAvailableWebhookEvents;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
```

- [ ] **Step 2: Write trigger tests**

File: `packages/webhooks/__tests__/graphql/webhookTrigger.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { TRIGGER_WEBHOOK } from "./triggerQueries.js";

const VALID_INPUT = {
    name: "Trigger Test Hook",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook Trigger GraphQL", () => {
    const handler = useGraphQLHandler();

    it("should trigger a webhook and create a delivery", async () => {
        const [createRes] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: webhookId,
                    payload: { test: "data" }
                }
            }
        });

        const result = response.data.webhooks.triggerWebhook;
        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            webhookId,
            eventType: "test.trigger",
            status: "pending"
        });
        expect(result.data.id).toEqual(expect.any(String));

        expect(handler.noopTaskService.triggered).toHaveLength(1);
    });

    it("should return error for non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: "non-existent-id",
                    payload: { test: true }
                }
            }
        });

        const result = response.data.webhooks.triggerWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should fail without write permission", async () => {
        const createHandler = useGraphQLHandler();
        const [createRes] = await createHandler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: webhookId,
                    payload: { test: true }
                }
            }
        });

        const result = response.data.webhooks.triggerWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
```

- [ ] **Step 3: Run all event + trigger tests**

Run: `yarn test packages/webhooks --testPathPattern="graphql/(webhookEvents|webhookTrigger)" 2>&1 | tail -50`

Expected: All 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/webhooks/__tests__/graphql/webhookEvents.test.ts
git add packages/webhooks/__tests__/graphql/webhookTrigger.test.ts
git commit -m "test(webhooks): add event listing and trigger GraphQL tests"
```

---

### Task 6: Run full test suite and validate

- [ ] **Step 1: Run all webhooks tests together**

Run: `yarn test packages/webhooks 2>&1 | tail -50`

Expected: ~84 tests pass (60 existing + ~24 new GraphQL tests). No regressions in existing unit/integration tests.

- [ ] **Step 2: Type-check the package**

Run: `yarn check -p @webiny/webhooks 2>&1 | tail -20`

Expected: No type errors.

- [ ] **Step 3: Run pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 4: Final commit if pre-commit changed anything**

```bash
git commit -m "chore(webhooks): post-GraphQL-tests lint and format fixes"
```
