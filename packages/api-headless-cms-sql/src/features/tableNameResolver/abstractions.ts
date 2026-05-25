import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ITableNameResolver {
    resolve(tenant: string, entityName: string): string;
}

export const TableNameResolverAbstraction = createAbstraction<ITableNameResolver>(
    "Cms/Sql/TableNameResolver"
);

export namespace TableNameResolverAbstraction {
    export type Interface = ITableNameResolver;
}
