import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { FmSettings } from "../shared/types.js";
import { SaveSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateFileManagerSettings($data: FmSettingsInput) {
        fileManager {
            updateSettings(data: $data) {
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

interface UpdateSettingsResponse {
    fileManager: {
        updateSettings: {
            data: FmSettings | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class SaveSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: FmSettings): Promise<FmSettings> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: {
                data: {
                    uploadMinFileSize: parseFloat(data.uploadMinFileSize),
                    uploadMaxFileSize: parseFloat(data.uploadMaxFileSize),
                    srcPrefix: data.srcPrefix
                }
            }
        });

        const { data: result, error } = response.fileManager.updateSettings;

        if (error) {
            throw new Error(error.message);
        }

        if (!result) {
            throw new Error("No settings data returned.");
        }

        return result;
    }
}

export const SaveSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: SaveSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
