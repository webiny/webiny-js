import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import { Field } from "./types";
import { getMappedPlugins } from "./mapPlugins";
import { extractWhereParams } from "./where";
import { transformValue } from "./transform";
import { CmsEntryFieldFilterPlugin } from "~/plugins/CmsEntryFieldFilterPlugin";
import { getWhereValues } from "~/operations/entry/filtering/values";

interface ApplyExpressionsParams {
    where: Partial<CmsEntryListWhere>;
    expressions: Expression[];
}

interface Params {
    plugins: PluginsContainer;
    where: Partial<CmsEntryListWhere>;
    fields: Record<string, Field>;
}

interface FilterExpression {
    filters: Filter[];
    condition: "AND" | "OR";
    children?: never;
}
interface ChildrenExpression {
    children: Expression[];
    filters?: never;
    condition: "AND" | "OR";
}

export type Expression = FilterExpression | ChildrenExpression;

export interface Filter {
    field: Field;
    path: string;
    fieldPathId: string;
    plugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export const createExpressions = (params: Params): Expression[] => {
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

    const applyExpressions = (params: ApplyExpressionsParams): void => {
        const { where, expressions } = params;

        for (const key in where) {
            if (where.hasOwnProperty(key) === false) {
                continue;
            }

            const value = (where as any)[key];
            if (value === undefined) {
                continue;
            }

            /**
             * First we check conditional filtering.
             *
             * Same logic is applied for both "AND" and "OR" filtering, with a difference of expression is set to either AND or OR.
             */
            if (key === "AND" || key === "OR") {
                const childWhereList = getWhereValues(value, key);

                const childExpressions: Expression[] = [];
                for (const childWhere of childWhereList) {
                    applyExpressions({
                        where: childWhere,
                        expressions: childExpressions
                    });
                }
                if (childExpressions.length === 0) {
                    continue;
                }

                expressions.push({
                    children: childExpressions,
                    condition: key
                });
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
            expressions.push({
                filters: Array.isArray(result) ? result : [result],
                condition: "AND"
            });
        }
    };

    const expressions: Expression[] = [];

    applyExpressions({
        where,
        expressions
    });

    return expressions;
};
