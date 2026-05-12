import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
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
        createDeliveryMock = vi.fn().mockResolvedValue(Result.ok(undefined));
        getWebhookMock = vi.fn().mockResolvedValue(Result.ok(makeWebhook()));

        vi.stubGlobal("fetch", fetchMock);

        container.registerInstance(GetWebhookRepository, { execute: getWebhookMock });
        container.registerInstance(CreateWebhookDeliveryRepository, {
            execute: createDeliveryMock
        });
        container.registerInstance(WebhookSignPayload, {
            sign: vi.fn().mockResolvedValue({ hash: "t=1000,v1=abc123" })
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

    it("POSTs to endpoint and logs a successful delivery", async () => {
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

        const tasks = container.resolveAll(TaskDefinition);
        const task = tasks.find(t => t.id === SEND_WEBHOOK_TASK)!;

        const params = makeRunParams({
            webhookId: "wh-1",
            eventName: "product.entry.published",
            data: {}
        });

        const result = await task.run(params as any);

        expect(result).toEqual({ type: "done" });
        expect(createDeliveryMock).toHaveBeenCalledWith(
            expect.objectContaining({ responseStatus: 500 })
        );
    });

    it("logs a failed delivery when fetch throws (timeout / network error)", async () => {
        fetchMock.mockRejectedValue(new Error("Network error"));

        const tasks = container.resolveAll(TaskDefinition);
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
