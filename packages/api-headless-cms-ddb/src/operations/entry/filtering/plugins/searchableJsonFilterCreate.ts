import type { CmsEntryFieldFilterPluginCreateResponse } from "~/plugins/CmsEntryFieldFilterPlugin.js";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin.js";
import { extractWhereParams } from "~/operations/entry/filtering/where.js";

function dotFlatten(obj: Record<string, any>, prefix = ""): Record<string, any> {
    return Object.entries(obj).reduce<Record<string, any>>((acc, [key, val]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === "object" && !Array.isArray(val)) {
            Object.assign(acc, dotFlatten(val, path));
        } else {
            acc[path] = val;
        }
        return acc;
    }, {});
}

export const searchableJsonFilterCreate = () => {
    const plugin = new CmsEntryFieldFilterPlugin({
        fieldType: "searchable-json",
        create: params => {
            const { value: objectValue, valueFilterRegistry, field: parentField } = params;

            const filters = [];

            const accessPatterns = dotFlatten(objectValue);

            for (const key in accessPatterns) {
                const value = accessPatterns[key];
                if (value === undefined) {
                    continue;
                }

                const whereParams = extractWhereParams(key);
                if (!whereParams) {
                    continue;
                }
                const { negate, operation } = whereParams;

                const transformValueCallable = (value: any) => {
                    return value;
                };

                const fieldId = `${parentField.fieldId}.${whereParams.fieldId ?? key}`;

                const filter = valueFilterRegistry.get(operation);
                if (!filter) {
                    console.error(`Missing operation filter for "${operation}".`);
                    continue;
                }

                const result: CmsEntryFieldFilterPluginCreateResponse = {
                    field: parentField,
                    path: `values.${fieldId}`,
                    fieldPathId: `values.${fieldId}`,
                    negate,
                    filter,
                    compareValue: value,
                    transformValue: transformValueCallable
                };

                if (!result) {
                    continue;
                }
                if (Array.isArray(result)) {
                    filters.push(...result);
                    continue;
                }

                filters.push(result);
            }
            return filters;
        }
    });

    plugin.name = `headless-cms.ddb.filter.searchable-json`;

    return plugin;
};
