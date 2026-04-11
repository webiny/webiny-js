import dot from "dot-object";
import type { CmsEntryFieldFilterPluginCreateResponse } from "~/plugins/CmsEntryFieldFilterPlugin.js";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin.js";
import { extractWhereParams } from "~/operations/entry/filtering/where.js";

export const searchableJsonFilterCreate = () => {
    const plugin = new CmsEntryFieldFilterPlugin({
        fieldType: "searchable-json",
        create: params => {
            const { value: objectValue, valueFilterRegistry, field: parentField } = params;

            const filters = [];

            const accessPatterns = dot.dot(objectValue);

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
