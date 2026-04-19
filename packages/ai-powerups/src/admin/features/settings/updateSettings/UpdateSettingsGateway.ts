import { UpdateSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateAiPowerUpsSettings($data: JSON!) {
        aiPowerUps {
            updateSettings(data: $data) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

type UpdateSettingsResponse = {
    aiPowerUps: {
        updateSettings:
            | { data: Record<string, any>; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdateSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: Record<string, any>): Promise<Record<string, any>> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: { data }
        });

        const envelope = response.aiPowerUps.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data || {};
    }
}

export const UpdateSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
