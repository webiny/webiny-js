import { WebhookTransformer as WebhookTransformerAbstraction } from "./abstractions/WebhookTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Webhook, WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

class WebhookTransformerImpl implements WebhookTransformerAbstraction.Interface {
    public fromStorage(entry: CmsEntry<WebhookCmsEntryValues>): Webhook {
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

    public toStorage(webhook: Webhook): WebhookCmsEntryValues {
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
