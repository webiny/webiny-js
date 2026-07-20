import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryValues
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import type { Field } from "./fields/types.js";
import { createFullTextSearch } from "./fullTextSearch.js";
import type { Expression, ExpressionCondition, Filter } from "./expressions/createExpressions.js";
import { createExpressions } from "./expressions/createExpressions.js";
import { transformValue } from "./transform.js";
import { getValue } from "./getValue.js";
import { ValueFilterRegistry } from "@webiny/db-utils";
import type { FieldFilterCreateRegistry } from "../abstractions/FieldFilterCreateRegistry.js";
import type { FieldFilterValueTransformRegistry } from "../abstractions/FieldFilterValueTransformRegistry.js";

interface ExecuteFilterParams {
    value: any;
    filter: Filter;
}

const executeFilter = (params: ExecuteFilterParams) => {
    const { value, filter } = params;

    const canUse = filter.filter.canUse({
        value,
        compareValue: filter.compareValue
    });
    if (!canUse) {
        return true;
    }

    const matched = filter.filter.matches({
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
    for (const filter of filters) {
        const value = getCachedValue(filter);

        const result = executeFilter({
            value,
            filter
        });
        if (!result) {
            return false;
        }
    }
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
    return condition === "OR" ? false : true;
};

interface IFilterParams<T extends CmsEntryValues = CmsEntryValues> {
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
    items: CmsEntry<T>[];
    where: Partial<CmsEntryListWhere>;
    fields: Record<string, Field>;
    fullTextSearch?: {
        term?: string;
        fields?: string[];
    };
}

export const filter = <T extends CmsEntryValues = CmsEntryValues>(
    params: IFilterParams<T>
): CmsEntry<T>[] => {
    const {
        items: records,
        where,
        filterCreateRegistry,
        transformRegistry,
        fields,
        fullTextSearch,
        valueFilterRegistry
    } = params;

    const keys = Object.keys(where);
    if (keys.length === 0 && !fullTextSearch) {
        return records;
    }
    const expression = createExpressions({
        filterCreateRegistry,
        transformRegistry,
        where,
        fields,
        valueFilterRegistry
    });

    if (
        expression.filters.length === 0 &&
        expression.expressions.length === 0 &&
        !fullTextSearch?.term
    ) {
        return records;
    }
    const fullTextSearchFilter = valueFilterRegistry.get("contains");
    if (!fullTextSearchFilter) {
        throw new WebinyError(
            `Missing "contains" plugin to run the full-text search.`,
            "MISSING_PLUGIN"
        );
    }

    const search = createFullTextSearch({
        term: fullTextSearch?.term,
        targetFields: fullTextSearch?.fields,
        fields,
        filter: fullTextSearchFilter
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
        if (!exprResult || !search) {
            return exprResult;
        }

        return search(record);
    });
};
