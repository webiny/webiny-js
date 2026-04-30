import { createStandardEntity, type ITable } from "@webiny/db-dynamodb";
import type { IModelEntity } from "./types.js";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: ITable;
    entityName: string;
}

export const createModelEntity = (params: Params): IModelEntity => {
    const { table, entityName } = params;
    return createStandardEntity<StorageCmsModel>({
        table: table.table,
        name: entityName
    });
};
