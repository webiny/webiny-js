import WebinyError from "@webiny/error";
import {
    CmsEntryFieldFilterPlugin,
    CmsEntryFieldFilterPluginCreateResponse
} from "~/plugins/CmsEntryFieldFilterPlugin";
import { extractWhereParams } from "~/operations/entry/filtering/where";
import { transformValue } from "~/operations/entry/filtering/transform";

export const createRefFilterCreate = () => {
    return new CmsEntryFieldFilterPlugin({
        fieldType: "ref",
        create: params => {
            const { value, plugins, field } = params;
            const propertyFilters = Object.keys(value);
            if (propertyFilters.length === 0) {
                return null;
            }

            const filters: CmsEntryFieldFilterPluginCreateResponse[] = [];

            for (const propertyFilter of propertyFilters) {
                const whereParams = extractWhereParams(propertyFilter);
                if (!whereParams) {
                    continue;
                }
                const {
                    fieldId: propertyId,
                    operation: propertyOperation,
                    negate: propertyNegate
                } = whereParams;

                const filterPlugin = plugins[propertyOperation];
                if (!filterPlugin) {
                    throw new WebinyError(
                        `Missing operation filter for "${propertyOperation}".`,
                        "MISSING_OPERATION_FILTER"
                    );
                }

                const multiValue = field.multipleValues ? ".*." : ".";

                filters.push({
                    field,
                    path: `${field.createPath({ field })}${multiValue}${propertyId}`,
                    plugin: filterPlugin,
                    negate: propertyNegate,
                    compareValue: transformValue({
                        value: value[propertyFilter],
                        transform: transformValueCallable
                    }),
                    transformValue: transformValueCallable
                });
            }

            return filters;
        }
    });
};
