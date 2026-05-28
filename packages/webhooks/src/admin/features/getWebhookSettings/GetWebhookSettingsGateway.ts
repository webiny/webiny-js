import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { WebhookSettings } from "~/admin/shared/types.js";
import { GetWebhookSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const GET_WEBHOOK_SETTINGS = /* GraphQL */ `
    query GetWebhookSettings {
        webhooks {
            getSettings {
                data {
                    signingSecret
                    deliveryRetentionDays
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

type GetWebhookSettingsResponse = {
    webhooks: {
        getSettings:
            | { data: WebhookSettings; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class GetWebhookSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(): Promise<WebhookSettings> {
        const response = await this.client.execute<GetWebhookSettingsResponse>({
            query: GET_WEBHOOK_SETTINGS
        });

        const envelope = response.webhooks.getSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const GetWebhookSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetWebhookSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
