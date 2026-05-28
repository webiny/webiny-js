import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { BackgroundTaskSettings } from "~/admin/shared/types.js";
import {
    UpdateBackgroundTaskSettingsGateway as GatewayAbstraction,
    type UpdateBackgroundTaskSettingsInput
} from "./abstractions.js";

const UPDATE_BACKGROUND_TASK_SETTINGS = /* GraphQL */ `
    mutation UpdateBackgroundTaskSettings($input: UpdateBackgroundTaskSettingsInput!) {
        backgroundTasks {
            updateSettings(input: $input) {
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

type UpdateBackgroundTaskSettingsResponse = {
    backgroundTasks: {
        updateSettings:
            | { data: BackgroundTaskSettings; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class UpdateBackgroundTaskSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(input: UpdateBackgroundTaskSettingsInput): Promise<BackgroundTaskSettings> {
        const response = await this.client.execute<UpdateBackgroundTaskSettingsResponse>({
            query: UPDATE_BACKGROUND_TASK_SETTINGS,
            variables: { input }
        });

        const envelope = response.backgroundTasks.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const UpdateBackgroundTaskSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateBackgroundTaskSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
