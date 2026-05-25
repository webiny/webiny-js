import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";
import { parseWhereKey } from "../../../utils/parseWhereKey.js";

class ObjectFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "object";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, getFilter, value, field, fields, query } = params;

        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return;
        }

        const whereObject = value as Record<string, unknown>;

        for (const whereKey of Object.keys(whereObject)) {
            const { fieldId: whereFieldId, operator } = parseWhereKey(whereKey);

            const parentPath = field.parents.map(p => p.fieldId);
            const identifier = [...parentPath, field.fieldId, whereFieldId].join(".");

            const nestedField = fields[identifier];

            if (!nestedField) {
                continue;
            }

            const filter = getFilter(nestedField.type);

            filter.exec({
                applyFiltering,
                getFilter,
                key: whereKey,
                value: whereObject[whereKey],
                operator,
                field: nestedField,
                fields,
                query
            });
        }
    }
}

export const ObjectFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: ObjectFilterImpl,
    dependencies: []
});
