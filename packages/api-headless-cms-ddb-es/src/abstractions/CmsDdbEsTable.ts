import { createAbstraction } from "@webiny/feature/api";
import type { ITable } from "@webiny/db-dynamodb";

export const CmsDdbEsTable = createAbstraction<ITable>("Cms/DdbEs/Table");

export namespace CmsDdbEsTable {
    export type Interface = ITable;
}
