import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { createHandler } from "@webiny/handler-aws/raw";
import { createDdbEsMigrationHandler, createTable } from "@webiny/data-migration";
import { migrations } from "@webiny/migrations/ddb-es";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [
        createDdbEsMigrationHandler({
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
