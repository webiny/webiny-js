import { WebhookFactory as WebhookFactoryAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class WbWebhookFactoryImpl implements WebhookFactoryAbstraction.Interface {
    public async execute(): Promise<WebhookFactoryAbstraction.Definition[]> {
        return [
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPageCreated,
                label: "Created"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPageUpdated,
                label: "Updated"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPagePublished,
                label: "Published"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPageUnpublished,
                label: "Unpublished"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPageDeleted,
                label: "Deleted"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPageTrashed,
                label: "Trashed"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "page",
                entityLabel: "Pages",
                eventName: WebhookEvent.WbPageRestored,
                label: "Restored"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "redirect",
                entityLabel: "Redirects",
                eventName: WebhookEvent.WbRedirectCreated,
                label: "Created"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "redirect",
                entityLabel: "Redirects",
                eventName: WebhookEvent.WbRedirectUpdated,
                label: "Updated"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "redirect",
                entityLabel: "Redirects",
                eventName: WebhookEvent.WbRedirectDeleted,
                label: "Deleted"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "layout",
                entityLabel: "Layouts",
                eventName: WebhookEvent.WbLayoutCreated,
                label: "Created"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "layout",
                entityLabel: "Layouts",
                eventName: WebhookEvent.WbLayoutUpdated,
                label: "Updated"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "layout",
                entityLabel: "Layouts",
                eventName: WebhookEvent.WbLayoutPublished,
                label: "Published"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "layout",
                entityLabel: "Layouts",
                eventName: WebhookEvent.WbLayoutUnpublished,
                label: "Unpublished"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "layout",
                entityLabel: "Layouts",
                eventName: WebhookEvent.WbLayoutDeleted,
                label: "Deleted"
            },
            {
                app: "wb",
                appLabel: "Website Builder",
                entity: "globalComponent",
                entityLabel: "Global Components",
                eventName: WebhookEvent.WbGlobalComponentSaved,
                label: "Saved"
            }
        ];
    }
}

export const WbWebhookFactory = WebhookFactoryAbstraction.createImplementation({
    implementation: WbWebhookFactoryImpl,
    dependencies: []
});
