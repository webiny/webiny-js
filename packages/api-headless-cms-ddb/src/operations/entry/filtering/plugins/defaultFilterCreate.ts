import WebinyError from "@webiny/error";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin";

export const createDefaultFilterCreate = () => {
    return new CmsEntryFieldFilterPlugin({
        fieldType: CmsEntryFieldFilterPlugin.ALL,
        create: params => {
            const plugin = params.plugins[params.operation];
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
                ...params,
                path: params.field.createPath({
                    field: params.field
                }),
                plugin
            };
        }
    });
};
