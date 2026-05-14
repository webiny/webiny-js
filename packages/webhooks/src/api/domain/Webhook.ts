/* Shape of webhook data stored in the CMS (nested values). */

export interface WebhookCmsEntryValues {
    name: string;
    slug: string;
    endpointUrl: string;
    description?: string;
    enabled: boolean;
    events: string[];
    signingSecret: string;
}

export interface WebhookCmsEntry {
    id: string;
    createdOn: string;
    savedOn: string;
    values: WebhookCmsEntryValues;
}

/* Flat runtime shape used throughout the webhooks system. */
export interface Webhook {
    id: string;
    createdOn: string;
    savedOn: string;
    name: string;
    slug: string;
    endpointUrl: string;
    description?: string;
    enabled: boolean;
    events: string[];
    signingSecret: string;
}
