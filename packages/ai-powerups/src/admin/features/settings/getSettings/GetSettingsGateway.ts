import { GetSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { ISettings } from "~/admin/features/settings/shared/abstractions.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetAiPowerUpsSettings {
        aiPowerUps {
            getSettings
        }
    }
`;

type GetSettingsResponse = {
    aiPowerUps: {
        getSettings: ISettings;
    };
};

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<Record<string, any>> {
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
