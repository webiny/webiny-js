import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin";
import { extractWhereParams } from "~/operations/entry/filtering/where";
import WebinyError from "@webiny/error";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import { transformValue } from "~/operations/entry/filtering/transform";

export const objectFilterCreate = () => {
    const plugin = new CmsEntryFieldFilterPlugin({
        fieldType: "object",
        create: params => {
            const {
                value: objectValue,
                valueFilterPlugins,
                transformValuePlugins,
                getFilterCreatePlugin,
                field: parentField,
                fields
            } = params;

            const filters = [];

            for (const key in objectValue) {
                const value = objectValue[key];
                if (value === undefined) {
                    continue;
                }
                const whereParams = extractWhereParams(key);
                if (!whereParams) {
                    continue;
                }
                const { negate, fieldId, operation } = whereParams;

                const fieldPath = parentField.parents
                    .map(p => p.fieldId)
                    .concat([parentField.fieldId, fieldId])
                    .join(".");

                const field = fields[fieldPath];
                if (!field) {
                    throw new WebinyError(
                        `There is no field with the field path "${fieldPath}".`,
                        "FIELD_ERROR",
                        {
                            fieldId
                        }
                    );
                }

                const filterCreatePlugin = getFilterCreatePlugin(field.type);

                const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
                    transformValuePlugins[field.type];

                const transformValueCallable = (value: any) => {
                    if (!transformValuePlugin) {
                        return value;
                    }
                    return transformValuePlugin.transform({
                        field,
                        value
                    });
                };

                const result = filterCreatePlugin.create({
                    key,
                    value,
                    valueFilterPlugins,
                    transformValuePlugins,
                    getFilterCreatePlugin,
                    operation,
                    negate,
                    field,
                    fields,
                    compareValue: transformValue({
                        value,
                        transform: transformValueCallable
                    }),
                    transformValue: transformValueCallable
                });
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

    plugin.name = `headless-cms.ddb.filter.object`;

    return plugin;
};
