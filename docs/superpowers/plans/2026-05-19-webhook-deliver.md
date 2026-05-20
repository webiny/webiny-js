# WebhookDeliver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the inline `fetch` in `SendWebhookTask` into a `WebhookDeliver` abstraction with configurable retry, exponential backoff, and 429/5xx awareness.

**Architecture:** New feature at `packages/webhooks/src/api/features/WebhookDeliver/` following the existing `WebhookSignPayload` pattern — a stateless, dependency-free service registered as a singleton. `SendWebhookTask` gains `WebhookDeliver` as a constructor dependency, replacing its inline fetch block.

**Tech Stack:** TypeScript, vitest, `@webiny/feature/api` (createAbstraction/createFeature), `@webiny/di` (Container for tests)

**Spec:** `docs/superpowers/specs/2026-05-19-webhook-deliver-design.md`

---

### Task 1: Create abstractions

**Files:**
- Create: `packages/webhooks/src/api/features/WebhookDeliver/abstractions.ts`

- [ ] **Step 1: Create the abstractions file with interfaces and DI token**

```typescript
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDeliverInput {
    url: string;
    headers: Record<string, string>;
    body: string;
    timeout: number;
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
}

export interface IWebhookDeliverResult {
    status: number;
    body: string;
    responseTime: number;
    attempts: number;
}

export interface IWebhookDeliver {
    execute(input: IWebhookDeliverInput): Promise<IWebhookDeliverResult>;
}

export const WebhookDeliver = createAbstraction<IWebhookDeliver>("Webhooks/WebhookDeliver");

export namespace WebhookDeliver {
    export type Interface = IWebhookDeliver;
    export type Input = IWebhookDeliverInput;
    export type Result = IWebhookDeliverResult;
}
```

- [ ] **Step 2: Verify file compiles**

Run: `yarn check -p @webiny/webhooks 2>&1 | tail -5`
Expected: type check passes.

---

### Task 2: Write tests for WebhookDeliver

**Files:**
- Create: `packages/webhooks/__tests__/WebhookDeliver.test.ts`

All tests mock `globalThis.fetch` via `vi.stubGlobal`. Use tiny delay values (`initialDelay: 1`, `maxDelay: 10`) so retries are fast. Tests resolve the implementation via the DI container, matching the `WebhookSignPayload.test.ts` pattern.

- [ ] **Step 1: Write test scaffolding with helpers**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "@webiny/di";
import { WebhookDeliver } from "~/api/features/WebhookDeliver/abstractions.js";
import { WebhookDeliverFeature } from "~/api/features/WebhookDeliver/feature.js";
import type { IWebhookDeliverInput } from "~/api/features/WebhookDeliver/abstractions.js";

const makeInput = (overrides?: Partial<IWebhookDeliverInput>): IWebhookDeliverInput => ({
    url: "https://example.com/hook",
    headers: { "Content-Type": "application/json" },
    body: '{"event":"test"}',
    timeout: 5000,
    maxRetries: 3,
    initialDelay: 1,
    maxDelay: 10,
    ...overrides
});

const mockResponse = (status: number, body = "OK", headers?: Record<string, string>) => ({
    status,
    text: vi.fn().mockResolvedValue(body),
    headers: {
        get: vi.fn().mockImplementation((name: string) => headers?.[name] ?? null)
    }
});
```

- [ ] **Step 2: Write test — successful first attempt**

```typescript
describe("WebhookDeliver", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const resolve = (): WebhookDeliver.Interface => {
        const container = new Container();
        WebhookDeliverFeature.register(container);
        return container.resolve(WebhookDeliver);
    };

    it("returns 200 on successful first attempt with attempts: 1", async () => {
        fetchMock.mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.body).toBe("OK");
        expect(result.attempts).toBe(1);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
```

- [ ] **Step 3: Write test — network error then success**

```typescript
    it("retries on network error and succeeds on second attempt", async () => {
        fetchMock
            .mockRejectedValueOnce(new Error("ECONNREFUSED"))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
```

- [ ] **Step 4: Write test — 5xx then success**

```typescript
    it("retries on 502 and succeeds on second attempt", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(502, "Bad Gateway"))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
    });
```

- [ ] **Step 5: Write test — 429 with Retry-After header**

```typescript
    it("retries on 429 and respects Retry-After header", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(429, "Too Many Requests", { "retry-after": "1" }))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ initialDelay: 1, maxDelay: 2000 }));

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
        expect(result.responseTime).toBeGreaterThanOrEqual(1000);
    });
```

- [ ] **Step 6: Write test — 429 with unparseable Retry-After**

```typescript
    it("falls back to exponential backoff when Retry-After is unparseable", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(429, "Too Many Requests", { "retry-after": "garbage" }))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
    });
```

- [ ] **Step 7: Write test — all retries exhausted**

```typescript
    it("returns last attempt result when all retries are exhausted", async () => {
        fetchMock.mockResolvedValue(mockResponse(503, "Service Unavailable"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ maxRetries: 2 }));

        expect(result.status).toBe(503);
        expect(result.body).toBe("Service Unavailable");
        expect(result.attempts).toBe(3);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
```

- [ ] **Step 8: Write test — maxRetries: 0 means single attempt**

```typescript
    it("does not retry when maxRetries is 0", async () => {
        fetchMock.mockRejectedValue(new Error("timeout"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ maxRetries: 0 }));

        expect(result.status).toBe(0);
        expect(result.body).toBe("timeout");
        expect(result.attempts).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
```

- [ ] **Step 9: Write test — non-retryable 4xx is terminal**

```typescript
    it("does not retry on 400 Bad Request", async () => {
        fetchMock.mockResolvedValue(mockResponse(400, "Bad Request"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(400);
        expect(result.attempts).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
```

- [ ] **Step 10: Write test — exponential backoff caps at maxDelay**

```typescript
    it("caps delay at maxDelay", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(500, "err"))
            .mockResolvedValueOnce(mockResponse(500, "err"))
            .mockResolvedValueOnce(mockResponse(500, "err"))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({
            maxRetries: 3,
            initialDelay: 100,
            maxDelay: 150
        }));

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(4);
        /* With initialDelay=100, maxDelay=150:
           retry 0 delay = min(100*2^0, 150) = 100
           retry 1 delay = min(100*2^1, 150) = 150
           retry 2 delay = min(100*2^2, 150) = 150
           Total delay ~400ms. With overhead, responseTime should be in [400, 800]. */
        expect(result.responseTime).toBeGreaterThanOrEqual(400);
        expect(result.responseTime).toBeLessThan(2000);
    });
```

- [ ] **Step 11: Close the describe block**

```typescript
    it("returns status 0 when all retries fail with network errors", async () => {
        fetchMock.mockRejectedValue(new Error("DNS lookup failed"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ maxRetries: 1 }));

        expect(result.status).toBe(0);
        expect(result.body).toBe("DNS lookup failed");
        expect(result.attempts).toBe(2);
    });
});
```

- [ ] **Step 12: Run tests to verify they fail**

Run: `yarn test packages/webhooks -- --testPathPattern="WebhookDeliver" 2>&1 | tail -20`
Expected: all tests FAIL (feature/implementation files don't exist yet).

---

### Task 3: Implement WebhookDeliver

**Files:**
- Create: `packages/webhooks/src/api/features/WebhookDeliver/WebhookDeliver.ts`

- [ ] **Step 1: Write the implementation**

```typescript
import {
    WebhookDeliver as Abstraction,
    type IWebhookDeliverInput,
    type IWebhookDeliverResult
} from "./abstractions.js";

interface IAttemptResult {
    status: number;
    body: string;
    retryAfter: string | null;
}

class WebhookDeliverImpl implements Abstraction.Interface {
    public async execute(input: IWebhookDeliverInput): Promise<IWebhookDeliverResult> {
        const startTime = Date.now();
        let attempts = 0;
        let lastResult: IAttemptResult = { status: 0, body: "", retryAfter: null };

        for (let i = 0; i <= input.maxRetries; i++) {
            if (i > 0) {
                const delay = this.computeDelay(i - 1, input, lastResult);
                await this.sleep(delay);
            }

            attempts++;
            lastResult = await this.attempt(input);

            if (!this.isRetryable(lastResult.status)) {
                break;
            }
        }

        return {
            status: lastResult.status,
            body: lastResult.body,
            responseTime: Date.now() - startTime,
            attempts
        };
    }

    private async attempt(input: IWebhookDeliverInput): Promise<IAttemptResult> {
        try {
            const response = await fetch(input.url, {
                method: "POST",
                headers: input.headers,
                body: input.body,
                signal: AbortSignal.timeout(input.timeout)
            });

            const body = await response.text();
            const retryAfter = response.headers.get("retry-after");

            return { status: response.status, body, retryAfter };
        } catch (error) {
            return {
                status: 0,
                body: error instanceof Error ? error.message : "Unknown fetch error",
                retryAfter: null
            };
        }
    }

    private isRetryable(status: number): boolean {
        if (status === 0 || status === 429) {
            return true;
        }
        return status >= 500 && status <= 599;
    }

    private computeDelay(
        retryIndex: number,
        input: IWebhookDeliverInput,
        lastResult: IAttemptResult
    ): number {
        const exponential = Math.min(
            input.initialDelay * Math.pow(2, retryIndex),
            input.maxDelay
        );

        if (lastResult.status === 429 && lastResult.retryAfter) {
            const parsed = this.parseRetryAfter(lastResult.retryAfter);
            if (parsed !== null) {
                return Math.max(parsed, exponential);
            }
        }

        return exponential;
    }

    private parseRetryAfter(value: string): number | null {
        const seconds = Number(value);
        if (!Number.isNaN(seconds) && Number.isFinite(seconds) && seconds >= 0) {
            return seconds * 1000;
        }

        const dateMs = Date.parse(value);
        if (!Number.isNaN(dateMs)) {
            return Math.max(0, dateMs - Date.now());
        }

        return null;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const WebhookDeliver = Abstraction.createImplementation({
    implementation: WebhookDeliverImpl,
    dependencies: []
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `yarn test packages/webhooks -- --testPathPattern="WebhookDeliver" 2>&1 | tail -20`
Expected: all tests PASS.

---

### Task 4: Feature registration and exports

**Files:**
- Create: `packages/webhooks/src/api/features/WebhookDeliver/feature.ts`
- Create: `packages/webhooks/src/api/features/WebhookDeliver/index.ts`

- [ ] **Step 1: Create feature.ts**

```typescript
import { createFeature } from "@webiny/feature/api";
import { WebhookDeliver } from "./WebhookDeliver.js";

export const WebhookDeliverFeature = createFeature({
    name: "Webhooks/WebhookDeliver",
    register(container) {
        container.register(WebhookDeliver).inSingletonScope();
    }
});
```

- [ ] **Step 2: Create index.ts**

```typescript
export { WebhookDeliver } from "./abstractions.js";
export { WebhookDeliverFeature } from "./feature.js";
```

- [ ] **Step 3: Run tests again to confirm everything still passes**

Run: `yarn test packages/webhooks -- --testPathPattern="WebhookDeliver" 2>&1 | tail -20`
Expected: all tests PASS.

---

### Task 5: Wire WebhookDeliver into SendWebhookTask

**Files:**
- Modify: `packages/webhooks/src/api/features/SendWebhookTask/SendWebhookTask.ts`

- [ ] **Step 1: Add import for WebhookDeliver**

Add this import alongside the existing ones at the top of `SendWebhookTask.ts`:

```typescript
import { WebhookDeliver } from "~/api/features/WebhookDeliver/abstractions.js";
```

- [ ] **Step 2: Add WebhookDeliver to constructor**

Add a new constructor parameter after `getWebhookSettingsRepository`:

```typescript
    public constructor(
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly getWebhookDeliveryRepository: GetWebhookDeliveryRepository.Interface,
        private readonly updateDeliveryRepository: UpdateWebhookDeliveryRepository.Interface,
        private readonly signPayload: WebhookSignPayload.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly getWebhookSettingsRepository: GetWebhookSettingsRepository.Interface,
        private readonly deliver: WebhookDeliver.Interface
    ) {}
```

- [ ] **Step 3: Replace inline fetch block with deliver.execute()**

Replace lines 92-110 (the `startTime`, `responseStatus`, `responseBody`, `try/catch fetch`, `responseTime` block) with:

```typescript
        const result = await this.deliver.execute({
            url: webhook.endpointUrl,
            headers: requestHeaders,
            body: rawBody,
            timeout: 600_000,
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 30_000
        });
```

- [ ] **Step 4: Update the delivery record using result fields**

Replace the `updateDeliveryRepository.execute` call that used the old variables with:

```typescript
        await this.updateDeliveryRepository.execute(input.deliveryId, {
            payload,
            requestHeaders,
            responseTime: result.responseTime,
            responseStatus: result.status,
            responseBody: result.body,
            status: result.status > 0 ? "delivered" : "failed"
        });
```

- [ ] **Step 5: Add WebhookDeliver to dependencies array**

Update the `createImplementation` call at the bottom:

```typescript
export const SendWebhookTask = TaskDefinition.createImplementation({
    implementation: SendWebhookTaskDefinition,
    dependencies: [
        GetWebhookRepository,
        GetWebhookDeliveryRepository,
        UpdateWebhookDeliveryRepository,
        WebhookSignPayload,
        TenantContext,
        GetWebhookSettingsRepository,
        WebhookDeliver
    ]
});
```

---

### Task 6: Update SendWebhookTask tests

**Files:**
- Modify: `packages/webhooks/__tests__/SendWebhookTask.test.ts`

The `SendWebhookTask` now depends on `WebhookDeliver`. Tests must register a mock instance. Since the task no longer calls `fetch` directly, the tests should mock `WebhookDeliver` instead of `fetch`.

- [ ] **Step 1: Add WebhookDeliver import**

```typescript
import { WebhookDeliver } from "~/api/features/WebhookDeliver/abstractions.js";
```

- [ ] **Step 2: Replace fetchMock with deliverMock**

In the `beforeEach`, remove `fetchMock = vi.fn()` and `vi.stubGlobal("fetch", fetchMock)`. Remove `afterEach` with `vi.unstubAllGlobals()`. Add a `deliverMock` instead:

```typescript
    let deliverMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        deliverMock = vi.fn();
        getWebhookMock = vi.fn().mockResolvedValue(Result.ok(makeWebhook()));
        getDeliveryMock = vi.fn().mockResolvedValue(Result.ok(makeDelivery()));
        updateDeliveryMock = vi.fn().mockResolvedValue(Result.ok(makeDelivery()));

        container.registerInstance(GetWebhookRepository, { execute: getWebhookMock });
        container.registerInstance(GetWebhookDeliveryRepository, { execute: getDeliveryMock });
        container.registerInstance(UpdateWebhookDeliveryRepository, {
            execute: updateDeliveryMock
        });
        container.registerInstance(WebhookSignPayload, {
            sign: vi.fn().mockResolvedValue(SIGN_HEADERS)
        });
        container.registerInstance(TenantContext, {
            getTenant: vi.fn().mockReturnValue({ id: "root" }),
            setTenant: vi.fn(),
            withRootTenant: vi.fn(),
            withEachTenant: vi.fn(),
            withTenant: vi.fn()
        });
        container.registerInstance(GetWebhookSettingsRepository, {
            execute: vi.fn().mockResolvedValue(Result.ok({ signingSecret: undefined }))
        });
        container.registerInstance(WebhookDeliver, { execute: deliverMock });

        SendWebhookTaskFeature.register(container);
    });
```

- [ ] **Step 3: Update first test — successful delivery**

The mock now returns a `WebhookDeliver.Result` instead of a raw fetch Response:

```typescript
    it("POSTs to endpoint with Standard Webhooks headers and updates delivery", async () => {
        deliverMock.mockResolvedValue({
            status: 200,
            body: "OK",
            responseTime: 42,
            attempts: 1
        });

        const tasks = container.resolveAll(TaskDefinition);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;
        expect(task).toBeDefined();

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            deliveryId: "del-1"
        });

        const result = await task.run(params as any);

        expect(result).toEqual({ type: "done" });
        expect(deliverMock).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "https://example.com/hook",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    "webhook-id": "task-123"
                }),
                maxRetries: 3
            })
        );
        expect(updateDeliveryMock).toHaveBeenCalledWith(
            "del-1",
            expect.objectContaining({
                status: "delivered",
                responseStatus: 200,
                responseBody: "OK"
            })
        );
    });
```

- [ ] **Step 4: Update second test — non-2xx is now "delivered" (fetch succeeded)**

```typescript
    it("updates delivery as delivered when endpoint returns 500 (fetch succeeded)", async () => {
        deliverMock.mockResolvedValue({
            status: 500,
            body: "Internal Server Error",
            responseTime: 3500,
            attempts: 4
        });

        const tasks = container.resolveAll(TaskDefinition);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            deliveryId: "del-1"
        });

        const result = await task.run(params as any);

        expect(result).toEqual({ type: "done" });
        expect(updateDeliveryMock).toHaveBeenCalledWith(
            "del-1",
            expect.objectContaining({ status: "delivered", responseStatus: 500 })
        );
    });
```

- [ ] **Step 5: Update third test — network failure (status 0 = failed)**

```typescript
    it("updates delivery as failed when all retries exhaust with network errors", async () => {
        deliverMock.mockResolvedValue({
            status: 0,
            body: "Network error",
            responseTime: 7000,
            attempts: 4
        });

        const tasks = container.resolveAll(TaskDefinition);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            deliveryId: "del-1"
        });

        const result = await task.run(params as any);

        expect(result).toEqual({ type: "done" });
        expect(updateDeliveryMock).toHaveBeenCalledWith(
            "del-1",
            expect.objectContaining({
                status: "failed",
                responseStatus: 0,
                responseBody: "Network error"
            })
        );
    });
```

- [ ] **Step 6: Run all webhook tests**

Run: `yarn test packages/webhooks 2>&1 | tail -20`
Expected: all tests pass.

---

### Task 7: Register in WebhooksFeature

**Files:**
- Modify: `packages/webhooks/src/api/WebhooksFeature.ts`

- [ ] **Step 1: Add import**

Add alongside the existing `WebhookSignPayloadFeature` import:

```typescript
import { WebhookDeliverFeature } from "./features/WebhookDeliver/feature.js";
```

- [ ] **Step 2: Register in the "Core implementations" section**

Add after `WebhookSignPayloadFeature.register(container);`:

```typescript
        WebhookDeliverFeature.register(container);
```

---

### Task 8: Pre-commit checks and commit

- [ ] **Step 1: Stage and run pre-commit checklist**

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

If any step fails and you fix something, rerun from the top.

- [ ] **Step 2: Build the package**

Run: `yarn build -p @webiny/webhooks 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 3: Type check**

Run: `yarn check -p @webiny/webhooks 2>&1 | tail -5`
Expected: type check passes.

- [ ] **Step 4: Run full test suite**

Run: `yarn test packages/webhooks 2>&1 | tail -20`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(webhooks): extract WebhookDeliver abstraction with retry and exponential backoff"
```
