import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { TenantListGateway as GatewayAbstraction } from "./abstractions.js";
import { Tenant, type TenantDto } from "../../shared/Tenant.js";

const LIST_TENANTS = /* GraphQL */ `
    query ListTenants($search: String) {
        tenantManager {
            listTenants(search: $search) {
                data {
                    id
                    values
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

type ListTenantsResponse = {
    tenantManager: {
        listTenants: {
            data: TenantDto[] | null;
            error: { code: string; message: string } | null;
        };
    };
};

class TenantListGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listTenants(search?: string): Promise<Tenant[]> {
        const response = await this.client.execute<ListTenantsResponse>({
            query: LIST_TENANTS,
            variables: { search: search || null }
        });

        const envelope = response.tenantManager.listTenants;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return (envelope.data ?? []).map(dto => Tenant.from(dto));
    }
}

export const TenantListGateway = GatewayAbstraction.createImplementation({
    implementation: TenantListGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
