import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStandardEntity, createTable } from "@webiny/db-dynamodb";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";

const name = "SocketsConnectionRegistry";

export const createEntity = (documentClient: DynamoDBDocument) => {
    const table = createTable({
        name: String(process.env.DB_TABLE),
        documentClient
    });

    return createStandardEntity<ConnectionRegistry.Data>({
        name,
        table: table.table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI1_PK: {
                type: "string",
                required: true
            },
            GSI1_SK: {
                type: "string",
                required: true
            },
            GSI2_PK: {
                type: "string",
                required: true
            },
            GSI2_SK: {
                type: "string",
                required: true
            },
            TYPE: {
                type: "string",
                default: name,
                required: true
            },
            data: {
                type: "map",
                required: true
            }
        }
    });
};
