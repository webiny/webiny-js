import { WebhookFactory as WebhookFactoryAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class WbWebhookFactoryImpl implements WebhookFactoryAbstraction.Interface {
    public async execute(): Promise<WebhookFactoryAbstraction.Definition[]> {
        return [
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPageCreated,
                label: "Page: Created"
            },
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPageUpdated,
                label: "Page: Updated"
            },
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPagePublished,
                label: "Page: Published"
            },
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPageUnpublished,
                label: "Page: Unpublished"
            },
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPageDeleted,
                label: "Page: Deleted"
            },
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPageTrashed,
                label: "Page: Trashed"
            },
            {
                app: "wb",
                entity: "page",
                eventName: WebhookEvent.WbPageRestored,
                label: "Page: Restored"
            },
            {
                app: "wb",
                entity: "redirect",
                eventName: WebhookEvent.WbRedirectCreated,
                label: "Redirect: Created"
            },
            {
                app: "wb",
                entity: "redirect",
                eventName: WebhookEvent.WbRedirectUpdated,
                label: "Redirect: Updated"
            },
            {
                app: "wb",
                entity: "redirect",
                eventName: WebhookEvent.WbRedirectDeleted,
                label: "Redirect: Deleted"
            }
        ];
    }
}

export const WbWebhookFactory = WebhookFactoryAbstraction.createImplementation({
    implementation: WbWebhookFactoryImpl,
    dependencies: []
});
