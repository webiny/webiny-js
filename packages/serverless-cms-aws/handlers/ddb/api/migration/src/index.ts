import { createHandler } from "@webiny/handler-aws/raw";
import { createDdbProjectMigration, createTable } from "@webiny/data-migration";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { migrations } from "@webiny/migrations/ddb";

const documentClient = getDocumentClient();

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
