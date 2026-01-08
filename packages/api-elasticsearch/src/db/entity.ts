import type { TableDef } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";

export interface ICreateElasticsearchEntityParams {
    table: TableDef;
    entityName: string;
}

export const createElasticsearchEntity = (params: ICreateElasticsearchEntityParams) => {
    const { table, entityName } = params;
    return createStandardEntity({
        name: entityName,
        table,
        attributes: {
            PK: {
                type: "string",
                partitionKey: true
            },
            SK: {
                type: "string",
                sortKey: true
            },
            index: {
                type: "string",
                required: true
            },
            TYPE: {
                type: "string",
                required: true
            },
            data: {
                type: "map",
                required: true
            },
            GSI_TENANT: {
                type: "string",
                required: true
            }
        }
    });
};
