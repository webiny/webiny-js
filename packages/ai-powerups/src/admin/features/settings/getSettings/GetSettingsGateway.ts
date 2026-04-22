import { GetSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetAiPowerUpsSettings {
        aiPowerUps {
            getSettings
        }
    }
`;

type GetSettingsResponse = {
    aiPowerUps: {
        getSettings: IAiPowerUpsSettings;
    };
};

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IAiPowerUpsSettings> {
        const response = await this.client.execute<GetSettingsResponse>({
            query: GET_SETTINGS
        });

        return response.aiPowerUps.getSettings ?? {};
    }
}

export const GetSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
