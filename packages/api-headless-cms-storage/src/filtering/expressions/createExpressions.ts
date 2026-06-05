import WebinyError from "@webiny/error";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { ICmsFieldFilterValueTransformPlugin } from "../../plugins/CmsFieldFilterValueTransformPlugin.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { Field } from "../fields/types.js";
import { getMappedPlugins } from "../mapPlugins.js";
import { extractWhereParams } from "../where.js";
import { transformValue } from "../transform.js";
import { CmsEntryFieldFilterPlugin } from "../../plugins/CmsEntryFieldFilterPlugin.js";
import { getWhereValues } from "../values.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { ValueFilter, ValueFilterRegistry } from "@webiny/db-utils";

interface CreateExpressionParams {
    where: Partial<CmsEntryListWhere>;
    condition: ExpressionCondition;
}

interface ICreateExpressionsParams {
    plugins: PluginsContainer;
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
    const { where, plugins, fields, valueFilterRegistry } = params;

    const transformValuePlugins = getMappedPlugins<ICmsFieldFilterValueTransformPlugin>({
        plugins,
        type: "cms-field-filter-value-transform",
        property: "fieldType"
    });
    const fieldFilterCreatePlugins = getMappedPlugins<CmsEntryFieldFilterPlugin>({
        plugins,
        type: CmsEntryFieldFilterPlugin.type,
        property: "fieldType"
    });

    const defaultFilterCreatePlugin = fieldFilterCreatePlugins["*"] as CmsEntryFieldFilterPlugin;

    const getFilterCreatePlugin = (type: string) => {
        const fieldType = getBaseFieldType({
            type
        });
        const filterCreatePlugin = fieldFilterCreatePlugins[fieldType] || defaultFilterCreatePlugin;
        if (filterCreatePlugin) {
            return filterCreatePlugin;
        }
        throw new WebinyError(
            `There is no filter create plugin for the field type "${fieldType}".`,
            "MISSING_FILTER_CREATE_PLUGIN",
            {
                fieldType
            }
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

            /*
             * If there are "AND" or "OR" keys, let's sort them out first.
             *
             * AND conditional.
             */
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
            /* OR conditional. */
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
                    {
                        fieldId
                    }
                );
            }

            /* We need a filter create plugin for this type. */
            const filterCreatePlugin = getFilterCreatePlugin(field.type);

            const fieldType = getBaseFieldType(field);

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
            /*
             * There is a possibility of:
             * - no result
             * - result being an array
             * - result being an object.
             */
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
    /*
     * If the first expression has no filters and has only one expression, put that expression as main one.
     * This will mostly be used when having an OR condition as the single expression in the root level of the where.
     */
    if (expression.filters.length > 0 || expression.expressions.length !== 1) {
        return expression;
    }
    return expression.expressions[0];
};
