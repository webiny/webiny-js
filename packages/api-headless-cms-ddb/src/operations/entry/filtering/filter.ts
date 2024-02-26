import { CmsEntry, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import { Field } from "./types";
import { createFullTextSearch } from "./fullTextSearch";
import { createExpressions, Expression, ExpressionCondition, Filter } from "./createExpressions";
import { transformValue } from "./transform";
import { getValue } from "~/operations/entry/filtering/getValue";

interface ExecuteFilterParams {
    value: any;
    filter: Filter;
}

const executeFilter = (params: ExecuteFilterParams) => {
    const { value, filter } = params;

    /**
     * We need to check if the filter can be used.
     * If it cannot, we will just return true.
     */
    const canUse = filter.plugin.canUse({
        value,
        compareValue: filter.compareValue
    });
    if (!canUse) {
        return true;
    }

    const matched = filter.plugin.matches({
        value,
        compareValue: filter.compareValue
    });
    if (filter.negate) {
        return matched === false;
    }
    return matched;
};

interface ExecuteExpressionsParams {
    getCachedValue: (filter: Filter) => Promise<any>;
    expressions: Expression[];
    filters: Filter[];
    condition: ExpressionCondition;
}

const executeExpressions = (params: ExecuteExpressionsParams): boolean => {
    const { expressions, getCachedValue, filters, condition } = params;
    if (expressions.length === 0 && filters.length === 0) {
        return true;
    }
    /**
     * Always run filters first as they might trigger an early return.
     */
    for (const filter of filters) {
        const value = getCachedValue(filter);

        const result = executeFilter({
            value,
            filter
        });
        /**
         * Filters are ALWAYS executed as an AND.
         * So if even one is false, everything false.
         */
        if (!result) {
            return false;
        }
    }
    /**
     * Then we move onto expressions, which are basically nested upon nested filters with different conditions.
     */
    for (const expression of expressions) {
        const result = executeExpressions({
            ...expression,
            getCachedValue
        });
        if (result && condition === "OR") {
            return true;
        } else if (!result && condition == "AND") {
            return false;
        }
    }
    /**
     * If condition is an OR, we can fail the expressions check because the code would return a lot earlier than this line.
     *
     * Also, if condition is not an OR, we can say that the expressions check is ok, because it would fail a lot earlier than this line.
     */
    return condition === "OR" ? false : true;
};

interface Params {
    items: CmsEntry[];
    where: Partial<CmsEntryListWhere>;
    plugins: PluginsContainer;
    fields: Record<string, Field>;
    fullTextSearch?: {
        term?: string;
        fields?: string[];
    };
}

export const filter = (params: Params): CmsEntry[] => {
    const { items: records, where, plugins, fields, fullTextSearch } = params;

    const keys = Object.keys(where);
    if (keys.length === 0 && !fullTextSearch) {
        return records;
    }
    const expression = createExpressions({
        plugins,
        where,
        fields
    });

    /**
     * No point in going further if there are no expressions to be applied and no full text search to be executed.
     */
    if (
        expression.filters.length === 0 &&
        expression.expressions.length === 0 &&
        !fullTextSearch?.term
    ) {
        return records;
    }
    /**
     * We need the contains plugin to run the full text search.
     */
    const fullTextSearchPlugin = plugins
        .byType<ValueFilterPlugin>(ValueFilterPlugin.type)
        .find(plugin => plugin.getOperation() === "contains");
    if (!fullTextSearchPlugin) {
        throw new WebinyError(
            `Missing "contains" plugin to run the full-text search.`,
            "MISSING_PLUGIN"
        );
    }

    const search = createFullTextSearch({
        term: fullTextSearch?.term,
        targetFields: fullTextSearch?.fields,
        fields,
        plugin: fullTextSearchPlugin
    });

    return records.filter(record => {
        const cachedValues: Record<string, any> = {};

        const getCachedValue = (filter: Filter) => {
            const { path } = filter;
            if (cachedValues[path] !== undefined) {
                return cachedValues[path];
            }
            const plainValue = getValue(record, path);

            const rawValue = transformValue({
                value: plainValue,
                transform: filter.transformValue
            });

            cachedValues[path] = rawValue;
            return rawValue;
        };

        const exprResult = executeExpressions({ ...expression, getCachedValue });
        /**
         * If expression result is false we do not need to continue further.
         * Also, if there is no full text search defined, just return the expression result.
         */
        if (!exprResult || !search) {
            return exprResult;
        }

        return search(record);
    });
};
