import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import lodashSortBy from "lodash.sortby";
import { FilterExpressions } from "dynamodb-toolbox/dist/lib/expressionBuilder";
import dotProp from "dot-prop";

const defaultSystemFieldIds = ["id", "createdOn", "savedOn", "createdBy", "ownedBy"];
const VALUES_ATTRIBUTE = "values";

const createOperation = (operation: string): { operation: string; negate?: boolean } => {
    switch (operation) {
        case "eq":
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "in":
        case "between":
        case "contains":
            return {
                operation
            };
        case "not_eq":
        case "not_in":
        case "not_between":
        case "not_contains":
            const op = operation.replace("not_", "");
            return {
                operation: op,
                negate: true
            };
    }
    throw new WebinyError("Operation not supported.", "OP_NOT_SUPPORTED", {
        operation
    });
};

interface ExtractArgs {
    key: string;
    fields: string[];
    model: CmsContentModel;
    systemFields: string[];
    value: any;
}

interface ExtractResult {
    attr: string;
    operation: string;
    negate: boolean;
    value: any;
}

const extractFilter = (args: ExtractArgs): ExtractResult => {
    const { key, fields, systemFields, value } = args;
    const result = key.split("_");
    const attr = result.shift();
    const rawOp = result.length === 0 ? "eq" : result.join("_");
    const isSystemField = systemFields.includes(attr);
    if (fields.includes(attr) === false && !isSystemField) {
        throw new WebinyError(
            "Filtering field does not exist in the content model.",
            "FILTERING_FIELD_ERROR",
            {
                key,
                attr,
                fields
            }
        );
    }
    const { operation, negate } = createOperation(rawOp);
    return {
        attr: isSystemField ? attr : `${VALUES_ATTRIBUTE}.${attr}`,
        operation,
        negate,
        value
    };
};

interface CreateFiltersArgs {
    base: FilterExpressions;
    context: CmsContext;
    model: CmsContentModel;
    where?: Record<string, any>;
}

interface CodeFilter {
    attr: string;
    operation: string;
    value: any;
    negate?: boolean;
}

export const createFilters = (args: CreateFiltersArgs): FilterExpressions => {
    const { base: baseFilters, model, where } = args;
    const keys = Object.keys(where);
    const filters = [].concat(baseFilters);
    if (!where || keys.length === 0) {
        return filters;
    }

    const fields = defaultSystemFieldIds.concat(model.fields.map(field => field.fieldId));

    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const value = where[key];
        if (value === undefined) {
            continue;
        }
        const filter = extractFilter({
            key,
            systemFields: defaultSystemFieldIds,
            model,
            fields,
            value
        });
        filters.push({
            attr: filter.attr,
            negate: filter.negate,
            [filter.operation]: filter.value
        });
    }
    return filters;
};
const filterMatch = (item: CmsContentEntry, filter: CodeFilter): boolean => {
    const value: string | undefined = dotProp.get(item, filter.attr, "");
    if (filter.operation === "contains") {
        if (!value) {
            return false;
        }
        const result = value.match(new RegExp(filter.value, "i")) !== null;
        return filter.negate ? result === false : result;
    } else if (filter.operation === "in") {
        if (Array.isArray(filter.value) === false) {
            throw new WebinyError("Filter value must be an array.", "FILTER_VALUE_ERROR", {
                filter
            });
        }
        let isIn = false;
        for (const search of filter.value) {
            if (value === search) {
                isIn = true;
            }
        }
        return filter.negate ? !isIn : isIn;
    }
    throw new WebinyError("Unsupported code filter.", "UNSUPPORTED_CODE_FILTER", {
        item,
        filter
    });
};
export const filterItems = (items: CmsContentEntry[], filters: CodeFilter[]): CmsContentEntry[] => {
    return items.filter(item => {
        for (const filter of filters) {
            const result = filterMatch(item, filter);
            if (!result) {
                return false;
            }
        }
        return true;
    });
};

const extractSort = (sortBy: string, fields: string[]): { field: string; reverse: boolean } => {
    const result = sortBy.split("_");
    if (result.length !== 2) {
        throw new WebinyError(
            "Problem in determining the sorting for the entry items.",
            "SORT_ERROR",
            {
                sortBy
            }
        );
    }
    const [field, order] = result;

    const isSystemField = defaultSystemFieldIds.includes(field);
    if (fields.includes(field) === false && !isSystemField) {
        throw new WebinyError(
            "Sorting field does not exist in the content model.",
            "SORTING_FIELD_ERROR",
            {
                field,
                fields
            }
        );
    }
    return {
        field: isSystemField ? field : `${VALUES_ATTRIBUTE}.${field}`,
        reverse: order === "DESC"
    };
};

interface SortEntryItemsArgs {
    model: CmsContentModel;
    items: CmsContentEntry[];
    sort: string[];
}

export const sortEntryItems = (args: SortEntryItemsArgs): CmsContentEntry[] => {
    const { model, items, sort } = args;
    if (!sort || sort.length === 0) {
        return items;
    }
    if (sort.length > 1) {
        throw new WebinyError("Sorting is limited to a single field", "SORT_ERROR", {
            sort: sort
        });
    }
    const [firstSort] = sort;
    if (!firstSort) {
        throw new WebinyError("Empty sort array item.", "SORT_ERROR", {
            sort
        });
    }
    const fields = defaultSystemFieldIds.concat(model.fields.map(field => field.fieldId));

    const { field, reverse } = extractSort(firstSort, fields);
    const newItems = lodashSortBy(items, field);
    if (reverse) {
        newItems.reverse();
    }
    return newItems;
};
