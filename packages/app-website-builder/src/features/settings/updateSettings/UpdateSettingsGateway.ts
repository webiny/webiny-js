import { UpdateSettingsGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

/*
 * The domain lives in the shared frontend settings since the frontend-settings port; the read side
 * (`GetSettingsGateway`) already reads it from there. This still sent Website Builder's own
 * `updateSettings`, which the API no longer has, so saving the domain from the settings screen failed
 * and a dead preview domain could not be repaired from the admin (2026-10-09).
 */
const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateWebsiteBuilderSettings($settings: FrontendSettingsInput!) {
        frontend {
            updateSettings(data: $settings) {
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
    frontend: {
        updateSettings:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdateSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(settings: GatewayAbstraction.Params): Promise<void> {
        const response = await this.client.execute<UpdateSettingsResponse>({
            query: UPDATE_SETTINGS,
            variables: { settings: { domain: settings.previewDomain } }
        });

        const envelope = response.frontend.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not update settings.");
        }
    }
}

export const UpdateSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
