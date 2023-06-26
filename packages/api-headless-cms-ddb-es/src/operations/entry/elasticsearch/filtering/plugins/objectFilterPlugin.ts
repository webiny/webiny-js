import { CmsEntryFilterPlugin } from "~/plugins/CmsEntryFilterPlugin";
import { parseWhereKey } from "@webiny/api-elasticsearch";
import WebinyError from "@webiny/error";

export const createObjectFilterPlugin = () => {
    const plugin = new CmsEntryFilterPlugin({
        fieldType: "object",
        exec: params => {
            const {
                applyFiltering,
                value: where,
                fields,
                field: parentField,
                getFilterPlugin,
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
                 * We need to find the filter plugin for the child field.
                 * This will throw error if no plugin can be found.
                 */
                const plugin = getFilterPlugin(field.type);
                /**
                 * Basically this allows us to go into depth as much as we want with the object fields.
                 */
                plugin.exec({
                    applyFiltering,
                    getFilterPlugin,
                    key,
                    value,
                    operator,
                    field,
                    fields,
                    query
                });
            }
        }
    });

    plugin.name = `${plugin.type}.default.object`;

    return plugin;
};
