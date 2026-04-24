import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { EnableTenantGateway as GatewayAbstraction } from "./abstractions.js";

const ENABLE_TENANT = /* GraphQL */ `
    mutation EnableTenant($tenantId: ID!) {
        tenantManager {
            enableTenant(tenantId: $tenantId) {
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

type EnableTenantResponse = {
    tenantManager: {
        enableTenant:
            | {
                  data: boolean;
                  error: null;
              }
            | {
                  data: null;
                  error: {
                      code: string;
                      message: string;
                      data: Record<string, any>;
                  };
              };
    };
};

class EnableTenantGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async enableTenant(tenantId: string): Promise<boolean> {
        const response = await this.client.execute<EnableTenantResponse>({
            query: ENABLE_TENANT,
            variables: { tenantId }
        });

        const envelope = response.tenantManager.enableTenant;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        if (!envelope.data) {
            throw new Error("Unable to enable tenant");
        }

        return envelope.data;
    }
}

export const EnableTenantGateway = GatewayAbstraction.createImplementation({
    implementation: EnableTenantGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
