import { createEntity, type ITable, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { IElasticsearchEntity, IElasticsearchEntityAttributes } from "~/db/types.js";

export interface ICreateElasticsearchEntityParams {
    table: ITable;
    entityName: string;
}

export const createElasticsearchEntity = (
    params: ICreateElasticsearchEntityParams
): IElasticsearchEntity => {
    const { table, entityName } = params;
    return createEntity<IElasticsearchEntityAttributes>({
        name: entityName,
        table: table.table,
        attributes: {
            ...standardEntityAttributes,
            index: {
                type: "string",
                required: true
            }
        }
    });
};
