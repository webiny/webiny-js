import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { DdbServiceManifestLoader } from "./serviceDiscovery/index.js";

interface CreateApiCoreDdbParams {
    documentClient: DynamoDBDocument;
}

export const createApiCoreDdb = ({
    documentClient
}: CreateApiCoreDdbParams): ApiCoreStorageOperations => {
    ServiceDiscovery.setLoader(new DdbServiceManifestLoader(documentClient));

    return {
        usersStorageOperations: createUsersStorageOperations({
            documentClient
        }),
        tenancyStorageOperations: createTenancyStorageOperations({
            documentClient
        }),
        securityStorageOperations: createSecurityStorageOperations({
            documentClient
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({
            documentClient
        })
    };
};
