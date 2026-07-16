import { GetEcommerceSettingsGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const GET_INTEGRATIONS = /* GraphQL */ `
    query GetIntegrationsSettings {
        websiteBuilder {
            getIntegrations {
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

type GetIntegrationsResponse = {
    websiteBuilder: {
        getIntegrations:
            | { data: Record<string, any>; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetEcommerceSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<GatewayAbstraction.Result> {
        const response = await this.client.execute<GetIntegrationsResponse>({
            query: GET_INTEGRATIONS
        });

        const envelope = response.websiteBuilder.getIntegrations;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not fetch integrations settings.");
        }

        return envelope.data || {};
    }
}

export const GetEcommerceSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetEcommerceSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
