import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { CurrentTenantGateway as GatewayAbstraction } from "./abstractions.js";
import { Tenant, type TenantDto } from "../../shared/Tenant.js";

const GET_CURRENT_TENANT = /* GraphQL */ `
    query GetCurrentTenant {
        tenantManager {
            getCurrentTenant {
                data {
                    id
                    values
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

type GetCurrentTenantResponse = {
    tenantManager: {
        getCurrentTenant:
            | {
                  data: TenantDto;
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

class CurrentTenantGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async getTenant(): Promise<Tenant> {
        const response = await this.client.execute<GetCurrentTenantResponse>({
            query: GET_CURRENT_TENANT
        });

        const envelope = response.tenantManager.getCurrentTenant;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        if (!envelope.data) {
            throw new Error("Unable to load tenant");
        }

        return Tenant.from(envelope.data);
    }
}

export const CurrentTenantGateway = GatewayAbstraction.createImplementation({
    implementation: CurrentTenantGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
