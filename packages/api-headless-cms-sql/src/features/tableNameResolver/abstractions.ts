import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ITableNameResolverConfig {
    sharedTables: boolean;
    tableNamePrefix?: string;
}

export const TableNameResolverConfig = createAbstraction<ITableNameResolverConfig>(
    "Cms/Sql/TableNameResolverConfig"
);

export namespace TableNameResolverConfig {
    export type Interface = ITableNameResolverConfig;
}

export interface ITableNameResolver {
    resolve(tenant: string, entityName: string): string;
}

export const TableNameResolver = createAbstraction<ITableNameResolver>("Cms/Sql/TableNameResolver");

export namespace TableNameResolver {
    export type Interface = ITableNameResolver;
}
