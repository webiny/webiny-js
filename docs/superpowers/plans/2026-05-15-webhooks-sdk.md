# Webhooks SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add webhooks support to `packages/sdk` — 10 methods covering the full webhooks GraphQL API.

**Architecture:** Follows the existing SDK pattern exactly: standalone method functions in `methods/webhooks/`, a `WebhooksSdk` class that delegates to them, composed into the main `Webiny` class. Each method uses `executeGraphQL` for transport, `createMethod` + Zod for param validation, and returns `Result<T, E>`.

**Tech Stack:** TypeScript, Zod, Result monad (`packages/sdk/src/Result.ts`)

**Spec:** `docs/superpowers/specs/2026-05-15-webhooks-sdk-design.md`

**Tests:** Out of scope (follow-up task).

---

### Task 1: Foundation — Domain Types + Zod Schemas

**Files:**
- Create: `packages/sdk/src/methods/webhooks/webhooksTypes.ts`
- Create: `packages/sdk/src/methods/webhooks/schemas.ts`

- [ ] **Step 1: Create `webhooksTypes.ts`**

```typescript
export interface Webhook {
    id: string;
    name: string;
    slug: string;
    endpointUrl: string;
    description: string | null;
    enabled: boolean;
    events: string[];
    signingSecret: string;
    createdOn: string | null;
    modifiedOn: string | null;
}

export interface WebhookDelivery {
    id: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: string;
    payload: unknown;
    requestHeaders: unknown;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt: string | null;
    createdOn: string | null;
}

export interface WebhookEvent {
    app: string;
    entity: string;
    eventName: string;
    label: string;
}
```

- [ ] **Step 2: Create `schemas.ts`**

```typescript
import { z } from "zod";

const id = z.string().min(1, "id is required");

export const getWebhookSchema = z.object({
    id
});

export const listWebhooksSchema = z.object({
    where: z
        .object({
            enabled: z.boolean().optional()
        })
        .optional(),
    limit: z.number().int().positive().optional(),
    after: z.string().optional()
});

export const createWebhookSchema = z.object({
    name: z.string().min(1, "name is required"),
    endpointUrl: z.string().url("endpointUrl must be a valid URL"),
    events: z.array(z.string().min(1)).min(1, "events must contain at least one entry"),
    slug: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional()
});

export const updateWebhookSchema = z.object({
    id,
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    endpointUrl: z.string().url("endpointUrl must be a valid URL").optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    events: z.array(z.string().min(1)).optional()
});

export const deleteWebhookSchema = z.object({
    id
});

export const getWebhookDeliverySchema = z.object({
    id
});

export const listWebhookDeliveriesSchema = z.object({
    webhookId: z.string().min(1, "webhookId is required"),
    limit: z.number().int().positive().optional(),
    after: z.string().optional()
});

export const resendWebhookDeliverySchema = z.object({
    id
});

export const triggerWebhookSchema = z.object({
    id,
    payload: z.record(z.string(), z.unknown())
});
```

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/src/methods/webhooks/webhooksTypes.ts packages/sdk/src/methods/webhooks/schemas.ts
git commit -m "feat(sdk): add webhooks domain types and Zod schemas"
```

---

### Task 2: Webhook Query Methods

**Files:**
- Create: `packages/sdk/src/methods/webhooks/getWebhook.ts`
- Create: `packages/sdk/src/methods/webhooks/listWebhooks.ts`

- [ ] **Step 1: Create `getWebhook.ts`**

```typescript
import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { getWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface GetWebhookParams {
    id: string;
}

export const getWebhook = createMethod(
    getWebhookSchema,
    async (config, fetchFn, { id }) => {
        const query = `
        query GetWebhook($id: ID!) {
            webhooks {
                getWebhook(id: $id) {
                    data {
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
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.getWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.getWebhook.error.message,
                    responseData.webhooks.getWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.getWebhook.data as Webhook);
    }
);
```

- [ ] **Step 2: Create `listWebhooks.ts`**

```typescript
import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { listWebhooksSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ListWebhooksParams {
    where?: {
        enabled?: boolean;
    };
    limit?: number;
    after?: string;
}

export interface ListWebhooksResult {
    data: Webhook[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export const listWebhooks = createMethod(
    listWebhooksSchema,
    async (config, fetchFn, { where, limit, after }) => {
        const query = `
        query ListWebhooks($where: ListWebhooksWhereInput, $limit: Int, $after: String) {
            webhooks {
                listWebhooks(where: $where, limit: $limit, after: $after) {
                    data {
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

        const result = await executeGraphQL(config, fetchFn, query, { where, limit, after });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.listWebhooks.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.listWebhooks.error.message,
                    responseData.webhooks.listWebhooks.error.code
                )
            );
        }

        return Result.ok({
            data: responseData.webhooks.listWebhooks.data,
            meta: responseData.webhooks.listWebhooks.meta
        } as ListWebhooksResult);
    }
);
```

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/src/methods/webhooks/getWebhook.ts packages/sdk/src/methods/webhooks/listWebhooks.ts
git commit -m "feat(sdk): add getWebhook and listWebhooks methods"
```

---

### Task 3: Webhook Mutation Methods

**Files:**
- Create: `packages/sdk/src/methods/webhooks/createWebhook.ts`
- Create: `packages/sdk/src/methods/webhooks/updateWebhook.ts`
- Create: `packages/sdk/src/methods/webhooks/deleteWebhook.ts`

- [ ] **Step 1: Create `createWebhook.ts`**

```typescript
import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { createWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface CreateWebhookParams {
    name: string;
    endpointUrl: string;
    events: string[];
    slug?: string;
    description?: string;
    enabled?: boolean;
}

export const createWebhook = createMethod(
    createWebhookSchema,
    async (config, fetchFn, params) => {
        const query = `
        mutation CreateWebhook($input: CreateWebhookInput!) {
            webhooks {
                createWebhook(input: $input) {
                    data {
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
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { input: params });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.createWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.createWebhook.error.message,
                    responseData.webhooks.createWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.createWebhook.data as Webhook);
    }
);
```

- [ ] **Step 2: Create `updateWebhook.ts`**

The GraphQL mutation takes `id` and `input` as separate args. The SDK params flatten these — the method splits them before calling GraphQL.

```typescript
import { Result } from "../../Result.js";
import type { Webhook } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { updateWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface UpdateWebhookParams {
    id: string;
    name?: string;
    slug?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
}

export const updateWebhook = createMethod(
    updateWebhookSchema,
    async (config, fetchFn, { id, ...input }) => {
        const query = `
        mutation UpdateWebhook($id: ID!, $input: UpdateWebhookInput!) {
            webhooks {
                updateWebhook(id: $id, input: $input) {
                    data {
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
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id, input });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.updateWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.updateWebhook.error.message,
                    responseData.webhooks.updateWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.updateWebhook.data as Webhook);
    }
);
```

- [ ] **Step 3: Create `deleteWebhook.ts`**

Returns `boolean` — matches the `BooleanResponse` GraphQL type.

```typescript
import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { deleteWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface DeleteWebhookParams {
    id: string;
}

export const deleteWebhook = createMethod(
    deleteWebhookSchema,
    async (config, fetchFn, { id }) => {
        const query = `
        mutation DeleteWebhook($id: ID!) {
            webhooks {
                deleteWebhook(id: $id) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.deleteWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.deleteWebhook.error.message,
                    responseData.webhooks.deleteWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.deleteWebhook.data as boolean);
    }
);
```

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/methods/webhooks/createWebhook.ts packages/sdk/src/methods/webhooks/updateWebhook.ts packages/sdk/src/methods/webhooks/deleteWebhook.ts
git commit -m "feat(sdk): add webhook create, update, delete methods"
```

---

### Task 4: Delivery Methods

**Files:**
- Create: `packages/sdk/src/methods/webhooks/getWebhookDelivery.ts`
- Create: `packages/sdk/src/methods/webhooks/listWebhookDeliveries.ts`
- Create: `packages/sdk/src/methods/webhooks/resendWebhookDelivery.ts`

- [ ] **Step 1: Create `getWebhookDelivery.ts`**

```typescript
import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { getWebhookDeliverySchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface GetWebhookDeliveryParams {
    id: string;
}

export const getWebhookDelivery = createMethod(
    getWebhookDeliverySchema,
    async (config, fetchFn, { id }) => {
        const query = `
        query GetWebhookDelivery($id: ID!) {
            webhooks {
                getWebhookDelivery(id: $id) {
                    data {
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
                        expiresAt
                        createdOn
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.getWebhookDelivery.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.getWebhookDelivery.error.message,
                    responseData.webhooks.getWebhookDelivery.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.getWebhookDelivery.data as WebhookDelivery);
    }
);
```

- [ ] **Step 2: Create `listWebhookDeliveries.ts`**

```typescript
import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { listWebhookDeliveriesSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ListWebhookDeliveriesParams {
    webhookId: string;
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
    async (config, fetchFn, { webhookId, limit, after }) => {
        const query = `
        query ListWebhookDeliveries($webhookId: ID!, $limit: Int, $after: String) {
            webhooks {
                listWebhookDeliveries(webhookId: $webhookId, limit: $limit, after: $after) {
                    data {
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
            webhookId,
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

- [ ] **Step 3: Create `resendWebhookDelivery.ts`**

```typescript
import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { resendWebhookDeliverySchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface ResendWebhookDeliveryParams {
    id: string;
}

export const resendWebhookDelivery = createMethod(
    resendWebhookDeliverySchema,
    async (config, fetchFn, { id }) => {
        const query = `
        mutation ResendWebhookDelivery($id: ID!) {
            webhooks {
                resendWebhookDelivery(id: $id) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.resendWebhookDelivery.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.resendWebhookDelivery.error.message,
                    responseData.webhooks.resendWebhookDelivery.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.resendWebhookDelivery.data as boolean);
    }
);
```

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/src/methods/webhooks/getWebhookDelivery.ts packages/sdk/src/methods/webhooks/listWebhookDeliveries.ts packages/sdk/src/methods/webhooks/resendWebhookDelivery.ts
git commit -m "feat(sdk): add webhook delivery get, list, resend methods"
```

---

### Task 5: Event + Trigger Methods

**Files:**
- Create: `packages/sdk/src/methods/webhooks/listAvailableWebhookEvents.ts`
- Create: `packages/sdk/src/methods/webhooks/triggerWebhook.ts`

- [ ] **Step 1: Create `listAvailableWebhookEvents.ts`**

No params — follows the `listLanguages` pattern (plain function, no `createMethod`).

```typescript
import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError } from "../../errors.js";
import type { NetworkError } from "../../errors.js";
import type { WebhookEvent } from "./webhooksTypes.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export async function listAvailableWebhookEvents(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<WebhookEvent[], HttpError | ApiError | NetworkError>> {
    const query = `
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
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {});

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.webhooks.listAvailableWebhookEvents.error) {
        return Result.fail(
            new ApiError(
                responseData.webhooks.listAvailableWebhookEvents.error.message,
                responseData.webhooks.listAvailableWebhookEvents.error.code
            )
        );
    }

    return Result.ok(responseData.webhooks.listAvailableWebhookEvents.data as WebhookEvent[]);
}
```

- [ ] **Step 2: Create `triggerWebhook.ts`**

```typescript
import { Result } from "../../Result.js";
import type { WebhookDelivery } from "./webhooksTypes.js";
import { createMethod } from "../../utils/createMethod.js";
import { triggerWebhookSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface TriggerWebhookParams {
    id: string;
    payload: Record<string, unknown>;
}

export const triggerWebhook = createMethod(
    triggerWebhookSchema,
    async (config, fetchFn, { id, payload }) => {
        const query = `
        mutation TriggerWebhook($id: ID!, $payload: JSON!) {
            webhooks {
                triggerWebhook(id: $id, payload: $payload) {
                    data {
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
                        expiresAt
                        createdOn
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, { id, payload });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.webhooks.triggerWebhook.error) {
            return Result.fail(
                new ApiError(
                    responseData.webhooks.triggerWebhook.error.message,
                    responseData.webhooks.triggerWebhook.error.code
                )
            );
        }

        return Result.ok(responseData.webhooks.triggerWebhook.data as WebhookDelivery);
    }
);
```

- [ ] **Step 3: Commit**

```bash
git add packages/sdk/src/methods/webhooks/listAvailableWebhookEvents.ts packages/sdk/src/methods/webhooks/triggerWebhook.ts
git commit -m "feat(sdk): add listAvailableWebhookEvents and triggerWebhook methods"
```

---

### Task 6: SDK Class

**Files:**
- Create: `packages/sdk/src/WebhooksSdk.ts`

- [ ] **Step 1: Create `WebhooksSdk.ts`**

```typescript
import type { WebinyConfig } from "./types.js";
import type { HttpError } from "./errors.js";
import type { ApiError } from "./errors.js";
import type { NetworkError } from "./errors.js";
import type { ValidationError } from "./errors.js";
import type { Result } from "./Result.js";
import type { Webhook } from "./methods/webhooks/webhooksTypes.js";
import type { WebhookDelivery } from "./methods/webhooks/webhooksTypes.js";
import type { WebhookEvent } from "./methods/webhooks/webhooksTypes.js";
import type { GetWebhookParams } from "./methods/webhooks/getWebhook.js";
import type { ListWebhooksParams } from "./methods/webhooks/listWebhooks.js";
import type { ListWebhooksResult } from "./methods/webhooks/listWebhooks.js";
import type { CreateWebhookParams } from "./methods/webhooks/createWebhook.js";
import type { UpdateWebhookParams } from "./methods/webhooks/updateWebhook.js";
import type { DeleteWebhookParams } from "./methods/webhooks/deleteWebhook.js";
import type { GetWebhookDeliveryParams } from "./methods/webhooks/getWebhookDelivery.js";
import type { ListWebhookDeliveriesParams } from "./methods/webhooks/listWebhookDeliveries.js";
import type { ListWebhookDeliveriesResult } from "./methods/webhooks/listWebhookDeliveries.js";
import type { ResendWebhookDeliveryParams } from "./methods/webhooks/resendWebhookDelivery.js";
import type { TriggerWebhookParams } from "./methods/webhooks/triggerWebhook.js";
import { getWebhook as getWebhookFn } from "./methods/webhooks/getWebhook.js";
import { listWebhooks as listWebhooksFn } from "./methods/webhooks/listWebhooks.js";
import { createWebhook as createWebhookFn } from "./methods/webhooks/createWebhook.js";
import { updateWebhook as updateWebhookFn } from "./methods/webhooks/updateWebhook.js";
import { deleteWebhook as deleteWebhookFn } from "./methods/webhooks/deleteWebhook.js";
import { getWebhookDelivery as getWebhookDeliveryFn } from "./methods/webhooks/getWebhookDelivery.js";
import { listWebhookDeliveries as listWebhookDeliveriesFn } from "./methods/webhooks/listWebhookDeliveries.js";
import { resendWebhookDelivery as resendWebhookDeliveryFn } from "./methods/webhooks/resendWebhookDelivery.js";
import { listAvailableWebhookEvents as listAvailableWebhookEventsFn } from "./methods/webhooks/listAvailableWebhookEvents.js";
import { triggerWebhook as triggerWebhookFn } from "./methods/webhooks/triggerWebhook.js";

export class WebhooksSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async getWebhook(
        params: GetWebhookParams
    ): Promise<Result<Webhook, HttpError | ApiError | NetworkError | ValidationError>> {
        return getWebhookFn(this.config, this.fetchFn, params);
    }

    async listWebhooks(
        params?: ListWebhooksParams
    ): Promise<Result<ListWebhooksResult, HttpError | ApiError | NetworkError | ValidationError>> {
        return listWebhooksFn(this.config, this.fetchFn, params ?? {});
    }

    async createWebhook(
        params: CreateWebhookParams
    ): Promise<Result<Webhook, HttpError | ApiError | NetworkError | ValidationError>> {
        return createWebhookFn(this.config, this.fetchFn, params);
    }

    async updateWebhook(
        params: UpdateWebhookParams
    ): Promise<Result<Webhook, HttpError | ApiError | NetworkError | ValidationError>> {
        return updateWebhookFn(this.config, this.fetchFn, params);
    }

    async deleteWebhook(
        params: DeleteWebhookParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError | ValidationError>> {
        return deleteWebhookFn(this.config, this.fetchFn, params);
    }

    async getWebhookDelivery(
        params: GetWebhookDeliveryParams
    ): Promise<Result<WebhookDelivery, HttpError | ApiError | NetworkError | ValidationError>> {
        return getWebhookDeliveryFn(this.config, this.fetchFn, params);
    }

    async listWebhookDeliveries(
        params: ListWebhookDeliveriesParams
    ): Promise<
        Result<ListWebhookDeliveriesResult, HttpError | ApiError | NetworkError | ValidationError>
    > {
        return listWebhookDeliveriesFn(this.config, this.fetchFn, params);
    }

    async resendWebhookDelivery(
        params: ResendWebhookDeliveryParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError | ValidationError>> {
        return resendWebhookDeliveryFn(this.config, this.fetchFn, params);
    }

    async listAvailableWebhookEvents(): Promise<
        Result<WebhookEvent[], HttpError | ApiError | NetworkError>
    > {
        return listAvailableWebhookEventsFn(this.config, this.fetchFn);
    }

    async triggerWebhook(
        params: TriggerWebhookParams
    ): Promise<Result<WebhookDelivery, HttpError | ApiError | NetworkError | ValidationError>> {
        return triggerWebhookFn(this.config, this.fetchFn, params);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sdk/src/WebhooksSdk.ts
git commit -m "feat(sdk): add WebhooksSdk class"
```

---

### Task 7: Integration + Build

**Files:**
- Modify: `packages/sdk/src/Webiny.ts`
- Modify: `packages/sdk/src/index.ts`

- [ ] **Step 1: Add `WebhooksSdk` to `Webiny.ts`**

Add import at the top (after the `TasksSdk` import):

```typescript
import { WebhooksSdk } from "./WebhooksSdk.js";
```

Add property to the class (after `tasks`):

```typescript
public readonly webhooks: WebhooksSdk;
```

Add initialization in the constructor (after `this.tasks = ...`):

```typescript
this.webhooks = new WebhooksSdk({
    ...config,
    tenant: config.tenant || "root"
});
```

- [ ] **Step 2: Add exports to `index.ts`**

Append after the existing Tasks exports block:

```typescript
// Export Webhooks SDK.
export * from "./WebhooksSdk.js";

// Export Webhooks types.
export type {
    Webhook,
    WebhookDelivery,
    WebhookEvent
} from "./methods/webhooks/webhooksTypes.js";

// Export types from webhooks methods.
export type { GetWebhookParams } from "./methods/webhooks/getWebhook.js";

export type { ListWebhooksParams, ListWebhooksResult } from "./methods/webhooks/listWebhooks.js";

export type { CreateWebhookParams } from "./methods/webhooks/createWebhook.js";

export type { UpdateWebhookParams } from "./methods/webhooks/updateWebhook.js";

export type { DeleteWebhookParams } from "./methods/webhooks/deleteWebhook.js";

export type { GetWebhookDeliveryParams } from "./methods/webhooks/getWebhookDelivery.js";

export type {
    ListWebhookDeliveriesParams,
    ListWebhookDeliveriesResult
} from "./methods/webhooks/listWebhookDeliveries.js";

export type { ResendWebhookDeliveryParams } from "./methods/webhooks/resendWebhookDelivery.js";

export type { TriggerWebhookParams } from "./methods/webhooks/triggerWebhook.js";
```

- [ ] **Step 3: Run pre-commit checks and build**

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

Then build the SDK package:

```bash
yarn build -p @webiny/sdk 2>&1 | tail -30
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(sdk): integrate WebhooksSdk into Webiny class and export types"
```
