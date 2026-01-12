import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import { createStandardEntity } from "@webiny/db-dynamodb";
import type { IEntryEntity, IEntryEntityAttributesData } from "~/definitions/types.js";

export interface CreateEntryEntityParams {
    table: Table<string, string, string>;
    entityName: string;
}
export const createEntryEntity = (params: CreateEntryEntityParams): IEntryEntity => {
    const { table, entityName } = params;
    return createStandardEntity<IEntryEntityAttributesData>({
        name: entityName,
        table
    });
};
