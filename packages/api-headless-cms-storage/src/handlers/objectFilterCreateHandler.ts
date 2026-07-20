import WebinyError from "@webiny/error";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import { extractWhereParams } from "../filtering/where.js";
import { transformValue } from "../filtering/transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export const createObjectFilterCreateHandler = (): FieldFilterCreateRegistry.Handler => {
    return {
        create: params => {
            const {
                value: objectValue,
                valueFilterRegistry,
                transformRegistry,
                getHandler,
                field: parentField,
                fields
            } = params;

            const filters: FieldFilterCreateRegistry.Result[] = [];

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
                        { fieldId }
                    );
                }

                const fieldType = getBaseFieldType(field);
                const handler = getHandler(fieldType);
                const transformHandler = transformRegistry.get(fieldType);

                const transformValueCallable = (value: any) => {
                    if (!transformHandler) {
                        return value;
                    }
                    return transformHandler.transform({ field, value });
                };

                const result = handler.create({
                    key,
                    value,
                    valueFilterRegistry,
                    transformRegistry,
                    getHandler,
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
    };
};
