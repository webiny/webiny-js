import { GetFrontendSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { IFrontendSettings } from "~/shared/types.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetFrontendSettings {
        frontend {
            getSettings {
                data {
                    domain
                    starterKits {
                        id
                        label
                        config
                    }
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

type GetSettingsResponse = {
    frontend: {
        getSettings:
            | { data: IFrontendSettings; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetFrontendSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IFrontendSettings> {
        const response = await this.client.execute<GetSettingsResponse>({
            query: GET_SETTINGS
        });

        const envelope = response.frontend.getSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not fetch frontend settings.");
        }

        return envelope.data || { domain: "http://localhost:3000", starterKits: [] };
    }
}

export const GetFrontendSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetFrontendSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
