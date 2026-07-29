import { createAbstraction } from "@webiny/feature/api";
import type { ITable } from "@webiny/db-dynamodb";

export const CmsDdbTable = createAbstraction<ITable>("Cms/Ddb/Table");

export namespace CmsDdbTable {
    export type Interface = ITable;
}
