import {
    TableNameResolver as TableNameResolverAbstraction,
    TableNameResolverConfig
} from "./abstractions.js";

class TableNameResolverImpl implements TableNameResolverAbstraction.Interface {
    private readonly prefix: string;
    private readonly suffix: string;

    constructor(private readonly config: TableNameResolverConfig.Interface) {
        this.prefix = config.tableNamePrefix ? `${this.sanitize(config.tableNamePrefix)}_` : "";
        this.suffix = config.tableNameSuffix ? `_${this.sanitize(config.tableNameSuffix)}` : "";
    }

    public resolve(entityName: string): string {
        const sanitized = this.sanitize(entityName);
        return `${this.prefix}webiny_cms_${sanitized}${this.suffix}`;
    }

    private sanitize(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    }
}

export const TableNameResolver = TableNameResolverAbstraction.createImplementation({
    implementation: TableNameResolverImpl,
    dependencies: [TableNameResolverConfig]
});
