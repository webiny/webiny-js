import { CmsIdentity } from "@webiny/api-headless-cms/types";
import { queryAll } from "@webiny/db-dynamodb";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { executeWithRetry, ExecuteWithRetryOptions } from "@webiny/utils";

const NON_EXISTING_DATA_MIGRATION_IDENTITY: CmsIdentity = {
    id: "data-migration",
    type: "data-migration",
    displayName: "Data Migration"
};

interface GetFallbackIdentityParams {
    entity: Entity;
    tenant: string;
    retryOptions?: ExecuteWithRetryOptions;
}

interface AdminUserRecord {
    data: {
        createdOn: string;
        id: string;
        displayName: string;
    };
}

const identitiesPerTenantCache: Record<string, CmsIdentity> = {};

export const getFallbackIdentity = async ({
    entity,
    tenant,
    retryOptions
}: GetFallbackIdentityParams): Promise<CmsIdentity> => {
    if (identitiesPerTenantCache[tenant]) {
        return identitiesPerTenantCache[tenant];
    }

    const executeQueryAll = () => {
        return queryAll<AdminUserRecord>({
            entity,
            partitionKey: `T#${tenant}#ADMIN_USERS`,
            options: {
                index: "GSI1"
            }
        });
    };

    const allAdminUsersRecords = await executeWithRetry(executeQueryAll, retryOptions);

    if (allAdminUsersRecords.length === 0) {
        // Hopefully it doesn't come to this, but we still need to consider it.
        return NON_EXISTING_DATA_MIGRATION_IDENTITY;
    }

    const [oldestAdminUser] = allAdminUsersRecords.sort((prev, next) => {
        return prev.data.createdOn < next.data.createdOn ? -1 : 1;
    });

    identitiesPerTenantCache[tenant] = {
        id: oldestAdminUser.data.id,
        type: "admin",
        displayName: oldestAdminUser.data.displayName
    };

    return identitiesPerTenantCache[tenant];
};
