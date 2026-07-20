import WebinyError from "@webiny/error";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { Field } from "../fields/types.js";
import { extractWhereParams } from "../where.js";
import { transformValue } from "../transform.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { ValueFilter, ValueFilterRegistry } from "@webiny/db-utils";
import type { FieldFilterCreateRegistry } from "../../features/fieldFilterCreate/abstractions.js";
import type { FieldFilterValueTransformRegistry } from "../../features/fieldFilterValueTransform/abstractions.js";
import { getWhereValues } from "../values.js";

interface CreateExpressionParams {
    where: Partial<CmsEntryListWhere>;
    condition: ExpressionCondition;
}

interface ICreateExpressionsParams {
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
    where: Partial<CmsEntryListWhere>;
    fields: Record<string, Field>;
}

export type ExpressionCondition = "AND" | "OR";

export interface Expression {
    expressions: Expression[];
    filters: Filter[];
    condition: ExpressionCondition;
}

export interface Filter {
    field: Field;
    path: string;
    fieldPathId: string;
    filter: ValueFilter.Interface;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export const createExpressions = (params: ICreateExpressionsParams): Expression => {
    const { where, filterCreateRegistry, transformRegistry, fields, valueFilterRegistry } = params;

    const getHandler = (type: string) => {
        const fieldType = getBaseFieldType({ type });
        const handler = filterCreateRegistry.get(fieldType) || filterCreateRegistry.getDefault();
        if (handler) {
            return handler;
        }
        throw new WebinyError(
            `There is no filter create handler for the field type "${fieldType}".`,
            "MISSING_FILTER_CREATE_HANDLER",
            { fieldType }
        );
    };

    const createExpression = ({ where, condition }: CreateExpressionParams): Expression => {
        const expression: Expression = {
            filters: [],
            expressions: [],
            condition
        };

        for (const key in where) {
            const value = where[key as keyof typeof where];
            if (value === undefined) {
                continue;
            }

            if (key === "AND") {
                const childWhereList = getWhereValues(value, key);
                const childExpression: Expression = {
                    condition: "AND",
                    filters: [],
                    expressions: []
                };
                for (const childWhere of childWhereList) {
                    const result = createExpression({
                        where: childWhere,
                        condition: "AND"
                    });
                    childExpression.expressions.push(result);
                }
                expression.expressions.push(childExpression);
                continue;
            }
            if (key === "OR") {
                const childWhereList = getWhereValues(value, key);
                const childExpression: Expression = {
                    condition: "OR",
                    filters: [],
                    expressions: []
                };
                for (const childWhere of childWhereList) {
                    const result = createExpression({
                        where: childWhere,
                        condition: "AND"
                    });
                    childExpression.expressions.push(result);
                }
                expression.expressions.push(childExpression);
                continue;
            }

            const whereParams = extractWhereParams(key);
            if (!whereParams) {
                continue;
            }

            const { fieldId, operation, negate } = whereParams;

            const field = fields[fieldId];
            if (!field) {
                throw new WebinyError(
                    `There is no field with the fieldId "${fieldId}".`,
                    "FIELD_ERROR",
                    { fieldId }
                );
            }

            const handler = getHandler(field.type);
            const fieldType = getBaseFieldType(field);
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

            if (!result || (Array.isArray(result) && result.length === 0)) {
                continue;
            }

            expression.filters.push(...(Array.isArray(result) ? result : [result]));
        }

        return expression;
    };

    const expression = createExpression({
        where,
        condition: "AND"
    });

    if (expression.filters.length > 0 || expression.expressions.length !== 1) {
        return expression;
    }
    return expression.expressions[0];
};
