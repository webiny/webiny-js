import { createHandler } from "@webiny/handler-aws/raw";
import { createDdbProjectMigration, createTable } from "@webiny/data-migration";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { migrations } from "migrations/src/ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        createDdbProjectMigration({
            primaryTable: createTable({
                name: String(process.env.DB_TABLE),
                documentClient
            }),
            migrations: migrations()
        })
    ]
});
