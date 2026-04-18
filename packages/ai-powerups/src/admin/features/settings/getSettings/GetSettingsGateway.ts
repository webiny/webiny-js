import { GetSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const GET_SETTINGS = /* GraphQL */ `
    query GetAiPowerUpsSettings {
        aiPowerUps {
            getSettings {
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

type GetSettingsResponse = {
    aiPowerUps: {
        getSettings:
            | { data: Record<string, any>; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<Record<string, any>> {
        return {
            general: {
                presets: [
                    {
                        name: "General purpose",
                        model: "gpt-4o",
                        apiKey: "123"
                    }
                ]
            }
        };
        // const response = await this.client.execute<GetSettingsResponse>({
        //     query: GET_SETTINGS
        // });
        //
        // const envelope = response.aiPowerUps.getSettings;
        // if (envelope.error) {
        //     throw new Error(envelope.error.message);
        // }
        //
        // return envelope.data || {};
    }
}

export const GetSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
