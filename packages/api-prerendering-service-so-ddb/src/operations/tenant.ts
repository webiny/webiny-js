import { PrerenderingServiceTenantStorageOperations } from "@webiny/api-prerendering-service/types";
import { Entity } from "dynamodb-toolbox";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";

export interface CreateTenantStorageOperationsParams {
    entity: Entity<any>;
}

export const createTenantStorageOperations = (
    params: CreateTenantStorageOperationsParams
): PrerenderingServiceTenantStorageOperations => {
    const { entity } = params;

    const getTenantIds = async (): Promise<string[]> => {
        const tenants = await queryAll<{ id: string }>({
            entity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        return cleanupItems(entity, tenants).map(tenant => tenant.id);
    };

    return {
        getTenantIds
    };
};
