import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import { createEntity as baseCreateEntity, createTable } from "@webiny/db-dynamodb";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IStorageAuditLog } from "~/storage/types.js";

export interface IAuditLogsEntityAttributes
    extends Omit<IStandardEntityAttributes<IStorageAuditLog>, "GSI1_SK" | "GSI2_SK" | "expiresAt"> {
    GSI1_PK: string;
    GSI1_SK: number;
    GSI2_PK: string;
    GSI2_SK: number;
    GSI3_PK: string;
    GSI3_SK: number;
    GSI4_PK: string;
    GSI4_SK: number;
    GSI5_PK: string;
    GSI5_SK: number;
    GSI6_PK: string;
    GSI6_SK: number;
    GSI7_PK: string;
    GSI7_SK: number;
    GSI8_PK: string;
    GSI8_SK: number;
    GSI9_PK: string;
    GSI9_SK: number;
    expiresAt: number;
}

export type AuditLogsEntity = IEntity<IAuditLogsEntityAttributes>;

export interface ICreateEntityParams {
    client: DynamoDBDocument;
    gsiAmount: number;
    tableName: string | undefined;
}

export interface ICreateEntityResult {
    entity: AuditLogsEntity;
    table: ReturnType<typeof createTable>;
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
    const table = createTable({
        documentClient: client,
        name,
        indexes: {
            ...createTableGSIIndexes(gsiAmount)
        }
    });

    const entity = baseCreateEntity<IAuditLogsEntityAttributes>({
        name: "AuditLogs",
        table: table.table,
        attributes: {
            PK: {
                partitionKey: true
            },
            SK: {
                sortKey: true
            },
            GSI_TENANT: {
                type: "string",
                required: true
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
