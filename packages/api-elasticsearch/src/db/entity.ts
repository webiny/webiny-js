import type { TableDef } from "@webiny/db-dynamodb/toolbox.js";
import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";

export interface ICreateElasticsearchEntityParams {
    table: TableDef;
    entityName: string;
}

export const createElasticsearchEntity = (params: ICreateElasticsearchEntityParams) => {
    const { table, entityName } = params;
    return createEntity({
        name: entityName,
        table,
        attributes: {
            ...standardEntityAttributes,
            index: {
                type: "string",
                required: true
            }
        }
    });
};
