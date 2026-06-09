import { CmsEntryFieldFilterPlugin } from "../../plugins/CmsEntryFieldFilterPlugin.js";
import { extractWhereParams } from "../where.js";
import WebinyError from "@webiny/error";
import type { ICmsFieldFilterValueTransformPlugin } from "../../plugins/CmsFieldFilterValueTransformPlugin.js";
import { transformValue } from "../transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export const objectFilterCreate = () => {
    const plugin = new CmsEntryFieldFilterPlugin({
        fieldType: "object",
        create: params => {
            const {
                value: objectValue,
                valueFilterRegistry,
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

                const fieldType = getBaseFieldType(field);

                const filterCreatePlugin = getFilterCreatePlugin(fieldType);

                const transformValuePlugin: ICmsFieldFilterValueTransformPlugin =
                    transformValuePlugins[fieldType];

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
                    valueFilterRegistry,
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
