import WebinyError from "@webiny/error";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin";

export const createDefaultFilterCreate = () => {
    const plugin = new CmsEntryFieldFilterPlugin({
        fieldType: CmsEntryFieldFilterPlugin.ALL,
        create: params => {
            const { negate, transformValue, field, compareValue, valueFilterPlugins } = params;
            const plugin = valueFilterPlugins[params.operation];
            if (!plugin) {
                throw new WebinyError(
                    `Missing ValueFilterPlugin for operation "${params.operation}".`,
                    "MISSING_OPERATION_PLUGIN",
                    {
                        operation: params.operation
                    }
                );
            }
            return {
                negate,
                transformValue,
                field,
                compareValue,
                fieldPathId: [...field.parents.map(f => f.fieldId), field.fieldId].join("."),
                path: field.createPath({
                    field
                }),
                plugin
            };
        }
    });

    plugin.name = `headless-cms.ddb.filter.default`;

    return plugin;
};
