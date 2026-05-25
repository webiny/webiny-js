import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";

export const FILTER_DEFAULT = "*";

class DefaultFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = FILTER_DEFAULT;

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, operator, value, field, query } = params;

        if (!field.searchable) {
            return;
        }

        applyFiltering({
            query,
            column: field.columnName,
            operator,
            value
        });
    }
}

export const DefaultFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: DefaultFilterImpl,
    dependencies: []
});
