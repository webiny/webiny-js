import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../features/fieldFilterCreate/abstractions.js";

export const createDefaultFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const { negate, transformValue, field, compareValue, valueFilterRegistry } = params;
            const filter = valueFilterRegistry.get(params.operation);
            if (!filter) {
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
                filter
            };
        }
    };
};
