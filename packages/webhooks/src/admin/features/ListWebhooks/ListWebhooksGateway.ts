import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListWebhooksGateway as GatewayAbstraction,
    type IListWebhooksInput,
    type IListWebhooksOutput
} from "./abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";

const LIST_WEBHOOKS = /* GraphQL */ `
    query ListWebhooks($where: ListWebhooksWhereInput, $limit: Int, $after: String) {
        webhooks {
            listWebhooks(where: $where, limit: $limit, after: $after) {
                data {
                    id
                    name
                    slug
                    endpointUrl
                    description
                    enabled
                    events
                    signingSecret
                    createdOn
                    modifiedOn
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type ListWebhooksResponse = {
    webhooks: {
        listWebhooks:
            | {
                  data: Webhook[];
                  meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
                  error: null;
              }
            | {
                  data: null;
                  meta: null;
                  error: { code: string; message: string; data: unknown };
              };
    };
};

class ListWebhooksGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IListWebhooksInput): Promise<IListWebhooksOutput> {
        const response = await this.client.execute<ListWebhooksResponse>({
            query: LIST_WEBHOOKS,
            variables: {
                where: input.where,
                limit: input.limit,
                after: input.after
            }
        });

        const envelope = response.webhooks.listWebhooks;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return {
            items: envelope.data,
            meta: envelope.meta
        };
    }
}

export const ListWebhooksGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhooksGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
