import { PrerenderingServiceTenantStorageOperations } from "@webiny/api-prerendering-service/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { queryAll } from "@webiny/db-dynamodb/utils/query";

export interface CreateTenantStorageOperationsParams {
    entity: Entity<any>;
}

interface Tenant {
    data: { id: string };
}

export const createTenantStorageOperations = (
    params: CreateTenantStorageOperationsParams
): PrerenderingServiceTenantStorageOperations => {
    const { entity } = params;

    const getTenantIds = async (): Promise<string[]> => {
        const tenants = await queryAll<Tenant>({
            entity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        return tenants.map(tenant => tenant.data.id);
    };

    return { getTenantIds };
};
