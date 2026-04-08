import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { DisableTenantGateway as GatewayAbstraction } from "./abstractions.js";

const DISABLE_TENANT = /* GraphQL */ `
    mutation DisableTenant($tenantId: ID!) {
        tenantManager {
            disableTenant(tenantId: $tenantId) {
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

type DisableTenantResponse = {
    tenantManager: {
        disableTenant:
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

class DisableTenantGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async disableTenant(tenantId: string): Promise<boolean> {
        const response = await this.client.execute<DisableTenantResponse>({
            query: DISABLE_TENANT,
            variables: { tenantId }
        });

        const envelope = response.tenantManager.disableTenant;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        if (!envelope.data) {
            throw new Error("Unable to disable tenant");
        }

        return envelope.data;
    }
}

export const DisableTenantGateway = GatewayAbstraction.createImplementation({
    implementation: DisableTenantGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
