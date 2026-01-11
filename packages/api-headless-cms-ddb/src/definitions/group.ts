import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb";
import { createEntity, standardEntityAttributes } from "@webiny/db-dynamodb";
import type { IGroupEntity } from "./types.js";
import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createGroupEntity = (params: Params): IGroupEntity => {
    const { table, entityName } = params;
    return createEntity<IStandardEntityAttributes<CmsGroup>>({
        table,
        name: entityName,
        attributes: standardEntityAttributes
    });
};
