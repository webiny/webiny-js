import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";
import type { IGroupEntity } from "./types.js";
import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createGroupEntity = (params: Params): IGroupEntity => {
    const { table, entityName } = params;
    return createStandardEntity<CmsGroup>({
        table,
        name: entityName
    });
};
