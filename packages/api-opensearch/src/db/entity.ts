import { createEntity, type ITable, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { IOpenSearchEntity, IOpenSearchEntityAttributes } from "~/db/types.js";

export interface ICreateOpenSearchEntityParams {
    table: ITable;
    entityName: string;
}

export const createOpenSearchEntity = (
    params: ICreateOpenSearchEntityParams
): IOpenSearchEntity => {
    const { table, entityName } = params;
    return createEntity<IOpenSearchEntityAttributes>({
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
