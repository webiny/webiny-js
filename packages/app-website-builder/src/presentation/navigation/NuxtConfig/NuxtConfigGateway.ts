import { NuxtConfigGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";

const GET_NUXT_CONFIG = /* GraphQL */ `
    query GetNuxtConfig {
        websiteBuilder {
            getNuxtConfig {
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

type GetNuxtConfigResponse = {
    websiteBuilder: {
        getNuxtConfig:
            | {
                  data: GatewayAbstraction.NuxtConfigDTO;
                  error: null;
              }
            | {
                  data: null;
                  error: {
                      code: string;
                      message: string;
                      data: any;
                  };
              };
    };
};

class NuxtGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async getConfig(): Promise<GatewayAbstraction.NuxtConfigDTO> {
        const response = await this.client.execute<GetNuxtConfigResponse>({
            query: GET_NUXT_CONFIG
        });

        const envelope = response.websiteBuilder.getNuxtConfig;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const NuxtConfigGateway = GatewayAbstraction.createImplementation({
    implementation: NuxtGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
