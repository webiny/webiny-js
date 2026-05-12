import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { WebhookDispatcherFeature } from "~/api/features/WebhookDispatcher/feature.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import type { IWebhook } from "~/api/domain/types.js";

const makeWebhook = (id: string, slug: string, events: string[]): IWebhook => ({
    id,
    values: {
        name: "Test Webhook",
        slug,
        endpointUrl: "https://example.com/hook",
        enabled: true,
        events,
        signingSecret: "whsec_test"
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

        container.registerInstance(TaskService, {
            trigger: triggerMock,
            abort: vi.fn(),
            fetchServiceInfo: vi.fn()
        });

        container.registerInstance(ListWebhooksRepository, {
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

        const dispatcher = container.resolve(WebhookDispatcher);

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

        const dispatcher = container.resolve(WebhookDispatcher);

        await dispatcher.dispatch("product.entry.published", {});

        expect(triggerMock).not.toHaveBeenCalled();
    });

    it("does not throw when ListWebhooksRepository fails", async () => {
        listRepoMock.mockResolvedValue(Result.fail(new Error("DB error") as any));

        const dispatcher = container.resolve(WebhookDispatcher);

        await expect(dispatcher.dispatch("product.entry.published", {})).resolves.toBeUndefined();

        expect(triggerMock).not.toHaveBeenCalled();
    });
});
