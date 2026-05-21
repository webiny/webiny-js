import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { WebhookDispatcher, WebhookProvider } from "@webiny/api-core/features/webhooks/index.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { WebhookDispatcherFeature } from "~/api/features/WebhookDispatcher/feature.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { Webhook } from "~/api/domain/Webhook.js";

const makeWebhook = (id: string, slug: string, events: string[]): Webhook => ({
    id,
    name: "Test Webhook",
    slug,
    endpointUrl: "https://example.com/hook",
    enabled: true,
    events,
    signingSecret: "whsec_test",
    createdOn: "2026-01-01T00:00:00Z",
    savedOn: "2026-01-01T00:00:00Z"
});

describe("WebhookDispatcher", () => {
    let container: Container;
    let triggerMock: ReturnType<typeof vi.fn>;
    let listRepoMock: ReturnType<typeof vi.fn>;
    let createDeliveryMock: ReturnType<typeof vi.fn>;
    let providerMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        triggerMock = vi.fn().mockResolvedValue(Result.ok({ id: "task-1" }));
        listRepoMock = vi.fn();
        createDeliveryMock = vi
            .fn()
            .mockResolvedValue(Result.ok({ id: "del-1", webhookId: "wh-1", status: "pending" }));
        providerMock = vi.fn().mockResolvedValue([
            {
                app: "cms",
                entity: "product",
                eventName: "product.entry.published",
                label: "Published"
            }
        ]);

        container.registerInstance(TaskService, {
            trigger: triggerMock,
            abort: vi.fn(),
            fetchServiceInfo: vi.fn()
        });

        container.registerInstance(ListWebhooksRepository, {
            execute: listRepoMock
        });

        container.registerInstance(CreateWebhookDeliveryRepository, {
            execute: createDeliveryMock
        });

        container.registerInstance(WebhookProvider, {
            execute: providerMock
        });

        container.registerInstance(GetWebhookSettingsRepository, {
            execute: vi.fn().mockResolvedValue(
                Result.ok({ signingSecret: undefined, deliveryRetentionDays: undefined })
            )
        });

        WebhookDispatcherFeature.register(container);
    });

    it("creates a delivery and triggers a task per matching webhook", async () => {
        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [
                    makeWebhook("wh-1", "shop-sync", ["product.entry.published"]),
                    makeWebhook("wh-2", "erp-sync", ["product.entry.published"])
                ],
                meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
            })
        );

        const dispatcher = container.resolve(WebhookDispatcher);

        await dispatcher.dispatch("product.entry.published", { entryId: "abc" });

        expect(listRepoMock).toHaveBeenCalledWith({
            where: { enabled: true, events_contains: "product.entry.published" }
        });
        expect(createDeliveryMock).toHaveBeenCalledTimes(2);
        expect(triggerMock).toHaveBeenCalledTimes(2);
        expect(triggerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                definition: "sendWebhook",
                input: expect.objectContaining({
                    webhookId: "wh-1",
                    eventName: "product.entry.published",
                    deliveryId: "del-1"
                })
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

        const dispatcher = container.resolve(WebhookDispatcher);

        await dispatcher.dispatch("product.entry.published", {});

        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("skips when event name is not registered", async () => {
        const dispatcher = container.resolve(WebhookDispatcher);

        await dispatcher.dispatch("unknown.event", {});

        expect(listRepoMock).not.toHaveBeenCalled();
        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("does not throw when ListWebhooksRepository fails", async () => {
        listRepoMock.mockResolvedValue(Result.fail(new Error("DB error") as any));

        const dispatcher = container.resolve(WebhookDispatcher);

        await expect(dispatcher.dispatch("product.entry.published", {})).resolves.toBeUndefined();

        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("uses deliveryRetentionDays from settings to compute expiresAt", async () => {
        const retentionDays = 7;
        const settingsMock = vi.fn().mockResolvedValue(
            Result.ok({ signingSecret: undefined, deliveryRetentionDays: retentionDays })
        );
        container.registerInstance(GetWebhookSettingsRepository, { execute: settingsMock });

        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [makeWebhook("wh-1", "shop-sync", ["product.entry.published"])],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            })
        );

        const before = Date.now();
        const dispatcher = container.resolve(WebhookDispatcher);
        await dispatcher.dispatch("product.entry.published", { entryId: "abc" });
        const after = Date.now();

        const [callArgs] = createDeliveryMock.mock.calls;
        const expiresAt = new Date(callArgs[0].expiresAt).getTime();
        const expectedMin = before + retentionDays * 24 * 60 * 60 * 1000;
        const expectedMax = after + retentionDays * 24 * 60 * 60 * 1000;

        expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
        expect(expiresAt).toBeLessThanOrEqual(expectedMax);
        expect(settingsMock).toHaveBeenCalledOnce();
    });

    it("falls back to WEBHOOK_DELIVERY_MAX_RETENTION_DAYS when deliveryRetentionDays is undefined", async () => {
        container.registerInstance(GetWebhookSettingsRepository, {
            execute: vi.fn().mockResolvedValue(
                Result.ok({ signingSecret: undefined, deliveryRetentionDays: undefined })
            )
        });

        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [makeWebhook("wh-1", "shop-sync", ["product.entry.published"])],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            })
        );

        const before = Date.now();
        const dispatcher = container.resolve(WebhookDispatcher);
        await dispatcher.dispatch("product.entry.published", {});
        const after = Date.now();

        const [callArgs] = createDeliveryMock.mock.calls;
        const expiresAt = new Date(callArgs[0].expiresAt).getTime();
        const expectedMin = before + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const expectedMax = after + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000;

        expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
        expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
});
