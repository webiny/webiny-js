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
            const { value, valueFilterPlugins, transformValuePlugins, field } = params;
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
                const { fieldId: propertyId, operation: propertyOperation, negate } = whereParams;

                const transformValuePlugin = transformValuePlugins[field.type];

                const transformValueCallable = (value: any) => {
                    if (!transformValuePlugin) {
                        return value;
                    }
                    return transformValuePlugin.transform({
                        field,
                        value
                    });
                };

                const filterPlugin = valueFilterPlugins[propertyOperation];
                if (!filterPlugin) {
                    throw new WebinyError(
                        `Missing operation filter for "${propertyOperation}".`,
                        "MISSING_OPERATION_FILTER"
                    );
                }

                const paths = [
                    field.createPath({
                        field
                    }),
                    propertyId
                ];

                filters.push({
                    field,
                    path: paths.join("."),
                    fieldPathId: [...field.parents.map(f => f.fieldId), field.fieldId].join("."),
                    plugin: filterPlugin,
                    negate,
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
