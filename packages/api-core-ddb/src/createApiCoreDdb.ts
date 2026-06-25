import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { DdbServiceManifestLoader } from "./serviceDiscovery/index.js";
import { DynamoDBClient } from "@webiny/db-dynamodb/features/DynamoDBClient/DynamoDBClient.js";
import { DynamoDbTableFactoryImpl } from "@webiny/db-dynamodb/features/DynamoDbTableFactory/DynamoDbTableFactory.js";
import { DynamoDbBatchFactoryImpl } from "@webiny/db-dynamodb/features/DynamoDbBatchFactory/DynamoDbBatchFactory.js";
import { DynamoDbEntityFactoryImpl } from "@webiny/db-dynamodb/features/DynamoDbEntityFactory/DynamoDbEntityFactory.js";

interface CreateApiCoreDdbParams {
    documentClient: DynamoDBDocument;
}

export const createApiCoreDdb = ({
    documentClient
}: CreateApiCoreDdbParams): ApiCoreStorageOperations => {
    ServiceDiscovery.setLoader(new DdbServiceManifestLoader(documentClient));

    const dynamoDBClient = new DynamoDBClient({ client: documentClient });
    const tableFactory = new DynamoDbTableFactoryImpl(dynamoDBClient);
    const batchFactory = new DynamoDbBatchFactoryImpl();
    const entityFactory = new DynamoDbEntityFactoryImpl(batchFactory);

    return {
        usersStorageOperations: createUsersStorageOperations({
            tableFactory,
            entityFactory
        }),
        tenancyStorageOperations: createTenancyStorageOperations({
            tableFactory,
            entityFactory
        }),
        securityStorageOperations: createSecurityStorageOperations({
            tableFactory,
            entityFactory
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({
            tableFactory,
            entityFactory
        })
    };
};
