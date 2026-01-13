import { createStandardEntity, type ITable } from "@webiny/db-dynamodb";
import type { IGroupEntity } from "./types.js";
import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: ITable;
    entityName: string;
}

export const createGroupEntity = (params: Params): IGroupEntity => {
    const { table, entityName } = params;
    return createStandardEntity<CmsGroup>({
        table: table.table,
        name: entityName
    });
};
