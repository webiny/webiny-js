interface ITableNameResolverParams {
    sharedTables: boolean;
    tableNamePrefix?: string;
}

export class TableNameResolver {
    private readonly sharedTables: boolean;
    private readonly prefix: string;

    constructor(params: ITableNameResolverParams) {
        this.sharedTables = params.sharedTables;
        this.prefix = params.tableNamePrefix ? this.sanitize(params.tableNamePrefix) : "cms";
    }

    public resolve(tenant: string, entityName: string): string {
        const sanitizedEntity = this.sanitize(entityName);

        if (this.sharedTables) {
            return `${this.prefix}_${sanitizedEntity}`;
        }

        const sanitizedTenant = this.sanitize(tenant);

        return `${this.prefix}_${sanitizedTenant}_${sanitizedEntity}`;
    }

    private sanitize(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    }
}
