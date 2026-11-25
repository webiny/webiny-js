import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { TransportSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const ERROR_FIELDS = /* GraphQL */ `
    error {
        message
        code
        data
    }
`;

const GET_TRANSPORT_SETTINGS = /* GraphQL */ `
    query GetTransportSettings($transport: String!) {
        mailer {
            getTransportSettings(transport: $transport) {
                data {
                    transport
                    settings
                    source
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const SAVE_TRANSPORT_SETTINGS = /* GraphQL */ `
    mutation SaveTransportSettings($transport: String!, $settings: JSON!) {
        mailer {
            saveTransportSettings(transport: $transport, settings: $settings) {
                data {
                    transport
                    settings
                    source
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

interface IResponse {
    data: GatewayAbstraction.Data | null;
    error: { code: string; message: string; data: unknown } | null;
}

const unwrap = (response: IResponse): GatewayAbstraction.Data => {
    if (response.error) {
        throw new Error(response.error.message);
    }
    if (!response.data) {
        throw new Error("No mailer settings data returned.");
    }
    return response.data;
};

class TransportSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async get(transport: string): Promise<GatewayAbstraction.Data> {
        const response = await this.client.execute<{
            mailer: { getTransportSettings: IResponse };
        }>({ query: GET_TRANSPORT_SETTINGS, variables: { transport } });

        return unwrap(response.mailer.getTransportSettings);
    }

    async save(
        transport: string,
        settings: Record<string, unknown>
    ): Promise<GatewayAbstraction.Data> {
        const response = await this.client.execute<{
            mailer: { saveTransportSettings: IResponse };
        }>({ query: SAVE_TRANSPORT_SETTINGS, variables: { transport, settings } });

        return unwrap(response.mailer.saveTransportSettings);
    }
}

export const TransportSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: TransportSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
