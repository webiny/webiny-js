import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";
import type { IEntryEntity, IEntryEntityAttirbutesData } from "./types.js";

interface Params {
    table: Table<string, string, string>;
    entityName: string;
}

export const createEntryEntity = (params: Params): IEntryEntity => {
    const { table, entityName } = params;
    return createStandardEntity<IEntryEntityAttirbutesData>({
        name: entityName,
        table
    });
};
