import { UpdateSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";
import { SettingsValidationError, SettingsUpdateError } from "~/admin/domain/errors.js";

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateAiPowerUpsSettings($input: JSON!) {
        aiPowerUps {
            updateSettings(input: $input) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type UpdateSettingsResponse = {
    aiPowerUps: {
        updateSettings:
            | { data: IAiPowerUpsSettings; error: null }
            | {
                  data: null;
                  error: {
                      code: string;
                      message: string;
                      data: Record<string, any> | null;
                  };
              };
    };
};

class UpdateSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: IAiPowerUpsSettings): Promise<IAiPowerUpsSettings> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: { input: data }
        });

        const envelope = response.aiPowerUps.updateSettings;

        if (envelope.error) {
            if (envelope.error.data?.invalidFields) {
                throw new SettingsValidationError(envelope.error.data.invalidFields);
            }
            throw new SettingsUpdateError(envelope.error.message);
        }

        return envelope.data ?? ({} as IAiPowerUpsSettings);
    }
}

export const UpdateSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
