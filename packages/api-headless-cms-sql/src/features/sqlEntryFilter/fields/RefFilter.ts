import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";
import { parseWhereKey } from "~/utils/parseWhereKey.js";

class RefFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "ref";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, query, field } = params;
        const values = params.value;

        if (values === null || values === undefined) {
            /* Filter for entries where the ref is null. */
            applyFiltering({
                query,
                column: `${field.columnName}__entryId`,
                operator: "eq",
                value: null
            });
            return;
        }

        if (typeof values !== "object" || Array.isArray(values)) {
            return;
        }

        const refWhere = values as Record<string, unknown>;

        for (const key of Object.keys(refWhere)) {
            const refValue = refWhere[key];

            if (refValue === undefined) {
                continue;
            }

            const { operator } = parseWhereKey(key);

            /* All ref sub-property filters go to the __entryId companion column. */
            applyFiltering({
                query,
                column: `${field.columnName}__entryId`,
                operator,
                value: refValue
            });
        }
    }
}

export const RefFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: RefFilterImpl,
    dependencies: []
});
