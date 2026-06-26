import { UpdateEcommerceSettingsGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const UPDATE_INTEGRATIONS = /* GraphQL */ `
    mutation UpdateWebsiteBuilderSettings($settings: JSON!) {
        websiteBuilder {
            updateIntegrations(data: $settings) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type UpdateIntegrationsResponse = {
    websiteBuilder: {
        updateIntegrations:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdateEcommerceSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(settings: GatewayAbstraction.Params): Promise<void> {
        const response = await this.client.execute<UpdateIntegrationsResponse>({
            query: UPDATE_INTEGRATIONS,
            variables: { settings }
        });

        const envelope = response.websiteBuilder.updateIntegrations;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not update integrations settings.");
        }
    }
}

export const UpdateEcommerceSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateEcommerceSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
