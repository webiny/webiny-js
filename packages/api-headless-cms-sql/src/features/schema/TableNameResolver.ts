import type { ITableNameResolver } from "~/features/schema/abstractions/index.js";

interface ITableNameResolverParams {
    sharedTables: boolean;
    tableNamePrefix?: string;
}

export class TableNameResolverImpl implements ITableNameResolver {
    private readonly sharedTables: boolean;
    private readonly prefix: string | null;

    constructor(params: ITableNameResolverParams) {
        this.sharedTables = params.sharedTables;
        this.prefix = params.tableNamePrefix ? this.sanitize(params.tableNamePrefix) : null;
    }

    public resolve(tenant: string, entityName: string): string {
        const sanitizedEntity = this.sanitize(entityName);
        const base = this.prefix ? `${this.prefix}_cms` : "cms";

        if (this.sharedTables) {
            return `${base}_${sanitizedEntity}`;
        }

        const sanitizedTenant = this.sanitize(tenant);

        return `${base}_${sanitizedTenant}_${sanitizedEntity}`;
    }

    private sanitize(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    }
}
