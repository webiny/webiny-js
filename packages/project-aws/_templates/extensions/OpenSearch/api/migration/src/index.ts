import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { createHandler } from "@webiny/handler-aws/raw";
import { createApiCore } from "@webiny/api-core";
import { createApiCoreDdb } from "@webiny/api-core-ddb";
import { createDdbEsProjectMigration, createTable } from "@webiny/data-migration";
import { migrations } from "@webiny/migrations/ddb-es";

const documentClient = getDocumentClient();

const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [
        createApiCore({
            storageOperations: createApiCoreDdb({ documentClient})
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
