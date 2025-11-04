import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createSettingsStorageOperations } from "./settings/index.js";

interface CreateApiCoreDdbParams {
    documentClient: DynamoDBDocument;
}

export const createApiCoreDdb = ({
    documentClient
}: CreateApiCoreDdbParams): ApiCoreStorageOperations => {
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
        settingsStorageOperations: createSettingsStorageOperations({
            documentClient
        })
    };
};
