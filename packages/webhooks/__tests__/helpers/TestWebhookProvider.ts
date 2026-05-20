import { WebhookProvider } from "@webiny/api-core/features/webhooks/index.js";
import type { IWebhookProvider } from "@webiny/api-core/features/webhooks/Webhook/abstractions/WebhookProvider.js";
import type { IWebhookFactoryDefinition } from "@webiny/api-core/features/webhooks/Webhook/abstractions/WebhookFactory.js";
import { createFeature } from "@webiny/feature/api";

export const TEST_EVENTS: IWebhookFactoryDefinition[] = [
    {
        app: "cms",
        appLabel: "Headless CMS",
        entity: "product",
        entityLabel: "Product",
        eventName: "cms.entry.product.created",
        label: "Created"
    },
    {
        app: "cms",
        entity: "product",
        entityLabel: "Product",
        appLabel: "Headless CMS",
        eventName: "cms.entry.product.published",
        label: "Published"
    },
    {
        app: "wb",
        entity: "page",
        entityLabel: "Pages",
        appLabel: "Website Builder",
        eventName: "wb.page.published",
        label: "Published"
    }
];

class TestWebhookProviderImpl implements IWebhookProvider {
    async execute(): Promise<IWebhookFactoryDefinition[]> {
        return TEST_EVENTS;
    }
}

const testProvider = new TestWebhookProviderImpl();

export const TestWebhookProviderFeature = createFeature({
    name: "TestWebhookProvider",
    register(container) {
        container.registerInstance(WebhookProvider, testProvider);
    }
});
