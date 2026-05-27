import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { BackgroundTaskSettings } from "~/admin/shared/types.js";
import { GetBackgroundTaskSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const GET_BACKGROUND_TASK_SETTINGS = /* GraphQL */ `
    query GetBackgroundTaskSettings {
        backgroundTasks {
            getSettings {
                data {
                    retentionDays
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

type GetBackgroundTaskSettingsResponse = {
    backgroundTasks: {
        getSettings:
            | { data: BackgroundTaskSettings; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class GetBackgroundTaskSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(): Promise<BackgroundTaskSettings> {
        const response = await this.client.execute<GetBackgroundTaskSettingsResponse>({
            query: GET_BACKGROUND_TASK_SETTINGS
        });

        const envelope = response.backgroundTasks.getSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const GetBackgroundTaskSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetBackgroundTaskSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
