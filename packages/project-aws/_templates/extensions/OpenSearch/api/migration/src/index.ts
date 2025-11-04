import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { createHandler } from "@webiny/handler-aws/raw";
import { createApiCore } from "@webiny/api-core";
import { createDdbEsProjectMigration, createTable } from "@webiny/data-migration";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { createStorageOperations as createAdminUsersStorageOperations } from "@webiny/api-admin-users-so-ddb";
import { migrations } from "@webiny/migrations/ddb-es";

const documentClient = getDocumentClient();

const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [
        createApiCore({
            tenancyStorageOperations: tenancyStorageOperations({ documentClient }),
            securityStorageOperations: securityStorageOperations({ documentClient }),
            usersStorageOperations: createAdminUsersStorageOperations({ documentClient })
        }),
        createDdbEsProjectMigration({
            primaryTable: createTable({
                name: String(process.env.DB_TABLE),
                documentClient
            }),
            dynamoToEsTable: createTable({
                name: String(process.env.DB_TABLE_ELASTICSEARCH),
                documentClient
            }),
            elasticsearchClient,
            migrations: migrations()
        })
    ]
});
