import { createStandardEntity, type ITable } from "@webiny/db-dynamodb";
import type { IEntryEntity, IEntryEntityAttributesData } from "~/definitions/types.js";

export interface CreateEntryEntityParams {
    table: ITable;
    entityName: string;
}
export const createEntryEntity = (params: CreateEntryEntityParams): IEntryEntity => {
    const { table, entityName } = params;
    return createStandardEntity<IEntryEntityAttributesData>({
        name: entityName,
        table: table.table
    });
};
