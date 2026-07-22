import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../features/fieldFilterCreate/abstractions.js";
import { extractWhereParams } from "../filtering/where.js";
import { transformValue } from "../filtering/transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export const createRefFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const { valueFilterRegistry, transformRegistry, field } = params;
            let value = params.value;
            if (!value) {
                value = { entryId: null };
            }
            const propertyFilters = Object.keys(value);
            if (propertyFilters.length === 0) {
                return null;
            }
            const filters: FieldFilterCreateRegistry.Result[] = [];

            for (const propertyFilter of propertyFilters) {
                const whereParams = extractWhereParams(propertyFilter);
                if (!whereParams) {
                    continue;
                }
                const { fieldId: propertyId, operation: propertyOperation, negate } = whereParams;

                const fieldType = getBaseFieldType(field);
                const transformHandler = transformRegistry.get(fieldType);

                const transformValueCallable = (value: any) => {
                    if (!transformHandler) {
                        return value;
                    }
                    return transformHandler.transform({ field, value });
                };

                const filter = valueFilterRegistry.get(propertyOperation);
                if (!filter) {
                    throw new WebinyError(
                        `Missing operation filter for "${propertyOperation}".`,
                        "MISSING_OPERATION_FILTER"
                    );
                }

                const paths = [field.createPath({ field }), propertyId];

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
    };
};
