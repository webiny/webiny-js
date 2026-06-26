# Webhook Deliveries Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global `/webhooks/deliveries` admin page that lists all webhook deliveries with filters (app, entity, event, status) and inline accordion expansion showing full delivery detail.

**Architecture:** Three-layer change — API GraphQL schema drops the required `webhookId` arg and gains a `where` input; the SDK and admin feature layer propagate the change; a new `WebhookDeliveriesPage` presentation module uses existing infrastructure with a new presenter, while a shared `DeliveryDetailContent` component makes the detail view reusable across accordion, drawer, and future dialog contexts.

**Tech Stack:** TypeScript, React, MobX (`makeAutoObservable`), Vitest, `@webiny/admin-ui` (`Accordion`, `Select`, `MultiSelect`, `Tag`, `Button`, `Skeleton`), `@webiny/feature/admin` (DI), existing `ListPresenter` abstraction.

**Spec:** `docs/superpowers/specs/2026-05-20-webhook-deliveries-page-design.md`

---

## File Map

### Modified files
- `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts` — add `responseHeaders`, `WebhookDeliveryListWhereInput`, remove required `webhookId`, update resolver
- `packages/webhooks/__tests__/graphql/deliveryQueries.ts` — update `LIST_WEBHOOK_DELIVERIES` query, add `responseHeaders`
- `packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts` — update existing + add filter tests
- `packages/sdk/src/methods/webhooks/webhooksTypes.ts` — add `responseHeaders: unknown | null` to `WebhookDelivery`
- `packages/sdk/src/methods/webhooks/schemas.ts` — update `listWebhookDeliveriesSchema` to use `where`
- `packages/sdk/src/methods/webhooks/listWebhookDeliveries.ts` — update params, query, variables
- `packages/webhooks/__tests__/sdk/webhooksSdk.test.ts` — update `listWebhookDeliveries` call sites
- `packages/webhooks/src/admin/features/listWebhookDeliveries/abstractions.ts` — update `ListWebhookDeliveriesParams` to use `where`
- `packages/webhooks/src/admin/features/listWebhookDeliveries/ListWebhookDeliveriesGateway.ts` — pass `where` to SDK
- `packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts` — replace `webhookId` constructor arg with `where`
- `packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesPresenter.ts` — update `init()` to pass `{ webhookId_eq }`
- `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetail.tsx` — delegate body to `DeliveryDetailContent`
- `packages/webhooks/src/admin/routes.ts` — add `Deliveries` route
- `packages/webhooks/src/admin/WebhookRoutes.tsx` — register `Deliveries` route before `Form`, add menu item

### New files
- `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx` — reusable detail body
- `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx` — accordion wrapper
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/abstractions.ts`
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/WebhookDeliveriesPagePresenter.ts`
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/WebhookDeliveriesPageDataSource.ts`
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/feature.ts`
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/index.ts`
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/WebhookDeliveriesPage.tsx`
- `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/DeliveryFilters.tsx`

---

## Task 1: Update GraphQL schema — `responseHeaders`, `where` filter, remove required `webhookId`

**Files:**
- Modify: `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts`
- Modify: `packages/webhooks/__tests__/graphql/deliveryQueries.ts`
- Modify: `packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts`

- [ ] **Step 1.1: Update the test query helper to use the new schema shape**

In `packages/webhooks/__tests__/graphql/deliveryQueries.ts`, replace the entire file:

```typescript
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
    responseHeaders
    responseTime
    responseStatus
    responseBody
    createdOn
`;

export const LIST_WEBHOOK_DELIVERIES = /* GraphQL */ `
    query ListWebhookDeliveries($where: WebhookDeliveryListWhereInput, $limit: Int, $after: String) {
        webhooks {
            listWebhookDeliveries(where: $where, limit: $limit, after: $after) {
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

- [ ] **Step 1.2: Update existing tests to use the new query shape and add filter tests**

In `packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts`, replace the entire file:

```typescript
import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { TRIGGER_WEBHOOK } from "./triggerQueries.js";
import { LIST_WEBHOOK_DELIVERIES } from "./deliveryQueries.js";
import { GET_WEBHOOK_DELIVERY } from "./deliveryQueries.js";
import { RESEND_WEBHOOK_DELIVERY } from "./deliveryQueries.js";

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

    it("should list all deliveries without filter", async () => {
        await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: {}
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data.length).toBeGreaterThanOrEqual(1);
        expect(result.meta.totalCount).toBeGreaterThanOrEqual(1);
    });

    it("should filter deliveries by webhookId_eq", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { where: { webhookId_eq: webhookId } }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].webhookId).toBe(webhookId);
    });

    it("should filter deliveries by status_in", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { where: { webhookId_eq: webhookId, status_in: ["pending"] } }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe("pending");
    });

    it("should return empty list when status_in does not match", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { where: { webhookId_eq: webhookId, status_in: ["delivered"] } }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(0);
    });

    it("should filter deliveries by eventType_in", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { where: { webhookId_eq: webhookId, eventType_in: ["webhook.test"] } }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
    });

    it("should return responseHeaders field (null for test deliveries)", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { where: { webhookId_eq: webhookId } }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data[0]).toHaveProperty("responseHeaders");
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
                variables: { where: { webhookId_eq: webhookId } }
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
        expect(result.data.eventType).toBe("webhook.test");
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

- [ ] **Step 1.3: Run the tests — expect failures** (schema not updated yet)

```bash
yarn test packages/webhooks 2>&1 | grep -E "FAIL|PASS|Error" | tail -20
```

Expected: test failures on the `LIST_WEBHOOK_DELIVERIES` tests because the schema still requires `webhookId: ID!`.

- [ ] **Step 1.4: Update the GraphQL schema**

Replace the entire `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts`:

```typescript
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { ListResponse } from "@webiny/handler-graphql";
import { ListErrorResponse } from "@webiny/handler-graphql";
import { ListWebhookDeliveriesUseCase } from "~/api/features/ListWebhookDeliveries/abstractions.js";
import { GetWebhookDeliveryUseCase } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/api/features/ResendWebhookDelivery/abstractions.js";

interface IListDeliveriesArgs {
    where?: {
        webhookId_eq?: string;
        eventType_in?: string[];
        status_in?: string[];
    };
    limit?: number;
    after?: string;
}

interface IIdArgs {
    id: string;
}

class WebhookDeliverySchema_ implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookDelivery {
                id: ID!
                webhookId: ID!
                backgroundTaskId: String
                eventType: String!
                status: String!
                payload: JSON
                requestHeaders: JSON
                responseHeaders: JSON
                responseTime: Int
                responseStatus: Int
                responseBody: String
                expiresAt: DateTime
                createdOn: DateTime
            }

            input WebhookDeliveryListWhereInput {
                webhookId_eq: ID
                eventType_in: [String!]
                status_in: [String!]
            }

            type WebhookDeliveryResponse {
                data: WebhookDelivery
                error: WebhookError
            }

            type WebhookDeliveryListResponse {
                data: [WebhookDelivery!]
                meta: WebhookListMeta
                error: WebhookError
            }

            extend type WebhookQuery {
                listWebhookDeliveries(
                    where: WebhookDeliveryListWhereInput
                    limit: Int
                    after: String
                ): WebhookDeliveryListResponse!
                getWebhookDelivery(id: ID!): WebhookDeliveryResponse!
            }

            extend type WebhookMutation {
                resendWebhookDelivery(id: ID!): BooleanResponse!
            }
        `);

        builder.addResolver<IListDeliveriesArgs>({
            path: "WebhookQuery.listWebhookDeliveries",
            dependencies: [ListWebhookDeliveriesUseCase],
            resolver: (listDeliveries: ListWebhookDeliveriesUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listDeliveries.execute({
                        where: args.where ?? undefined,
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

        builder.addResolver<IIdArgs>({
            path: "WebhookQuery.getWebhookDelivery",
            dependencies: [GetWebhookDeliveryUseCase],
            resolver: (getDelivery: GetWebhookDeliveryUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getDelivery.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "WebhookMutation.resendWebhookDelivery",
            dependencies: [ResendWebhookDeliveryUseCase],
            resolver: (resend: ResendWebhookDeliveryUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await resend.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export const WebhookDeliverySchema = GraphQLSchemaFactory.createImplementation({
    implementation: WebhookDeliverySchema_,
    dependencies: []
});
```

- [ ] **Step 1.5: Run the tests — expect pass**

```bash
yarn test packages/webhooks 2>&1 | grep -E "FAIL|PASS|✓|×" | tail -20
```

Expected: all delivery-related tests pass.

- [ ] **Step 1.6: Commit**

```bash
git add packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts \
        packages/webhooks/__tests__/graphql/deliveryQueries.ts \
        packages/webhooks/__tests__/graphql/webhookDeliveries.test.ts
git commit -m "feat(webhooks): add responseHeaders, WebhookDeliveryListWhereInput, remove required webhookId from listWebhookDeliveries"
```

---

## Task 2: Update SDK — `listWebhookDeliveries` params, query, types

**Files:**
- Modify: `packages/sdk/src/methods/webhooks/webhooksTypes.ts`
- Modify: `packages/sdk/src/methods/webhooks/schemas.ts`
- Modify: `packages/sdk/src/methods/webhooks/listWebhookDeliveries.ts`
- Modify: `packages/webhooks/__tests__/sdk/webhooksSdk.test.ts`

- [ ] **Step 2.1: Update SDK test call sites to use `where` param**

In `packages/webhooks/__tests__/sdk/webhooksSdk.test.ts`, find all calls to `sdk.webhooks.listWebhookDeliveries({ webhookId })` and replace with `sdk.webhooks.listWebhookDeliveries({ where: { webhookId_eq: webhookId } })`.

There are two call sites (approximately lines 299 and 317). Replace both:

```typescript
// Before:
const result = await sdk.webhooks.listWebhookDeliveries({
    webhookId
});

// After:
const result = await sdk.webhooks.listWebhookDeliveries({
    where: { webhookId_eq: webhookId }
});
```

```typescript
// Before (second call):
const result = await sdk.webhooks.listWebhookDeliveries({
    webhookId: created.value.id
});

// After:
const result = await sdk.webhooks.listWebhookDeliveries({
    where: { webhookId_eq: created.value.id }
});
```

- [ ] **Step 2.2: Run tests — expect failures** (SDK types not updated yet)

```bash
yarn test packages/webhooks 2>&1 | grep -E "FAIL|PASS|TypeError|Error" | tail -10
```

Expected: TypeScript or runtime failures on the SDK call sites.

- [ ] **Step 2.3: Add `responseHeaders` to the SDK `WebhookDelivery` type**

In `packages/sdk/src/methods/webhooks/webhooksTypes.ts`, add `responseHeaders` after `requestHeaders`:

```typescript
export interface WebhookDelivery {
    id: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: string;
    payload: unknown;
    requestHeaders: unknown;
    responseHeaders: unknown | null;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt: string | null;
    createdOn: string | null;
}
```

- [ ] **Step 2.4: Update `listWebhookDeliveriesSchema` in `schemas.ts`**

In `packages/sdk/src/methods/webhooks/schemas.ts`, replace the `listWebhookDeliveriesSchema`:

```typescript
export const listWebhookDeliveriesSchema = z.object({
    where: z
        .object({
            webhookId_eq: z.string().optional(),
            eventType_in: z.array(z.string()).optional(),
            status_in: z.array(z.string()).optional()
        })
        .optional(),
    limit: z.number().int().positive().optional(),
    after: z.string().optional()
});
```

- [ ] **Step 2.5: Update `listWebhookDeliveries.ts` — params interface, query, and variables**

Replace the entire `packages/sdk/src/methods/webhooks/listWebhookDeliveries.ts`:

```typescript
import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { listWebhookDeliveriesSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ListWebhookDeliveriesWhere {
    webhookId_eq?: string;
    eventType_in?: string[];
    status_in?: string[];
}

export interface ListWebhookDeliveriesParams {
    where?: ListWebhookDeliveriesWhere;
    limit?: number;
    after?: string;
}

export interface ListWebhookDeliveriesResult {
    data: WebhookDelivery[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export const listWebhookDeliveries = createMethod(
    listWebhookDeliveriesSchema,
    async (config, fetchFn, { where, limit, after }) => {
        const query = `
        query ListWebhookDeliveries($where: WebhookDeliveryListWhereInput, $limit: Int, $after: String) {
            webhooks {
                listWebhookDeliveries(where: $where, limit: $limit, after: $after) {
                    data {
                        id
                        webhookId
                        backgroundTaskId
                        eventType
                        status
                        payload
                        requestHeaders
                        responseHeaders
                        responseTime
                        responseStatus
                        responseBody
                        expiresAt
                        createdOn
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, {
            where,
            limit,
            after
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.listWebhookDeliveries.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.listWebhookDeliveries.error.message,
                    responseData.webhooks.listWebhookDeliveries.error.code
                )
            );
        }

        return Result.ok({
            data: responseData.webhooks.listWebhookDeliveries.data,
            meta: responseData.webhooks.listWebhookDeliveries.meta
        } as ListWebhookDeliveriesResult);
    }
);
```

- [ ] **Step 2.6: Run tests — expect pass**

```bash
yarn test packages/webhooks 2>&1 | grep -E "FAIL|PASS|✓|×" | tail -20
```

Expected: all tests pass.

- [ ] **Step 2.7: Commit**

```bash
git add packages/sdk/src/methods/webhooks/webhooksTypes.ts \
        packages/sdk/src/methods/webhooks/schemas.ts \
        packages/sdk/src/methods/webhooks/listWebhookDeliveries.ts \
        packages/webhooks/__tests__/sdk/webhooksSdk.test.ts
git commit -m "feat(webhooks): update SDK listWebhookDeliveries to use where filter, add responseHeaders"
```

---

## Task 3: Update admin feature layer — `listWebhookDeliveries` params and data source

**Files:**
- Modify: `packages/webhooks/src/admin/features/listWebhookDeliveries/abstractions.ts`
- Modify: `packages/webhooks/src/admin/features/listWebhookDeliveries/ListWebhookDeliveriesGateway.ts`
- Modify: `packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts`
- Modify: `packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesPresenter.ts`

- [ ] **Step 3.1: Update admin `listWebhookDeliveries` abstractions**

Replace the entire `packages/webhooks/src/admin/features/listWebhookDeliveries/abstractions.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";

export interface ListWebhookDeliveriesWhere {
    webhookId_eq?: string;
    eventType_in?: string[];
    status_in?: string[];
}

export interface ListWebhookDeliveriesParams {
    where?: ListWebhookDeliveriesWhere;
    limit?: number;
    after?: string;
}

export interface ListWebhookDeliveriesResult {
    data: WebhookDelivery[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export interface IListWebhookDeliveriesGateway {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesGateway = createAbstraction<IListWebhookDeliveriesGateway>(
    "ListWebhookDeliveriesGateway"
);

export namespace ListWebhookDeliveriesGateway {
    export type Interface = IListWebhookDeliveriesGateway;
}

export interface IListWebhookDeliveriesUseCase {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesUseCase = createAbstraction<IListWebhookDeliveriesUseCase>(
    "ListWebhookDeliveriesUseCase"
);

export namespace ListWebhookDeliveriesUseCase {
    export type Interface = IListWebhookDeliveriesUseCase;
}
```

- [ ] **Step 3.2: Update `ListWebhookDeliveriesGateway.ts` to pass `where` to SDK**

Replace the entire `packages/webhooks/src/admin/features/listWebhookDeliveries/ListWebhookDeliveriesGateway.ts`:

```typescript
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import {
    ListWebhookDeliveriesGateway as GatewayAbstraction,
    type ListWebhookDeliveriesParams,
    type ListWebhookDeliveriesResult
} from "./abstractions.js";

class ListWebhookDeliveriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult> {
        const result = await this.sdk.webhooks.listWebhookDeliveries({
            where: params.where,
            limit: params.limit,
            after: params.after
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return {
            data: result.value.data,
            meta: result.value.meta
        };
    }
}

export const ListWebhookDeliveriesGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 3.3: Update `WebhookDeliveriesDataSource` to use `where` instead of `webhookId`**

Replace the entire `packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts`:

```typescript
import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type {
    IListWebhookDeliveriesUseCase,
    ListWebhookDeliveriesWhere
} from "~/admin/features/listWebhookDeliveries/abstractions.js";

export class WebhookDeliveriesDataSource implements IDataSource<WebhookDelivery> {
    private _rows: WebhookDelivery[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(
        private readonly listDeliveriesUseCase: IListWebhookDeliveriesUseCase,
        private readonly where: ListWebhookDeliveriesWhere
    ) {
        makeAutoObservable<WebhookDeliveriesDataSource, "listDeliveriesUseCase">(this, {
            listDeliveriesUseCase: false,
            rows: computed
        });
    }

    get rows(): WebhookDelivery[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        const result = await this.listDeliveriesUseCase.execute({
            where: this.where,
            limit: params.limit,
            after: params.cursor
        });
        runInAction(() => {
            this._rows = result.data;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }
        this._loading = true;
        const result = await this.listDeliveriesUseCase.execute({
            where: this.where,
            limit: params.limit,
            after: this._meta.cursor ?? undefined
        });
        runInAction(() => {
            this._rows = [...this._rows, ...result.data];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
```

- [ ] **Step 3.4: Update `WebhookDeliveriesPresenter.ts` — init uses `{ webhookId_eq }`**

In `packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesPresenter.ts`, replace only the `init` method:

```typescript
    init(webhookId: string): void {
        const dataSource = new WebhookDeliveriesDataSource(this.listDeliveriesUseCase, {
            webhookId_eq: webhookId
        });
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
```

- [ ] **Step 3.5: Run type check**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no type errors.

- [ ] **Step 3.6: Commit**

```bash
git add packages/webhooks/src/admin/features/listWebhookDeliveries/abstractions.ts \
        packages/webhooks/src/admin/features/listWebhookDeliveries/ListWebhookDeliveriesGateway.ts \
        packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts \
        packages/webhooks/src/admin/presentation/WebhookDeliveries/WebhookDeliveriesPresenter.ts
git commit -m "feat(webhooks): update admin listWebhookDeliveries to use where filter"
```

---

## Task 4: Create `DeliveryDetailContent` and refactor `DeliveryDetail`

**Files:**
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx`
- Modify: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetail.tsx`

- [ ] **Step 4.1: Create `DeliveryDetailContent.tsx`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx`:

```typescript
import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { TimeAgo } from "@webiny/admin-ui";
import type { WebhookDelivery } from "~/admin/shared/types.js";

interface DeliveryDetailContentProps {
    delivery: WebhookDelivery;
}

const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};

const formatJson = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "—";
    }
    if (typeof value === "string") {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    return JSON.stringify(value, null, 2);
};

export const DeliveryDetailContent = ({ delivery }: DeliveryDetailContentProps) => {
    return (
        <div className="flex flex-col gap-md">
            <div className="flex items-center gap-sm flex-wrap">
                <Tag variant={statusVariant(delivery.status)} content={delivery.status} />
                {delivery.responseStatus !== null && (
                    <Text size="sm">HTTP {delivery.responseStatus}</Text>
                )}
                {delivery.responseTime !== null && (
                    <Text size="sm">{delivery.responseTime}ms</Text>
                )}
                {delivery.createdOn && (
                    <Text size="sm" className="text-neutral-strong">
                        <TimeAgo datetime={delivery.createdOn} />
                    </Text>
                )}
            </div>
            <Separator />
            <Accordion variant="underline">
                <Accordion.Item title="Payload" defaultOpen={true}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[250px]">
                        {formatJson(delivery.payload)}
                    </pre>
                </Accordion.Item>
                <Accordion.Item title="Request Headers" defaultOpen={false}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.requestHeaders)}
                    </pre>
                </Accordion.Item>
                <Accordion.Item title="Response Headers" defaultOpen={false}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.responseHeaders)}
                    </pre>
                </Accordion.Item>
                <Accordion.Item title="Response Body" defaultOpen={false}>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {delivery.responseBody ?? "—"}
                    </pre>
                </Accordion.Item>
            </Accordion>
        </div>
    );
};
```

- [ ] **Step 4.2: Refactor `DeliveryDetail.tsx` to delegate body to `DeliveryDetailContent`**

Replace the entire `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetail.tsx`:

```typescript
import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetailContent } from "./DeliveryDetailContent.js";

interface DeliveryDetailProps {
    delivery: WebhookDelivery;
    onClose: () => void;
    onResend: (id: string) => void;
}

export const DeliveryDetail = observer(function DeliveryDetail({
    delivery,
    onClose,
    onResend
}: DeliveryDetailProps) {
    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="flex items-center justify-between px-md py-sm">
                <Heading level={6}>{delivery.eventType}</Heading>
                <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close detail"
                />
            </div>
            <Separator />
            <div className="flex-1 overflow-auto px-md py-sm">
                <DeliveryDetailContent delivery={delivery} />
            </div>
            <Separator />
            <div className="px-md py-sm">
                <Button variant="secondary" onClick={() => onResend(delivery.id)}>
                    Resend
                </Button>
            </div>
        </div>
    );
});
```

- [ ] **Step 4.3: Run type check**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 4.4: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx \
        packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetail.tsx
git commit -m "feat(webhooks): extract DeliveryDetailContent, add responseHeaders section"
```

---

## Task 5: Create `DeliveryAccordionRow`

**Files:**
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx`

- [ ] **Step 5.1: Create `DeliveryAccordionRow.tsx`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx`:

```typescript
import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as ReplayIcon } from "@webiny/icons/replay.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetailContent } from "./DeliveryDetailContent.js";

interface DeliveryAccordionRowProps {
    delivery: WebhookDelivery;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResend: (id: string) => void;
}

const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};

export const DeliveryAccordionRow = ({
    delivery,
    open,
    onOpenChange,
    onResend
}: DeliveryAccordionRowProps) => {
    return (
        <Accordion.Item
            open={open}
            onOpenChange={onOpenChange}
            title={delivery.eventType}
            description={
                <div className="flex items-center gap-sm">
                    <Tag variant={statusVariant(delivery.status)} content={delivery.status} />
                    {delivery.responseStatus !== null && (
                        <Text size="sm">HTTP {delivery.responseStatus}</Text>
                    )}
                    {delivery.responseTime !== null && (
                        <Text size="sm">{delivery.responseTime}ms</Text>
                    )}
                </div>
            }
            actions={
                <Accordion.Item.Action>
                    <IconButton
                        icon={<ReplayIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            onResend(delivery.id);
                        }}
                        aria-label="Resend delivery"
                    />
                </Accordion.Item.Action>
            }
        >
            <DeliveryDetailContent delivery={delivery} />
        </Accordion.Item>
    );
};
```

- [ ] **Step 5.2: Run type check**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx
git commit -m "feat(webhooks): add DeliveryAccordionRow component"
```

---

## Task 6: Create `WebhookDeliveriesPagePresenter` and data source

**Files:**
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/abstractions.ts`
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/WebhookDeliveriesPagePresenter.ts`
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/feature.ts`
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/index.ts`

- [ ] **Step 6.1: Create `abstractions.ts`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/abstractions.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IDeliveryPageFilters {
    app: string | null;
    entity: string | null;
    eventName: string | null;
    status: string[];
}

export interface IDeliveryFilterOption {
    value: string;
    label: string;
}

export interface IWebhookDeliveriesPageViewModel {
    availableApps: IDeliveryFilterOption[];
    availableEntities: IDeliveryFilterOption[];
    availableEventNames: IDeliveryFilterOption[];
    filters: IDeliveryPageFilters;
    list: IListViewModel<WebhookDelivery>;
    expandedDeliveryId: string | null;
    loading: boolean;
    error: string | null;
}

export interface IWebhookDeliveriesPageActions {
    init(): Promise<void>;
    setAppFilter(app: string | null): void;
    setEntityFilter(entity: string | null): void;
    setEventFilter(eventName: string | null): void;
    setStatusFilter(status: string[]): void;
    expandDelivery(id: string | null): void;
    loadMore(): Promise<void>;
    resend(id: string): Promise<void>;
}

export interface IWebhookDeliveriesPagePresenter {
    vm: IWebhookDeliveriesPageViewModel;
    actions: IWebhookDeliveriesPageActions;
}

export const WebhookDeliveriesPagePresenter =
    createAbstraction<IWebhookDeliveriesPagePresenter>("WebhookDeliveriesPagePresenter");

export namespace WebhookDeliveriesPagePresenter {
    export type Interface = IWebhookDeliveriesPagePresenter;
    export type ViewModel = IWebhookDeliveriesPageViewModel;
    export type Actions = IWebhookDeliveriesPageActions;
}
```

- [ ] **Step 6.2: Create `WebhookDeliveriesPagePresenter.ts`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/WebhookDeliveriesPagePresenter.ts`:

```typescript
import { makeAutoObservable, computed, runInAction } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery, WebhookEvent } from "~/admin/shared/types.js";
import { ListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";
import type { ListWebhookDeliveriesWhere } from "~/admin/features/listWebhookDeliveries/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/admin/features/resendWebhookDelivery/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { WebhookDeliveriesDataSource } from "~/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.js";
import {
    WebhookDeliveriesPagePresenter as Abstraction,
    type IWebhookDeliveriesPagePresenter,
    type IWebhookDeliveriesPageViewModel,
    type IWebhookDeliveriesPageActions,
    type IDeliveryFilterOption,
    type IDeliveryPageFilters
} from "./abstractions.js";

class WebhookDeliveriesPagePresenterImpl implements IWebhookDeliveriesPagePresenter {
    private _availableEvents: WebhookEvent[] = [];
    private _filters: IDeliveryPageFilters = {
        app: null,
        entity: null,
        eventName: null,
        status: []
    };
    private _expandedDeliveryId: string | null = null;
    private _loading = false;
    private _error: string | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<WebhookDelivery>,
        private readonly listDeliveriesUseCase: ListWebhookDeliveriesUseCase.Interface,
        private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
        private readonly resendDeliveryUseCase: ResendWebhookDeliveryUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): IWebhookDeliveriesPageViewModel {
        return {
            availableApps: this._computeAvailableApps(),
            availableEntities: this._computeAvailableEntities(),
            availableEventNames: this._computeAvailableEventNames(),
            filters: { ...this._filters },
            list: this.listPresenter.vm,
            expandedDeliveryId: this._expandedDeliveryId,
            loading: this._loading,
            error: this._error
        };
    }

    actions: IWebhookDeliveriesPageActions = {
        init: async () => {
            runInAction(() => {
                this._loading = true;
                this._error = null;
            });
            try {
                const events = await this.listAvailableEventsUseCase.execute();
                runInAction(() => {
                    this._availableEvents = events;
                });
            } catch (err) {
                runInAction(() => {
                    this._error = err instanceof Error ? err.message : "Failed to load events.";
                });
            } finally {
                runInAction(() => {
                    this._loading = false;
                });
            }
            this._applyFilters();
        },
        setAppFilter: (app: string | null) => {
            this._filters = { app, entity: null, eventName: null, status: this._filters.status };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        setEntityFilter: (entity: string | null) => {
            this._filters = { ...this._filters, entity, eventName: null };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        setEventFilter: (eventName: string | null) => {
            this._filters = { ...this._filters, eventName };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        setStatusFilter: (status: string[]) => {
            this._filters = { ...this._filters, status };
            this._expandedDeliveryId = null;
            this._applyFilters();
        },
        expandDelivery: (id: string | null) => {
            this._expandedDeliveryId = this._expandedDeliveryId === id ? null : id;
        },
        loadMore: async () => {
            await this.listPresenter.actions.loadMore();
        },
        resend: async (id: string) => {
            await this.resendDeliveryUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        }
    };

    private _applyFilters(): void {
        const where = this._buildWhere();
        const dataSource = new WebhookDeliveriesDataSource(this.listDeliveriesUseCase, where);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }

    private _buildWhere(): ListWebhookDeliveriesWhere {
        const where: ListWebhookDeliveriesWhere = {};
        const { app, entity, eventName } = this._filters;

        if (app || entity || eventName) {
            const matching = this._availableEvents.filter(event => {
                if (app && event.app !== app) {
                    return false;
                }
                if (entity && event.entity !== entity) {
                    return false;
                }
                if (eventName && event.eventName !== eventName) {
                    return false;
                }
                return true;
            });
            if (matching.length > 0) {
                where.eventType_in = matching.map(e => e.eventName);
            }
        }

        if (this._filters.status.length > 0) {
            where.status_in = this._filters.status;
        }

        return where;
    }

    private _computeAvailableApps(): IDeliveryFilterOption[] {
        const seen = new Set<string>();
        const result: IDeliveryFilterOption[] = [];
        for (const event of this._availableEvents) {
            if (!seen.has(event.app)) {
                seen.add(event.app);
                result.push({ value: event.app, label: event.appLabel });
            }
        }
        return result;
    }

    private _computeAvailableEntities(): IDeliveryFilterOption[] {
        if (!this._filters.app) {
            return [];
        }
        const seen = new Set<string>();
        const result: IDeliveryFilterOption[] = [];
        for (const event of this._availableEvents) {
            if (event.app === this._filters.app && !seen.has(event.entity)) {
                seen.add(event.entity);
                result.push({ value: event.entity, label: event.entityLabel });
            }
        }
        return result;
    }

    private _computeAvailableEventNames(): IDeliveryFilterOption[] {
        if (!this._filters.app) {
            return [];
        }
        return this._availableEvents
            .filter(event => {
                if (event.app !== this._filters.app) {
                    return false;
                }
                if (this._filters.entity && event.entity !== this._filters.entity) {
                    return false;
                }
                return true;
            })
            .map(event => ({ value: event.eventName, label: event.label }));
    }
}

export const WebhookDeliveriesPagePresenter = Abstraction.createImplementation({
    implementation: WebhookDeliveriesPagePresenterImpl,
    dependencies: [
        ListPresenter,
        ListWebhookDeliveriesUseCase,
        ListAvailableEventsUseCase,
        ResendWebhookDeliveryUseCase
    ]
});
```

- [ ] **Step 6.3: Create `feature.ts`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/feature.ts`:

```typescript
import { createFeature } from "@webiny/feature/admin";
import { WebhookDeliveriesPagePresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookDeliveriesPagePresenter } from "./WebhookDeliveriesPagePresenter.js";

export const WebhookDeliveriesPagePresenterFeature = createFeature({
    name: "Webhooks/WebhookDeliveriesPagePresenter",
    register(container) {
        container.register(WebhookDeliveriesPagePresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
```

- [ ] **Step 6.4: Create `index.ts`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/index.ts`:

```typescript
export { WebhookDeliveriesPagePresenterFeature } from "./feature.js";
export type { IWebhookDeliveriesPagePresenter } from "./abstractions.js";
export type { IWebhookDeliveriesPageViewModel } from "./abstractions.js";
export type { IWebhookDeliveriesPageActions } from "./abstractions.js";
export type { IDeliveryPageFilters } from "./abstractions.js";
export type { IDeliveryFilterOption } from "./abstractions.js";
```

- [ ] **Step 6.5: Run type check**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6.6: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/
git commit -m "feat(webhooks): add WebhookDeliveriesPagePresenter with filter translation"
```

---

## Task 7: Create `DeliveryFilters` and `WebhookDeliveriesPage` components

**Files:**
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/DeliveryFilters.tsx`
- Create: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/WebhookDeliveriesPage.tsx`

- [ ] **Step 7.1: Create `DeliveryFilters.tsx`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/DeliveryFilters.tsx`:

```typescript
import React from "react";
import { observer } from "mobx-react-lite";
import { MultiSelect } from "@webiny/admin-ui";
import { Select } from "@webiny/admin-ui";
import type { IWebhookDeliveriesPageViewModel } from "../abstractions.js";
import type { IWebhookDeliveriesPageActions } from "../abstractions.js";

interface DeliveryFiltersProps {
    vm: IWebhookDeliveriesPageViewModel;
    actions: IWebhookDeliveriesPageActions;
}

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "delivering", label: "Delivering" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" }
];

export const DeliveryFilters = observer(function DeliveryFilters({
    vm,
    actions
}: DeliveryFiltersProps) {
    return (
        <div className="flex items-center gap-sm flex-wrap py-sm">
            <Select
                placeholder="All apps"
                value={vm.filters.app ?? ""}
                options={vm.availableApps}
                onChange={value => actions.setAppFilter(value || null)}
                displayResetAction={true}
                onValueReset={() => actions.setAppFilter(null)}
            />
            <Select
                placeholder="All entities"
                value={vm.filters.entity ?? ""}
                options={vm.availableEntities}
                onChange={value => actions.setEntityFilter(value || null)}
                disabled={!vm.filters.app}
                displayResetAction={true}
                onValueReset={() => actions.setEntityFilter(null)}
            />
            <Select
                placeholder="All events"
                value={vm.filters.eventName ?? ""}
                options={vm.availableEventNames}
                onChange={value => actions.setEventFilter(value || null)}
                disabled={!vm.filters.app}
                displayResetAction={true}
                onValueReset={() => actions.setEventFilter(null)}
            />
            <MultiSelect
                placeholder="All statuses"
                value={vm.filters.status}
                options={STATUS_OPTIONS}
                onChange={values => actions.setStatusFilter(values)}
            />
        </div>
    );
});
```

- [ ] **Step 7.2: Create `WebhookDeliveriesPage.tsx`**

Create `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/WebhookDeliveriesPage.tsx`:

```typescript
import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Accordion } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";
import { WebhookDeliveriesPagePresenterFeature } from "../feature.js";
import { DeliveryAccordionRow } from "~/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.js";
import { DeliveryFilters } from "./DeliveryFilters.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";

const WebhookDeliveriesPageInner = observer(function WebhookDeliveriesPageInner() {
    const { presenter } = useFeature(WebhookDeliveriesPagePresenterFeature);

    useEffect(() => {
        void presenter.actions.init();
    }, [presenter]);

    const { vm } = presenter;

    if (vm.loading && vm.list.rows.length === 0) {
        return (
            <div className="flex flex-col gap-sm p-md">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (vm.error) {
        return (
            <div className="flex flex-col items-center gap-sm p-md">
                <Text>{vm.error}</Text>
                <Button variant="secondary" onClick={() => void presenter.actions.init()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-md gap-md">
            <Heading level={4}>Delivery Log</Heading>
            <DeliveryFilters vm={vm} actions={presenter.actions} />
            {vm.list.rows.length === 0 ? (
                <div className="flex justify-center py-xl">
                    <Text className="text-neutral-strong">No deliveries found.</Text>
                </div>
            ) : (
                <>
                    <Accordion variant="underline">
                        {vm.list.rows.map((delivery: WebhookDelivery) => (
                            <DeliveryAccordionRow
                                key={delivery.id}
                                delivery={delivery}
                                open={vm.expandedDeliveryId === delivery.id}
                                onOpenChange={open =>
                                    presenter.actions.expandDelivery(open ? delivery.id : null)
                                }
                                onResend={id => void presenter.actions.resend(id)}
                            />
                        ))}
                    </Accordion>
                    {vm.list.pagination.hasMore && (
                        <div className="flex justify-center pt-sm">
                            <Button
                                variant="secondary"
                                onClick={() => void presenter.actions.loadMore()}
                                disabled={vm.list.pagination.loadingMore}
                            >
                                {vm.list.pagination.loadingMore ? "Loading…" : "Load more"}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export const WebhookDeliveriesPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListWebhookDeliveriesFeature.register(child);
        ListAvailableEventsFeature.register(child);
        ResendWebhookDeliveryFeature.register(child);
        WebhookDeliveriesPagePresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookDeliveriesPageInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 7.3: Run type check**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 7.4: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/components/
git commit -m "feat(webhooks): add DeliveryFilters and WebhookDeliveriesPage components"
```

---

## Task 8: Add route and wire everything up

**Files:**
- Modify: `packages/webhooks/src/admin/routes.ts`
- Modify: `packages/webhooks/src/admin/WebhookRoutes.tsx`

- [ ] **Step 8.1: Add `Deliveries` route to `routes.ts`**

Replace the entire `packages/webhooks/src/admin/routes.ts`:

```typescript
import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "Webhooks/List",
        path: "/webhooks"
    }),
    Deliveries: new Route({
        name: "Webhooks/Deliveries",
        path: "/webhooks/deliveries"
    }),
    Settings: new Route({
        name: "Webhooks/Settings",
        path: "/webhooks/settings"
    }),
    Form: new Route({
        name: "Webhooks/Form",
        path: "/webhooks/:id",
        params: zod => ({
            id: zod.string()
        })
    })
};
```

- [ ] **Step 8.2: Register the route and add a menu item in `WebhookRoutes.tsx`**

Replace `packages/webhooks/src/admin/WebhookRoutes.tsx`. The key requirements are:
- `Deliveries` route must be registered **before** `Form` (prevents `/webhooks/:id` from capturing `/webhooks/deliveries`)
- Add a "Delivery Log" menu item under the webhooks menu group

```typescript
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { WebhookListView } from "./presentation/WebhookList/components/WebhookListView.js";
import { WebhookFormView } from "./presentation/WebhookForm/components/WebhookFormView.js";
import { WebhookSettingsView } from "./presentation/WebhookSettings/components/WebhookSettingsView.js";
import { WebhookDeliveriesPage } from "./presentation/WebhookDeliveriesPage/components/WebhookDeliveriesPage.js";
import { Routes } from "./routes.js";
import { ReactComponent as WebhookIcon } from "@webiny/icons/webhook.svg";

const { Menu, Route } = AdminConfig;

export const WebhookRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="webhook">
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookListView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Deliveries}
                    element={
                        <AdminLayout title="Delivery Log">
                            <WebhookDeliveriesPage />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title="Webhook Settings">
                            <WebhookSettingsView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Form}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookFormView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="webhooks"
                    after="settings"
                    element={
                        <Menu.Item
                            text="Webhooks"
                            icon={<Menu.Link.Icon label="Webhooks" element={<WebhookIcon />} />}
                        />
                    }
                />
                <Menu
                    name="webhooks.list"
                    parent="webhooks"
                    element={<Menu.Link text="Webhooks" to={getLink(Routes.List)} />}
                />
                <Menu
                    name="webhooks.deliveries"
                    parent="webhooks"
                    element={<Menu.Link text="Delivery Log" to={getLink(Routes.Deliveries)} />}
                />
                <Menu
                    name="webhooks.settings"
                    parent="webhooks"
                    element={<Menu.Link text="Settings" to={getLink(Routes.Settings)} />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
```

- [ ] **Step 8.3: Run type check**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 8.4: Run all tests**

```bash
yarn test packages/webhooks 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 8.5: Run pre-commit checks**

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

Fix any issues before committing.

- [ ] **Step 8.6: Final commit**

```bash
git commit -m "feat(webhooks): add /webhooks/deliveries page with filters and accordion detail"
```
