import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";

const name = "SocketsConnectionRegistry";

export const createEntity = (documentClient: DynamoDBDocument) => {
    const table = new Table({
        name: String(process.env.DB_TABLE),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            },
            GSI2: {
                partitionKey: "GSI2_PK",
                sortKey: "GSI2_SK"
            }
        },
        autoExecute: true,
        autoParse: true
    });

    return new Entity({
        name,
        table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI1_PK: {
                type: "string"
            },
            GSI1_SK: {
                type: "string"
            },
            GSI2_PK: {
                type: "string"
            },
            GSI2_SK: {
                type: "string"
            },
            TYPE: {
                type: "string",
                default: name
            },
            data: {
                type: "map"
            }
        }
    });
};
