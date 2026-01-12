import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb";
import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { IModelEntity } from "./types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createModelEntity = (params: Params): IModelEntity => {
    const { table, entityName } = params;
    return createEntity<IStandardEntityAttributes<CmsModel>>({
        table,
        name: entityName,
        attributes: standardEntityAttributes
    });
};
