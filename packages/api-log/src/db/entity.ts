import { Entity } from "@webiny/db-dynamodb/toolbox.js";
import type { ITable } from "~/db/types.js";

interface IParams {
    table: ITable;
}

export interface IEntityAttributes {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    GSI2_PK: string;
    GSI2_SK: string;
    GSI3_PK: string;
    GSI3_SK: string;
    GSI4_PK: string;
    GSI4_SK: string;
    id: string;
    tenant: string;
    source: string;
    type: string;
    data: string;
}

export const createEntity = (params: IParams): Entity<any> => {
    const { table } = params;
    return new Entity<string, IEntityAttributes>({
        name: "Log",
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
            GSI3_PK: {
                type: "string",
                required: true
            },
            GSI3_SK: {
                type: "string",
                required: true
            },
            GSI4_PK: {
                type: "string",
                required: true
            },
            GSI4_SK: {
                type: "string",
                required: true
            },
            GSI5_PK: {
                type: "string",
                required: true
            },
            GSI5_SK: {
                type: "string",
                required: true
            },
            id: {
                type: "string",
                required: true
            },
            createdOn: {
                type: "string",
                required: true
            },
            tenant: {
                type: "string",
                required: true
            },
            source: {
                type: "string",
                required: true
            },
            type: {
                type: "string",
                required: true
            },
            data: {
                type: "string",
                required: true
            }
        }
    });
};
