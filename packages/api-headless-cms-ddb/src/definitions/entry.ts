import { createStandardEntity, type ITable } from "@webiny/db-dynamodb";
import type { IEntryEntity, IEntryEntityAttirbutesData } from "./types.js";

interface Params {
    table: ITable;
    entityName: string;
}

export const createEntryEntity = (params: Params): IEntryEntity => {
    const { table, entityName } = params;
    return createStandardEntity<IEntryEntityAttirbutesData>({
        name: entityName,
        table: table.table
    });
};
