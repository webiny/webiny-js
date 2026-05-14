export interface IWebhook {
    id: string;
    name: string;
    slug: string;
    endpointUrl: string;
    description: string | null;
    enabled: boolean;
    events: string[];
    signingSecret: string;
    createdOn: string | null;
    modifiedOn: string | null;
}

export interface IListWebhooksMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListWebhooksInput {
    where?: {
        enabled?: boolean;
    };
    limit?: number;
    after?: string;
}

export interface IListWebhooksOutput {
    items: IWebhook[];
    meta: IListWebhooksMeta;
}
