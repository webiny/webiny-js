import {
    UpdateFrontendSettingsGateway as GatewayAbstraction,
    type FrontendSettingsInput
} from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateFrontendSettings($data: FrontendSettingsInput!) {
        frontend {
            updateSettings(data: $data) {
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
    frontend: {
        updateSettings:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdateFrontendSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: FrontendSettingsInput): Promise<boolean> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: { data }
        });

        const envelope = response.frontend.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not update frontend settings.");
        }

        return true;
    }
}

export const UpdateFrontendSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateFrontendSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
