# Webhooks Phase 1 — `webhooks` Core Package (Part 2 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `WebhookSignPayload`, `WebhookDispatcher`, and `SendWebhookTask`, with unit tests for all three.

**Part 1:** `2026-05-11-webhooks-phase1-part1.md` — scaffold, domain, abstractions, models (complete first)
**Part 3:** `2026-05-11-webhooks-phase1-part3.md` — use cases
**Part 4:** `2026-05-11-webhooks-phase1-part4.md` — GraphQL + Extension + exports

---

## Task 5: `WebhookSignPayload` implementation

Signs a raw body string with HMAC-SHA256 using the webhook's signing secret. Returns the Stripe-format `t={timestamp},v1={hmac}` header value. The secret is passed directly as a parameter (it lives on each webhook entry).

**Files:**
- Create: `packages/webhooks/src/api/features/WebhookSignPayload/WebhookSignPayloadImpl.ts`
- Create: `packages/webhooks/src/api/features/WebhookSignPayload/feature.ts`
- Create: `packages/webhooks/__tests__/WebhookSignPayload.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// packages/webhooks/__tests__/WebhookSignPayload.test.ts
import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/abstractions.js";
import { WebhookSignPayloadFeature } from "~/api/features/WebhookSignPayload/feature.js";

describe("WebhookSignPayload", () => {
    it("returns Stripe-format signature: t={timestamp},v1={hmac}", async () => {
        const container = new Container();

        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve<WebhookSignPayload.Interface>(
            WebhookSignPayload.token
        );

        const rawBody = '{"event":"test"}';
        const timestamp = 1700000000;
        const secret = "whsec_test_secret";
        const signature = await signer.sign(rawBody, timestamp, secret);

        expect(signature).toMatch(/^t=1700000000,v1=[a-f0-9]{64}$/);
    });

    it("produces consistent signatures for the same input", async () => {
        const container = new Container();

        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve<WebhookSignPayload.Interface>(
            WebhookSignPayload.token
        );

        const sig1 = await signer.sign("body", 1000, "whsec_abc");
        const sig2 = await signer.sign("body", 1000, "whsec_abc");

        expect(sig1).toBe(sig2);
    });

    it("produces different signatures for different timestamps", async () => {
        const container = new Container();

        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve<WebhookSignPayload.Interface>(
            WebhookSignPayload.token
        );

        const sig1 = await signer.sign("body", 1000, "whsec_abc");
        const sig2 = await signer.sign("body", 2000, "whsec_abc");

        expect(sig1).not.toBe(sig2);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test packages/webhooks 2>&1 | tail -20
```

Expected: FAIL — `WebhookSignPayloadFeature` not found / module not found.

- [ ] **Step 3: Create `src/api/features/WebhookSignPayload/WebhookSignPayloadImpl.ts`**

```ts
import { createHmac } from "node:crypto";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/abstractions.js";

class WebhookSignPayloadImpl implements WebhookSignPayload.Interface {
    async sign(rawBody: string, timestamp: number, secret: string): Promise<string> {
        const signedPayload = `${timestamp}.${rawBody}`;
        const hmac = createHmac("sha256", secret).update(signedPayload).digest("hex");
        return `t=${timestamp},v1=${hmac}`;
    }
}

export default WebhookSignPayload.createImplementation({
    implementation: WebhookSignPayloadImpl,
    dependencies: []
});
```

- [ ] **Step 4: Create `src/api/features/WebhookSignPayload/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import WebhookSignPayloadImpl from "./WebhookSignPayloadImpl.js";

export const WebhookSignPayloadFeature = createFeature({
    name: "WebhookSignPayload",
    register(container) {
        container.register(WebhookSignPayloadImpl).inSingletonScope();
    }
});
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test packages/webhooks 2>&1 | tail -20
```

Expected: PASS for all 3 WebhookSignPayload tests.

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/api/features/WebhookSignPayload/ packages/webhooks/__tests__/WebhookSignPayload.test.ts
git commit -m "feat(webhooks): implement WebhookSignPayload with HMAC-SHA256 signing"
```

---

## Task 6: `WebhookDispatcher` implementation

Queries enabled webhooks subscribed to `eventName`, then dispatches one `SendWebhookTask` per match. Fire-and-forget — does not await task completion.

**Files:**
- Create: `packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcherImpl.ts`
- Create: `packages/webhooks/src/api/features/WebhookDispatcher/feature.ts`
- Create: `packages/webhooks/__tests__/WebhookDispatcher.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// packages/webhooks/__tests__/WebhookDispatcher.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";
import { WebhookDispatcherFeature } from "~/api/features/WebhookDispatcher/feature.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import type { IWebhook } from "~/api/domain/types.js";

const makeWebhook = (id: string, slug: string, events: string[]): IWebhook => ({
    id,
    values: {
        name: "Test Webhook",
        slug,
        endpointUrl: "https://example.com/hook",
        enabled: true,
        events
    }
});

describe("WebhookDispatcher", () => {
    let container: Container;
    let triggerMock: ReturnType<typeof vi.fn>;
    let listRepoMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        triggerMock = vi.fn().mockResolvedValue(Result.ok({ id: "task-1" }));
        listRepoMock = vi.fn();

        container.bind(TaskService.token).toConstantValue({
            trigger: triggerMock,
            abort: vi.fn(),
            fetchServiceInfo: vi.fn()
        });

        container.bind(ListWebhooksRepository.token).toConstantValue({
            execute: listRepoMock
        });

        WebhookDispatcherFeature.register(container);
    });

    it("dispatches one task per matching webhook", async () => {
        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [
                    makeWebhook("wh-1", "shop-sync", ["product.entry.published"]),
                    makeWebhook("wh-2", "erp-sync", ["product.entry.published"])
                ],
                meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
            })
        );

        const dispatcher = container.resolve<WebhookDispatcher.Interface>(
            WebhookDispatcher.token
        );

        await dispatcher.dispatch("product.entry.published", { entryId: "abc" });

        expect(listRepoMock).toHaveBeenCalledWith({
            where: { enabled: true, events: "product.entry.published" }
        });
        expect(triggerMock).toHaveBeenCalledTimes(2);
        expect(triggerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                definition: "sendWebhook",
                input: {
                    webhookId: "wh-1",
                    eventName: "product.entry.published",
                    data: { entryId: "abc" }
                }
            })
        );
    });

    it("dispatches no tasks when no matching webhooks", async () => {
        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            })
        );

        const dispatcher = container.resolve<WebhookDispatcher.Interface>(
            WebhookDispatcher.token
        );

        await dispatcher.dispatch("product.entry.published", {});

        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("does not throw when ListWebhooksRepository fails", async () => {
        listRepoMock.mockResolvedValue(
            Result.fail(new Error("DB error") as any)
        );

        const dispatcher = container.resolve<WebhookDispatcher.Interface>(
            WebhookDispatcher.token
        );

        await expect(
            dispatcher.dispatch("product.entry.published", {})
        ).resolves.toBeUndefined();

        expect(triggerMock).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn test packages/webhooks 2>&1 | tail -20
```

Expected: FAIL — `WebhookDispatcherFeature` not found.

- [ ] **Step 3: Create `src/api/features/WebhookDispatcher/WebhookDispatcherImpl.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";

class WebhookDispatcherImpl implements WebhookDispatcher.Interface {
    constructor(
        private listWebhooksRepository: ListWebhooksRepository.Interface,
        private taskService: TaskService.Interface
    ) {}

    async dispatch(eventName: string, data: object): Promise<void> {
        const result = await this.listWebhooksRepository.execute({
            where: { enabled: true, events: eventName }
        });

        if (result.isFail()) {
            return;
        }

        for (const webhook of result.value.items) {
            await this.taskService.trigger({
                definition: SEND_WEBHOOK_TASK,
                name: `Send webhook: ${webhook.values.slug} — ${eventName}`,
                input: {
                    webhookId: webhook.id,
                    eventName,
                    data
                }
            });
        }
    }
}

export default WebhookDispatcher.createImplementation({
    implementation: WebhookDispatcherImpl,
    dependencies: [ListWebhooksRepository, TaskService]
});
```

- [ ] **Step 4: Create `src/api/features/WebhookDispatcher/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import WebhookDispatcherImpl from "./WebhookDispatcherImpl.js";

export const WebhookDispatcherFeature = createFeature({
    name: "WebhookDispatcher",
    register(container) {
        container.register(WebhookDispatcherImpl).inSingletonScope();
    }
});
```

- [ ] **Step 5: Run test to verify it passes**

```bash
yarn test packages/webhooks 2>&1 | tail -20
```

Expected: PASS for all 3 WebhookDispatcher tests.

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/api/features/WebhookDispatcher/ packages/webhooks/__tests__/WebhookDispatcher.test.ts
git commit -m "feat(webhooks): implement WebhookDispatcher"
```

---

## Task 7: `SendWebhookTask` background task

Fetches the webhook, reads `signingSecret` from the entry, builds the event payload, signs it, POSTs it (10-minute timeout), then writes a `WebhookDelivery` log entry regardless of outcome.

**Files:**
- Create: `packages/webhooks/src/api/features/SendWebhookTask/types.ts`
- Create: `packages/webhooks/src/api/features/SendWebhookTask/SendWebhookTask.ts`
- Create: `packages/webhooks/src/api/features/SendWebhookTask/feature.ts`
- Create: `packages/webhooks/__tests__/SendWebhookTask.test.ts`

- [ ] **Step 1: Create `src/api/features/SendWebhookTask/types.ts`**

```ts
export interface ISendWebhookTaskInput {
    webhookId: string;
    eventName: string;
    data: object;
}

export interface ISendWebhookTaskOutput {
    deliveryId?: string;
}
```

- [ ] **Step 2: Write failing test**

```ts
// packages/webhooks/__tests__/SendWebhookTask.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { SendWebhookTaskFeature } from "~/api/features/SendWebhookTask/feature.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";
import type { IWebhook } from "~/api/domain/types.js";

const makeWebhook = (): IWebhook => ({
    id: "wh-1",
    values: {
        name: "Shop Sync",
        slug: "shop-sync",
        endpointUrl: "https://example.com/hook",
        enabled: true,
        events: ["product.entry.published"],
        signingSecret: "whsec_test_secret"
    }
});

describe("SendWebhookTask", () => {
    let container: Container;
    let fetchMock: ReturnType<typeof vi.fn>;
    let createDeliveryMock: ReturnType<typeof vi.fn>;
    let getWebhookMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        fetchMock = vi.fn();
        createDeliveryMock = vi.fn().mockResolvedValue(Result.ok(null));
        getWebhookMock = vi.fn().mockResolvedValue(Result.ok(makeWebhook()));

        // Mock global fetch
        vi.stubGlobal("fetch", fetchMock);

        container.bind(GetWebhookRepository.token).toConstantValue({
            execute: getWebhookMock
        });
        container.bind(CreateWebhookDeliveryRepository.token).toConstantValue({
            execute: createDeliveryMock
        });
        container.bind(WebhookSignPayload.token).toConstantValue({
            sign: vi.fn().mockResolvedValue("t=1000,v1=abc123")
        });
        container.bind(TenantContext.token).toConstantValue({
            getTenant: vi.fn().mockReturnValue({ id: "root" }),
            setTenant: vi.fn(),
            withRootTenant: vi.fn(),
            withEachTenant: vi.fn(),
            withTenant: vi.fn()
        });

        SendWebhookTaskFeature.register(container);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const makeRunParams = (input: object, taskId = "task-123") => ({
        input,
        controller: {
            state: {
                getTask: vi.fn().mockReturnValue({ id: taskId })
            },
            response: {
                done: vi.fn().mockReturnValue({ type: "done" }),
                error: vi.fn().mockReturnValue({ type: "error" }),
                continue: vi.fn().mockReturnValue({ type: "continue" })
            }
        }
    });

    it("POSTs to endpoint and logs a successful delivery", async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            text: vi.fn().mockResolvedValue("OK")
        });

        const tasks = container.resolveAll<TaskDefinition.Interface>(TaskDefinition.token);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;
        expect(task).toBeDefined();

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            data: { entryId: "abc" }
        });

        const result = await task.run(params as any);

        expect(result).toEqual({ type: "done" });
        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/hook",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    "Webiny-Signature": "t=1000,v1=abc123"
                })
            })
        );
        expect(createDeliveryMock).toHaveBeenCalledWith(
            expect.objectContaining({
                webhookId: "wh-1",
                backgroundTaskId: "task-123",
                eventType: "product.entry.published",
                responseStatus: 200,
                responseBody: "OK"
            })
        );
    });

    it("logs a failed delivery when endpoint returns non-2xx", async () => {
        fetchMock.mockResolvedValue({
            status: 500,
            text: vi.fn().mockResolvedValue("Internal Server Error")
        });

        const tasks = container.resolveAll<TaskDefinition.Interface>(TaskDefinition.token);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            data: {}
        });

        const result = await task.run(params as any);

        // Task still completes — delivery log records the failure status
        expect(result).toEqual({ type: "done" });
        expect(createDeliveryMock).toHaveBeenCalledWith(
            expect.objectContaining({ responseStatus: 500 })
        );
    });

    it("logs a failed delivery when fetch throws (timeout / network error)", async () => {
        fetchMock.mockRejectedValue(new Error("Network error"));

        const tasks = container.resolveAll<TaskDefinition.Interface>(TaskDefinition.token);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            data: {}
        });

        const result = await task.run(params as any);

        expect(result).toEqual({ type: "done" });
        expect(createDeliveryMock).toHaveBeenCalledWith(
            expect.objectContaining({ responseStatus: 0, responseBody: "Network error" })
        );
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
yarn test packages/webhooks 2>&1 | tail -20
```

Expected: FAIL — `SendWebhookTaskFeature` not found.

- [ ] **Step 4: Create `src/api/features/SendWebhookTask/SendWebhookTask.ts`**

```ts
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { ISendWebhookTaskInput, ISendWebhookTaskOutput } from "./types.js";
import type { IWebhookPayload } from "~/api/domain/types.js";

type IRunParams = TaskDefinition.RunParams<ISendWebhookTaskInput, ISendWebhookTaskOutput>;

class SendWebhookTaskDefinition
    implements TaskDefinition.Interface<ISendWebhookTaskInput, ISendWebhookTaskOutput>
{
    id = SEND_WEBHOOK_TASK;
    title = "Send Webhook";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;
    description = "POST a signed event payload to a webhook endpoint and log the delivery.";

    constructor(
        private getWebhookRepository: GetWebhookRepository.Interface,
        private createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private signPayload: WebhookSignPayload.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async run(params: IRunParams) {
        const { input } = params;
        const taskId = params.controller.state.getTask().id;

        const webhookResult = await this.getWebhookRepository.execute(input.webhookId);
        if (webhookResult.isFail()) {
            return params.controller.response.error(webhookResult.error);
        }
        const webhook = webhookResult.value;
        const signingSecret = webhook.values.signingSecret;

        const timestamp = Math.floor(Date.now() / 1000);
        const payload: IWebhookPayload = {
            id: taskId,
            event: input.eventName,
            timestamp: new Date(timestamp * 1000).toISOString(),
            webhookId: input.webhookId,
            tenant: this.tenantContext.getTenant().id,
            data: input.data
        };
        const rawBody = JSON.stringify(payload);
        const signature = await this.signPayload.sign(rawBody, timestamp, signingSecret);

        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "Webiny-Signature": signature
        };

        const startTime = Date.now();
        let responseStatus = 0;
        let responseBody = "";

        try {
            const response = await fetch(webhook.values.endpointUrl, {
                method: "POST",
                headers: requestHeaders,
                body: rawBody,
                signal: AbortSignal.timeout(600_000)
            });
            responseStatus = response.status;
            responseBody = await response.text();
        } catch (error) {
            responseStatus = 0;
            responseBody = (error as Error).message;
        }

        const responseTime = Date.now() - startTime;
        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        await this.createDeliveryRepository.execute({
            webhookId: input.webhookId,
            backgroundTaskId: taskId,
            eventType: input.eventName,
            payload,
            requestHeaders,
            responseTime,
            responseStatus,
            responseBody,
            expiresAt
        });

        return params.controller.response.done();
    }

    createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
        return {
            webhookId: validator.string(),
            eventName: validator.string(),
            data: validator.record(validator.unknown()).optional()
        };
    }
}

export const SendWebhookTask = TaskDefinition.createImplementation({
    implementation: SendWebhookTaskDefinition,
    dependencies: [
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        WebhookSignPayload,
        TenantContext
    ]
});
```

- [ ] **Step 5: Create `src/api/features/SendWebhookTask/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import { SendWebhookTask } from "./SendWebhookTask.js";

export const SendWebhookTaskFeature = createFeature({
    name: "SendWebhookTask",
    register(container) {
        container.register(SendWebhookTask);
    }
});
```

- [ ] **Step 6: Run test to verify it passes**

```bash
yarn test packages/webhooks 2>&1 | tail -20
```

Expected: PASS for all 3 SendWebhookTask tests.

- [ ] **Step 7: Commit**

```bash
git add packages/webhooks/src/api/features/SendWebhookTask/ packages/webhooks/__tests__/SendWebhookTask.test.ts
git commit -m "feat(webhooks): implement SendWebhookTask"
```

---

**Continue in Part 3:** `docs/superpowers/plans/2026-05-11-webhooks-phase1-part3.md`
