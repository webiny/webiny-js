import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { MailerSettings } from "~/types.js";
import { GetSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetMailerSettings {
        mailer {
            getSettings {
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

interface GetSettingsResponse {
    mailer: {
        getSettings: {
            data: MailerSettings | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<MailerSettings> {
        const response = await this.client.execute<GetSettingsResponse>({
            query: GET_SETTINGS
        });

        const { data, error } = response.mailer.getSettings;

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            throw new Error("No mailer settings data returned.");
        }

        return data;
    }
}

export const GetSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
