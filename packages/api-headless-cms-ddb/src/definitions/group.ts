import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { Entity } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}
export const createGroupEntity = (params: Params): Entity<any> => {
    const { table, entityName } = params;
    return createStandardEntity({ table, name: entityName });
};
