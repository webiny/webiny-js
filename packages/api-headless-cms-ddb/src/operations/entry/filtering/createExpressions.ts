import WebinyError from "@webiny/error";
import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { Field } from "./types";
import { getMappedPlugins } from "./mapPlugins";
import { extractWhereParams } from "./where";
import { transformValue } from "./transform";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin";
import { getWhereValues } from "~/operations/entry/filtering/values";

interface CreateExpressionParams {
    where: Partial<CmsEntryListWhere>;
    condition: ExpressionCondition;
}

interface CreateExpressionCb {
    (params: CreateExpressionParams): Expression;
}

interface Params {
    plugins: PluginsContainer;
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
    plugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export const createExpressions = (params: Params): Expression => {
    const { where, plugins, fields } = params;
    const filterPlugins = getMappedPlugins<ValueFilterPlugin>({
        plugins,
        type: ValueFilterPlugin.type,
        property: "operation"
    });
    const transformValuePlugins = getMappedPlugins<CmsFieldFilterValueTransformPlugin>({
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
        const filterCreatePlugin = fieldFilterCreatePlugins[type] || defaultFilterCreatePlugin;
        if (filterCreatePlugin) {
            return filterCreatePlugin;
        }
        throw new WebinyError(
            `There is no filter create plugin for the field type "${type}".`,
            "MISSING_FILTER_CREATE_PLUGIN",
            {
                type
            }
        );
    };

    const createExpression: CreateExpressionCb = ({ where, condition }) => {
        const expression: Expression = {
            filters: [],
            expressions: [],
            condition
        };

        for (const key in where) {
            const value = where[key];
            if (value === undefined) {
                continue;
            }

            /**
             * If there are "AND" or "OR" keys, let's sort them out first.
             *
             *
             * AND conditional
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
            /**
             * OR conditional
             */
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

            /**
             * We need a filter create plugin for this type.
             */
            const filterCreatePlugin = getFilterCreatePlugin(field.type);

            const transformValuePlugin: CmsFieldFilterValueTransformPlugin =
                transformValuePlugins[field.type];

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
                valueFilterPlugins: filterPlugins,
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
            /**
             * There is a possibility of
             * - no result
             * - result being an array
             * - result being an object
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
    /**
     * If the first expression has no filters and has only one expression, put that expression as main one.
     * This will mostly be used when having an OR condition as the single expression in the root level of the where
     */
    if (expression.filters.length > 0 || expression.expressions.length !== 1) {
        return expression;
    }
    return expression.expressions[0];
};
