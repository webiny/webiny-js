import {
    SqlEntryFilterRegistry as SqlEntryFilterRegistryAbstraction,
    SqlEntryFilter
} from "./abstractions/index.js";
import { FILTER_DEFAULT } from "./fields/DefaultFilter.js";

class SqlEntryFilterRegistryImpl implements SqlEntryFilterRegistryAbstraction.Interface {
    private readonly filters: Map<string, SqlEntryFilter.Interface>;

    public constructor(filters: SqlEntryFilter.Interface[]) {
        this.filters = new Map(filters.map(f => [f.fieldType, f]));
    }

    public get(fieldType: string): SqlEntryFilter.Interface {
        const filter = this.filters.get(fieldType);

        if (filter) {
            return filter;
        }

        const defaultFilter = this.filters.get(FILTER_DEFAULT);

        if (!defaultFilter) {
            throw new Error(
                `SQL entry filter for field type "${fieldType}" is not registered, and no default filter ("${FILTER_DEFAULT}") was found.`
            );
        }

        return defaultFilter;
    }
}

export const SqlEntryFilterRegistry = SqlEntryFilterRegistryAbstraction.createImplementation({
    implementation: SqlEntryFilterRegistryImpl,
    dependencies: [[SqlEntryFilter, { multiple: true }]]
});
