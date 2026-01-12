import { createStandardEntity, type ITable } from "@webiny/db-dynamodb";
import type { IModelEntity } from "~/definitions/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: ITable;
    entityName: string;
}

export const createModelEntity = (params: Params): IModelEntity => {
    const { table, entityName } = params;
    return createStandardEntity<CmsModel>({
        table: table.table,
        name: entityName
    });
};
