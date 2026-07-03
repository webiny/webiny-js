import { createAbstraction } from "@webiny/feature/exports/api.js";

export interface ITableName {
    resolve(name: string): string;
}

export const TableName = createAbstraction<ITableName>("Websockets/Sql/TableName");

export namespace TableName {
    export type Interface = ITableName;
}
