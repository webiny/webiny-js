import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { FmSettings } from "../shared/types.js";
import { GetSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetFileManagerSettings {
        fileManager {
            getSettings {
                data {
                    srcPrefix
                    uploadMinFileSize
                    uploadMaxFileSize
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

interface GetSettingsResponse {
    fileManager: {
        getSettings: {
            data: FmSettings | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<FmSettings> {
        const response = await this.client.execute<GetSettingsResponse>({
            query: GET_SETTINGS
        });

        const { data, error } = response.fileManager.getSettings;

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            throw new Error("No settings data returned.");
        }

        return data;
    }
}

export const GetSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
