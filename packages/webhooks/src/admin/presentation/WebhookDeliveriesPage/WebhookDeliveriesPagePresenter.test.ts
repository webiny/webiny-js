import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/ListPresenter.js";
import { AssistantPageContext } from "@webiny/app-admin/features/assistantPageContext/abstractions.js";
import { AssistantPageContext as AssistantPageContextImpl } from "@webiny/app-admin/features/assistantPageContext/AssistantPageContext.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { ListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/admin/features/resendWebhookDelivery/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { ListWebhooksUseCase } from "~/admin/features/ListWebhooks/abstractions.js";
import { WebhookDeliveriesPagePresenter as Abstraction } from "./abstractions.js";
import { WebhookDeliveriesPagePresenter } from "./WebhookDeliveriesPagePresenter.js";

const delivery = {
    id: "delivery-1",
    webhookId: "webhook-1",
    eventType: "cms.entry.published",
    status: "success"
} as WebhookDelivery;

describe("WebhookDeliveriesPagePresenter", () => {
    let presenter: Abstraction.Interface;
    let pageContext: AssistantPageContext.Interface;
    let releaseWebhooks: () => void;

    beforeEach(() => {
        const container = new Container();
        const webhooksLoaded = new Promise<void>(resolve => {
            releaseWebhooks = resolve;
        });

        container.registerInstance(ListWebhookDeliveriesUseCase, {
            execute: vi.fn(async () => ({
                data: [delivery],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            }))
        } as unknown as ListWebhookDeliveriesUseCase.Interface);
        container.registerInstance(ListAvailableEventsUseCase, {
            execute: vi.fn(async () => [])
        } as unknown as ListAvailableEventsUseCase.Interface);
        container.registerInstance(ListWebhooksUseCase, {
            execute: vi.fn(async () => {
                await webhooksLoaded;
                return { items: [{ id: "webhook-1", name: "Search index" }] };
            })
        } as unknown as ListWebhooksUseCase.Interface);
        container.registerInstance(
            ResendWebhookDeliveryUseCase,
            {} as ResendWebhookDeliveryUseCase.Interface
        );
        container.register(AssistantPageContextImpl).inSingletonScope();
        container.register(ListPresenter);
        container.register(WebhookDeliveriesPagePresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
        pageContext = container.resolve(AssistantPageContext);
    });

    it("tells the assistant the deliveries and the webhook they are filtered to, until disposed", async () => {
        const init = presenter.init("webhook-1");
        releaseWebhooks();
        await init;

        await vi.waitFor(() => {
            expect(pageContext.get()?.details["visibleRows"]).toEqual([
                { id: "delivery-1", title: "cms.entry.published (success)" }
            ]);
        });
        expect(pageContext.get()?.view).toBe("Webhook deliveries");
        expect(pageContext.get()?.details).toMatchObject({
            webhookId: "webhook-1",
            webhookName: "Search index"
        });

        presenter.dispose();
        expect(pageContext.get()).toBeNull();
    });

    it("tells the assistant nothing when the page is left before its first load finishes", async () => {
        const init = presenter.init("webhook-1");
        presenter.dispose();
        releaseWebhooks();
        await init;

        expect(pageContext.get()).toBeNull();
    });
});
