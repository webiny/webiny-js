import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface ICreateEntityParams {
    client: DynamoDBDocument;
    gsiAmount: number;
    tableName: string | undefined;
}

export interface ICreateEntityResult {
    entity: Entity;
    table: Table<string, string, string>;
}

const createTableGSIIndexes = (count: number) => {
    const result: GenericRecord = {};
    for (let i = 1; i <= count; i++) {
        result[`GSI${i}`] = {
            partitionKey: `GSI${i}_PK`,
            sortKey: `GSI${i}_SK`
        };
    }
    return result;
};

export const createEntity = (params: ICreateEntityParams): ICreateEntityResult => {
    const { gsiAmount, client, tableName } = params;
    const name = tableName || process.env.DB_TABLE_AUDIT_LOGS;
    if (!name) {
        throw new Error("Missing env.DB_TABLE_AUDIT_LOGS environment variable.");
    }
    const table = new Table({
        name,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: client,
        indexes: createTableGSIIndexes(gsiAmount),
        autoExecute: true,
        autoParse: true
    });

    const entity = new Entity({
        name: "AuditLogs",
        table,
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
                type: "number",
                required: true
            },
            GSI2_PK: {
                type: "string",
                required: true
            },
            GSI2_SK: {
                type: "number",
                required: true
            },
            GSI3_PK: {
                type: "string",
                required: true
            },
            GSI3_SK: {
                type: "number",
                required: true
            },
            GSI4_PK: {
                type: "string",
                required: true
            },
            GSI4_SK: {
                type: "number",
                required: true
            },
            GSI5_PK: {
                type: "string",
                required: true
            },
            GSI5_SK: {
                type: "number",
                required: true
            },
            GSI6_PK: {
                type: "string",
                required: true
            },
            GSI6_SK: {
                type: "number",
                required: true
            },
            GSI7_PK: {
                type: "string",
                required: true
            },
            GSI7_SK: {
                type: "number",
                required: true
            },
            GSI8_PK: {
                type: "string",
                required: true
            },
            GSI8_SK: {
                type: "number",
                required: true
            },
            GSI9_PK: {
                type: "string",
                required: true
            },
            GSI9_SK: {
                type: "number",
                required: true
            },
            data: {
                type: "map",
                required: true
            }
        }
    });

    return {
        entity,
        table
    };
};
