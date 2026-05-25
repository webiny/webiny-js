import {
    TableNameResolver as TableNameResolverAbstraction,
    TableNameResolverConfig
} from "./abstractions.js";

class TableNameResolverImpl implements TableNameResolverAbstraction.Interface {
    private readonly prefix: string | null;

    constructor(private readonly config: TableNameResolverConfig.Interface) {
        this.prefix = config.tableNamePrefix ? this.sanitize(config.tableNamePrefix) : null;
    }

    public resolve(tenant: string, entityName: string): string {
        const sanitizedEntity = this.sanitize(entityName);
        const base = this.prefix ? `${this.prefix}_cms` : "cms";

        if (this.config.sharedTables) {
            return `${base}_${sanitizedEntity}`;
        }

        const sanitizedTenant = this.sanitize(tenant);

        return `${base}_${sanitizedTenant}_${sanitizedEntity}`;
    }

    private sanitize(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    }
}

export const TableNameResolver = TableNameResolverAbstraction.createImplementation({
    implementation: TableNameResolverImpl,
    dependencies: [TableNameResolverConfig]
});
