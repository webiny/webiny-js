import { CmsEntryToWebhookDeliveryTransformer as CmsEntryToWebhookDeliveryTransformerAbstraction } from "./abstractions/CmsEntryToWebhookDeliveryTransformer.js";
import { createIdentifier } from "@webiny/utils/createIdentifier.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

class CmsEntryToWebhookDeliveryTransformerImpl
    implements CmsEntryToWebhookDeliveryTransformerAbstraction.Interface
{
    public constructor(private readonly compressionHandler: CompressionHandler.Interface) {}

    public toCmsEntry(
        webhook: CmsEntryToWebhookDeliveryTransformerAbstraction.ToCmsEntryInput
    ): CmsEntryToWebhookDeliveryTransformerAbstraction.ToCmsEntryOutput {
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
                description: webhook.description
            }
        };
    }

    public toWebhook(
        entry: CmsEntryToWebhookDeliveryTransformerAbstraction.ToWebhookDeliveryInput
    ): CmsEntryToWebhookDeliveryTransformerAbstraction.ToWebhookDeliveryOutput {
        return {
            id: entry.entryId,
            slug: entry.values.slug,
            name: entry.values.name,
            enabled: entry.values.enabled,
            endpointUrl: entry.values.endpointUrl,
            events: entry.values.events,
            description: entry.values.description,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn
        };
    }
}

export const CmsEntryToWebhookDeliveryTransformer =
    CmsEntryToWebhookDeliveryTransformerAbstraction.createImplementation({
        implementation: CmsEntryToWebhookDeliveryTransformerImpl,
        dependencies: [CompressionHandler]
    });
