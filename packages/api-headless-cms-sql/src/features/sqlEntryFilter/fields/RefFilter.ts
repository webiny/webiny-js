import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";
import { parseWhereKey } from "~/utils/parseWhereKey.js";

const toEntryId = (value: unknown): unknown => {
    if (typeof value === "string") {
        const idx = value.indexOf("#");
        return idx === -1 ? value : value.slice(0, idx);
    }

    if (Array.isArray(value)) {
        return value.map(toEntryId);
    }

    return value;
};

class RefFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "ref";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, query, field } = params;
        const values = params.value;

        if (values === null || values === undefined) {
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

            const { fieldId, operator } = parseWhereKey(key);
            const needsEntryIdConversion = fieldId === "id" || fieldId === "entryId";

            applyFiltering({
                query,
                column: `${field.columnName}__entryId`,
                operator,
                value: needsEntryIdConversion ? toEntryId(refValue) : refValue
            });
        }
    }
}

export const RefFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: RefFilterImpl,
    dependencies: []
});
