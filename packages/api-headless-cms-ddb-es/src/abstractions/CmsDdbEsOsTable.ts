import { createAbstraction } from "@webiny/feature/api";
import type { ITable } from "@webiny/db-dynamodb";

export const CmsDdbEsOsTable = createAbstraction<ITable>("Cms/DdbEs/OsTable");

export namespace CmsDdbEsOsTable {
    export type Interface = ITable;
}
