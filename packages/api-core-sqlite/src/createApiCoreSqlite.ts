import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { Database } from "@webiny/db-sqlite";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";

export interface CreateApiCoreSqliteParams {
    db: Database;
}

export const createApiCoreSqlite = ({
    db
}: CreateApiCoreSqliteParams): ApiCoreStorageOperations => {
    return {
        usersStorageOperations: createUsersStorageOperations({ db }),
        tenancyStorageOperations: createTenancyStorageOperations({ db }),
        securityStorageOperations: createSecurityStorageOperations({ db }),
        keyValueStorageOperations: createKeyValueStorageOperations({ db })
    };
};
