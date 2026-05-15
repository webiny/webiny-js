import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { GetWebhookDeliveryRepository } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
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
    let fetchMock: ReturnType<typeof vi.fn>;
    let getWebhookMock: ReturnType<typeof vi.fn>;
    let getDeliveryMock: ReturnType<typeof vi.fn>;
    let updateDeliveryMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        fetchMock = vi.fn();
        getWebhookMock = vi.fn().mockResolvedValue(Result.ok(makeWebhook()));
        getDeliveryMock = vi.fn().mockResolvedValue(Result.ok(makeDelivery()));
        updateDeliveryMock = vi.fn().mockResolvedValue(Result.ok(makeDelivery()));

        vi.stubGlobal("fetch", fetchMock);

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

    it("POSTs to endpoint with Standard Webhooks headers and updates delivery", async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            text: vi.fn().mockResolvedValue("OK")
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
        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.com/hook",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    "webhook-id": "task-123",
                    "webhook-timestamp": "1000",
                    "webhook-signature": "v1,abc123"
                })
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

    it("updates delivery as failed when endpoint returns non-2xx", async () => {
        fetchMock.mockResolvedValue({
            status: 500,
            text: vi.fn().mockResolvedValue("Internal Server Error")
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

    it("updates delivery as failed when fetch throws", async () => {
        fetchMock.mockRejectedValue(new Error("Network error"));

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
