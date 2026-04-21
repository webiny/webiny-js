import { UpdateSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { ISettings } from "~/admin/features/settings/shared/abstractions.js";

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateAiPowerUpsSettings($input: JSON!) {
        aiPowerUps {
            updateSettings(input: $input)
        }
    }
`;

type UpdateSettingsResponse = {
    aiPowerUps: {
        updateSettings: ISettings;
    };
};

class UpdateSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: ISettings): Promise<ISettings> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: { input: data }
        });

        return response.aiPowerUps.updateSettings ?? {};
    }
}

export const UpdateSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
