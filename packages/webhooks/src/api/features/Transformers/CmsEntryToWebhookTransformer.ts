import { CmsEntryToWebhookTransformer as CmsEntryToWebhookTransformerAbstraction } from "./abstractions/CmsEntryToWebhookTransformer.js";
import { createIdentifier } from "@webiny/utils/createIdentifier.js";

class CmsEntryToWebhookTransformerImpl
    implements CmsEntryToWebhookTransformerAbstraction.Interface
{
    public toCmsEntry(
        webhook: CmsEntryToWebhookTransformerAbstraction.ToCmsEntryInput
    ): CmsEntryToWebhookTransformerAbstraction.ToCmsEntryOutput {
        return {
            id: createIdentifier({
                id: webhook.id,
                version: 1
            }),
            values: {
                name: webhook.name,
                enabled: webhook.enabled,
                endpointUrl: webhook.endpointUrl,
                events: webhook.events,
                slug: webhook.slug,
                description: webhook.description,
                signingSecret: webhook.signingSecret
            }
        };
    }

    public toWebhook(
        entry: CmsEntryToWebhookTransformerAbstraction.ToWebhookInput
    ): CmsEntryToWebhookTransformerAbstraction.ToWebhookOutput {
        return {
            id: entry.entryId,
            slug: entry.values.slug,
            name: entry.values.name,
            enabled: entry.values.enabled,
            endpointUrl: entry.values.endpointUrl,
            events: entry.values.events,
            description: entry.values.description,
            signingSecret: entry.values.signingSecret,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn
        };
    }
}

export const CmsEntryToWebhookTransformer =
    CmsEntryToWebhookTransformerAbstraction.createImplementation({
        implementation: CmsEntryToWebhookTransformerImpl,
        dependencies: []
    });
