import { UpdateSettingsGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateWebsiteBuilderSettings($settings: WbSettingsInput!) {
        websiteBuilder {
            updateSettings(data: $settings) {
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

type UpdateSettingsResponse = {
    websiteBuilder: {
        updateSettings:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdateSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(settings: GatewayAbstraction.Params): Promise<void> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: { settings }
        });

        const envelope = response.websiteBuilder.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not update settings.");
        }
    }
}

export const UpdateSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
