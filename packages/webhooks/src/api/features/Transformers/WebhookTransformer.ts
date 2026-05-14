import { WebhookTransformer as WebhookTransformerAbstraction } from "./abstractions/WebhookTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";

class WebhookTransformerImpl implements WebhookTransformerAbstraction.Interface {
    async fromStorage(entry: CmsEntry<WebhookCmsEntry["values"]>): Promise<Webhook> {
        return {
            id: entry.entryId,
            name: entry.values.name,
            slug: entry.values.slug,
            endpointUrl: entry.values.endpointUrl,
            description: entry.values.description,
            enabled: entry.values.enabled,
            events: entry.values.events,
            signingSecret: entry.values.signingSecret,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn
        };
    }

    async toStorage(webhook: Webhook): Promise<WebhookCmsEntry["values"]> {
        return {
            name: webhook.name,
            slug: webhook.slug,
            endpointUrl: webhook.endpointUrl,
            description: webhook.description,
            enabled: webhook.enabled,
            events: webhook.events,
            signingSecret: webhook.signingSecret
        };
    }
}

export const WebhookTransformer = WebhookTransformerAbstraction.createImplementation({
    implementation: WebhookTransformerImpl,
    dependencies: []
});
