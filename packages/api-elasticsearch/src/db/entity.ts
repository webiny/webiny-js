import type { TableDef } from "@webiny/db-dynamodb/toolbox.js";
import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { IElasticsearchEntity, IElasticsearchEntityAttributes } from "~/db/types.js";

export interface ICreateElasticsearchEntityParams {
    table: TableDef;
    entityName: string;
}

export const createElasticsearchEntity = (
    params: ICreateElasticsearchEntityParams
): IElasticsearchEntity => {
    const { table, entityName } = params;
    return createEntity<IElasticsearchEntityAttributes>({
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
