import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { InstallTenantGateway as GatewayAbstraction } from "./abstractions.js";

const INSTALL_TENANT = /* GraphQL */ `
    mutation InstallTenant($tenantId: ID!) {
        tenantManager {
            installTenant(tenantId: $tenantId) {
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

type InstallTenantResponse = {
    tenantManager: {
        installTenant:
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

class InstallTenantGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async installTenant(tenantId: string): Promise<boolean> {
        const response = await this.client.execute<InstallTenantResponse>({
            query: INSTALL_TENANT,
            variables: { tenantId }
        });

        const envelope = response.tenantManager.installTenant;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        if (!envelope.data) {
            throw new Error("Unable to install tenant");
        }

        return envelope.data;
    }
}

export const InstallTenantGateway = GatewayAbstraction.createImplementation({
    implementation: InstallTenantGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
