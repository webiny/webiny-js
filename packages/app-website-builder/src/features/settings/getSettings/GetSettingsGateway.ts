import { GetSettingsGateway as GatewayAbstraction } from "./abstractions/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const GET_SETTINGS = /* GraphQL */ `
    query GetWebsiteBuilderSettings {
        websiteBuilder {
            getSettings {
                data {
                    previewDomain
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

type GetSettingsResponse = {
    websiteBuilder: {
        getSettings:
            | { data: { previewDomain: string }; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<GatewayAbstraction.Result> {
        const response = await this.client.execute<GetSettingsResponse>({
            query: GET_SETTINGS
        });

        const envelope = response.websiteBuilder.getSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not fetch settings.");
        }

        return envelope.data || undefined;
    }
}

export const GetSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
