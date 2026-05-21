import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { WebhookSettings } from "~/admin/shared/types.js";
import {
    UpdateWebhookSettingsGateway as GatewayAbstraction,
    type UpdateWebhookSettingsInput
} from "./abstractions.js";

const UPDATE_WEBHOOK_SETTINGS = /* GraphQL */ `
    mutation UpdateWebhookSettings($input: UpdateWebhookSettingsInput!) {
        webhooks {
            updateSettings(input: $input) {
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

type UpdateWebhookSettingsResponse = {
    webhooks: {
        updateSettings:
            | { data: WebhookSettings; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class UpdateWebhookSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings> {
        const response = await this.client.execute<UpdateWebhookSettingsResponse>({
            query: UPDATE_WEBHOOK_SETTINGS,
            variables: { input }
        });

        const envelope = response.webhooks.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const UpdateWebhookSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateWebhookSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
