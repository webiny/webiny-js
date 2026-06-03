import WebinyError from "@webiny/error";
import type { CmsEntryFieldFilterPluginCreateResponse } from "../../plugins/CmsEntryFieldFilterPlugin.js";
import { CmsEntryFieldFilterPlugin } from "../../plugins/CmsEntryFieldFilterPlugin.js";
import { extractWhereParams } from "../where.js";
import { transformValue } from "../transform.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export const createRefFilterCreate = () => {
    const plugin = new CmsEntryFieldFilterPlugin<GenericRecord | null | undefined>({
        fieldType: "ref",
        create: params => {
            const { valueFilterRegistry, transformValuePlugins, field } = params;
            let value = params.value;
            if (!value) {
                value = {
                    entryId: null
                };
            }
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

                const fieldType = getBaseFieldType(field);

                const transformValuePlugin = transformValuePlugins[fieldType];

                const transformValueCallable = (value: any) => {
                    if (!transformValuePlugin) {
                        return value;
                    }
                    return transformValuePlugin.transform({
                        field,
                        value
                    });
                };

                const filter = valueFilterRegistry.get(propertyOperation);
                if (!filter) {
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
                    filter,
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

    plugin.name = `headless-cms.ddb.filter.ref`;

    return plugin;
};
