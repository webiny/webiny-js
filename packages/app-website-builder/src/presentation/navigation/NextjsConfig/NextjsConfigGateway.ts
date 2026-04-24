import { NextjsConfigGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";

const GET_NEXTJS_CONFIG = /* GraphQL */ `
    query GetNextjsConfig {
        websiteBuilder {
            getNextjsConfig {
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

type GetNextjsConfigResponse = {
    websiteBuilder: {
        getNextjsConfig:
            | {
                  data: GatewayAbstraction.NextjsConfigDTO;
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

class NextjsGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async getConfig(): Promise<GatewayAbstraction.NextjsConfigDTO> {
        const response = await this.client.execute<GetNextjsConfigResponse>({
            query: GET_NEXTJS_CONFIG
        });

        const envelope = response.websiteBuilder.getNextjsConfig;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const NextjsConfigGateway = GatewayAbstraction.createImplementation({
    implementation: NextjsGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
