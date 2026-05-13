import { WebhookEventProvider as WebhookEventProviderAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import type { IWebhookEventDefinition } from "@webiny/api-core/features/webhooks/index.js";

class WbWebhookEventProviderImpl implements WebhookEventProviderAbstraction.Interface {
    async getAvailableEvents(): Promise<IWebhookEventDefinition[]> {
        return [
            { app: "wb", modelId: "page", eventName: "wb.page.created", label: "Page: Created" },
            { app: "wb", modelId: "page", eventName: "wb.page.updated", label: "Page: Updated" },
            {
                app: "wb",
                modelId: "page",
                eventName: "wb.page.published",
                label: "Page: Published"
            },
            {
                app: "wb",
                modelId: "page",
                eventName: "wb.page.unpublished",
                label: "Page: Unpublished"
            },
            { app: "wb", modelId: "page", eventName: "wb.page.deleted", label: "Page: Deleted" },
            { app: "wb", modelId: "page", eventName: "wb.page.trashed", label: "Page: Trashed" },
            {
                app: "wb",
                modelId: "page",
                eventName: "wb.page.restored",
                label: "Page: Restored"
            },
            {
                app: "wb",
                modelId: "redirect",
                eventName: "wb.redirect.created",
                label: "Redirect: Created"
            },
            {
                app: "wb",
                modelId: "redirect",
                eventName: "wb.redirect.updated",
                label: "Redirect: Updated"
            },
            {
                app: "wb",
                modelId: "redirect",
                eventName: "wb.redirect.deleted",
                label: "Redirect: Deleted"
            }
        ];
    }
}

export const WbWebhookEventProvider = WebhookEventProviderAbstraction.createImplementation({
    implementation: WbWebhookEventProviderImpl,
    dependencies: []
});
