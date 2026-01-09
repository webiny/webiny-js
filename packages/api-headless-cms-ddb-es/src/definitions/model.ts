import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createEntity, type IEntity, standardEntityAttributes } from "@webiny/db-dynamodb";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createModelEntity = (params: Params): IEntity => {
    const { table, entityName } = params;
    return createEntity({
        table,
        name: entityName,
        attributes: standardEntityAttributes
    });
};
