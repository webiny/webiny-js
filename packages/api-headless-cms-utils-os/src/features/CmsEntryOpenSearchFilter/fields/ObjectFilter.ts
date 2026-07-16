import WebinyError from "@webiny/error";
import { CmsEntryOpenSearchFilter } from "../abstractions/CmsEntryOpenSearchFilter.js";
import { parseWhereKey } from "@webiny/api-opensearch";

class ObjectFilterImpl implements CmsEntryOpenSearchFilter.Interface {
    public readonly fieldType = "object";

    public exec(params: CmsEntryOpenSearchFilter.ExecParams): void {
        const {
            applyFiltering,
            value: where,
            fields,
            field: parentField,
            getFilter,
            query
        } = params;
        /**
         * Because this is an object field, we must construct filters based on the value property.
         * Value property is actually a where condition.
         */
        for (const key in where) {
            const value = where[key];
            if (value === undefined) {
                continue;
            }
            const { field: whereFieldId, operator } = parseWhereKey(key);

            const identifier = [
                ...parentField.parents.map(p => p.fieldId),
                parentField.field.fieldId,
                whereFieldId
            ].join(".");
            const field = fields[identifier];
            if (!field) {
                throw new WebinyError(
                    `There is no field "${identifier}".`,
                    "OBJECT_FILTER_FIELD_ERROR",
                    {
                        fields: Object.keys(fields)
                    }
                );
            }
            /**
             * We need to find the filter for the child field.
             * This will throw error if no filter can be found.
             */
            const filter = getFilter(field.type);
            /**
             * Basically this allows us to go into depth as much as we want with the object fields.
             */
            filter.exec({
                applyFiltering,
                getFilter,
                key,
                value,
                operator,
                field,
                fields,
                query
            });
        }
    }
}

export const ObjectFilter = CmsEntryOpenSearchFilter.createImplementation({
    implementation: ObjectFilterImpl,
    dependencies: []
});
