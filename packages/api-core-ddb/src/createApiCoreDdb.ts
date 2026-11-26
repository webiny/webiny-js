import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { DdbServiceManifestLoader } from "./serviceDiscovery/index.js";
import type { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

interface CreateApiCoreDdbParams {
    documentClient: DynamoDBDocument;
    /**
     * The tenant the storage acts on: its tenant scope's. The tenant records and the key-value store
     * don't use it (the tenant registry is tenant-neutral, and the store is keyed by its own scope).
     */
    scopeTenant: ScopeTenant.Interface;
}

export const createApiCoreDdb = ({
    documentClient,
    scopeTenant
}: CreateApiCoreDdbParams): ApiCoreStorageOperations => {
    ServiceDiscovery.setLoader(new DdbServiceManifestLoader(documentClient));

    return {
        usersStorageOperations: createUsersStorageOperations({
            documentClient,
            scopeTenant
        }),
        tenancyStorageOperations: createTenancyStorageOperations({
            documentClient
        }),
        securityStorageOperations: createSecurityStorageOperations({
            documentClient,
            scopeTenant
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({
            documentClient
        })
    };
};
