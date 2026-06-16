import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { GetWebhookDeliveryRepository } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WebhookDeliver } from "~/api/features/WebhookDeliver/abstractions.js";
import { SendWebhookTaskFeature } from "~/api/features/SendWebhookTask/feature.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";
import type { Webhook } from "~/api/domain/Webhook.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";

const makeWebhook = (): Webhook => ({
    id: "wh-1",
    name: "Shop Sync",
    slug: "shop-sync",
    endpointUrl: "https://example.com/hook",
    enabled: true,
    events: ["product.entry.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA==",
    createdOn: "2026-01-01T00:00:00Z",
    savedOn: "2026-01-01T00:00:00Z"
});

const makeDelivery = (): WebhookDelivery => ({
    id: "del-1",
    createdOn: "2026-01-01T00:00:00Z",
    savedOn: "2026-01-01T00:00:00Z",
    webhookId: "wh-1",
    backgroundTaskId: null,
    eventType: "product.entry.published",
    status: "pending",
    payload: { entryId: "abc" },
    requestHeaders: null,
    responseTime: null,
    responseStatus: null,
    responseHeaders: null,
    responseBody: null
});

const SIGN_HEADERS: WebhookSignPayload.Headers = {
    "webhook-id": "task-123",
    "webhook-timestamp": "1000",
    "webhook-signature": "v1,abc123"
};

describe("SendWebhookTask", () => {
    let container: Container;
    let deliverMock: ReturnType<typeof vi.fn>;
    let getWebhookMock: ReturnType<typeof vi.fn>;
    let getDeliveryMock: ReturnType<typeof vi.fn>;
    let updateDeliveryMock: ReturnType<typeof vi.fn>;

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
});
