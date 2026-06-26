import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { MailerSettings, TransportSettings } from "~/types.js";
import { SaveSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const SAVE_SETTINGS = /* GraphQL */ `
    mutation SaveTransportSettings($data: MailerTransportSettingsInput!) {
        mailer {
            saveSettings(data: $data) {
                data {
                    host
                    port
                    user
                    from
                    replyTo
                    source
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

interface SaveSettingsResponse {
    mailer: {
        saveSettings: {
            data: MailerSettings | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class SaveSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: TransportSettings): Promise<MailerSettings> {
        const response = await this.client.execute<SaveSettingsResponse>({
            query: SAVE_SETTINGS,
            variables: { data }
        });

        const { data: result, error } = response.mailer.saveSettings;

        if (error) {
            throw new Error(error.message);
        }

        if (!result) {
            throw new Error("No mailer settings data returned.");
        }

        return result;
    }
}

export const SaveSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: SaveSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
