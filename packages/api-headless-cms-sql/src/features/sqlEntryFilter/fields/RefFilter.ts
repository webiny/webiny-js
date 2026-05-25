import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";
import { parseWhereKey } from "../../../utils/parseWhereKey.js";

class RefFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "ref";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, value, field, query } = params;

        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return;
        }

        const refObject = value as Record<string, unknown>;

        for (const refKey of Object.keys(refObject)) {
            const { operator } = parseWhereKey(refKey);

            applyFiltering({
                query,
                column: field.columnName,
                operator,
                value: refObject[refKey]
            });
        }
    }
}

export const RefFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: RefFilterImpl,
    dependencies: []
});
