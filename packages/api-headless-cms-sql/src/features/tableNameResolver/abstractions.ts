import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ITableNameResolver {
    resolve(tenant: string, entityName: string): string;
}

export const TableNameResolver = createAbstraction<ITableNameResolver>("Cms/Sql/TableNameResolver");

export namespace TableNameResolver {
    export type Interface = ITableNameResolver;
}
