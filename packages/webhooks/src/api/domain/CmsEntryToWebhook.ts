import type { IWebhook, IWebhookValues } from "~/api/domain/types.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";

export class CmsEntryToWebhook {
    public static map(input: CmsEntry<IWebhookValues>): IWebhook {
        return {
            id: input.entryId,
            name: input.values.name,
            slug: input.values.slug,
            endpointUrl: input.values.endpointUrl,
            description: input.values.description,
            enabled: input.values.enabled,
            events: input.values.events,
            signingSecret: input.values.signingSecret,
            createdOn: input.createdOn,
            savedOn: input.savedOn
        };
    }
}
