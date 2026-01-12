import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";
import type { IModelEntity } from "./types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createModelEntity = (params: Params): IModelEntity => {
    const { table, entityName } = params;
    return createStandardEntity<CmsModel>({
        table,
        name: entityName
    });
};
