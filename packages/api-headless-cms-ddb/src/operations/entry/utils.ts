import { CmsContentEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import lodashSortBy from "lodash.sortby";

const defaultSystemFields = ["id", "createdOn", "savedOn", "createdBy", "ownedBy"];
const VALUES_ATTRIBUTE = "values";

const createOperation = (operation: string | null | undefined, value: any): Record<string, any> => {
    if (!operation) {
        throw new WebinyError(`Missing operation for value "${value}".`, "OP_MISSING", {
            operation,
            value
        });
    }
    switch (operation) {
        case "eq":
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "in":
        case "between":
            return {
                [operation]: value
            };
        case "not_eq":
        case "not_in":
        case "not_between":
            const op = operation.replace("not_", "");
            return {
                [op]: value,
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
    systemFields: string[];
    value: any;
}
const extractFilter = (args: ExtractArgs): Record<string, any> => {
    const { key, fields, systemFields, value } = args;
    const [attr, rawOp = "eq"] = key.split("_", 1);
    const isSystemField = systemFields.includes(attr);
    if (fields.includes(attr) === false && !isSystemField) {
        throw new WebinyError(
            "Filtering field does not exist in the content model.",
            "FILTERING_FIELD_ERROR",
            {
                key,
                value,
                attr,
                fields
            }
        );
    }
    const operation = createOperation(rawOp, value);
    return {
        attr: isSystemField ? attr : `${VALUES_ATTRIBUTE}.${attr}`,
        ...operation
    };
};

interface CreateFiltersArgs {
    context: CmsContext;
    model: CmsContentModel;
    where?: Record<string, any>;
}
export const createFilters = (args: CreateFiltersArgs): any[] | undefined => {
    const { model, where } = args;
    const keys = Object.keys(where);
    if (!where || keys.length === 0) {
        return [];
    }

    const fields = defaultSystemFields.concat(model.fields.map(field => field.fieldId));

    return keys.reduce((filters, key) => {
        const value = where[key];
        if (value === undefined) {
            return filters;
        }

        const filter = extractFilter({
            key,
            systemFields: defaultSystemFields,
            fields,
            value
        });

        filters.push(filter);
        return filters;
    }, []);
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

    const isSystemField = defaultSystemFields.includes(field);
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
export const sortEntryItems = (args: SortEntryItemsArgs): void => {
    const { model, items, sort } = args;
    if (!sort || sort.length === 0) {
        return;
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
    const fields = defaultSystemFields.concat(model.fields.map(field => field.fieldId));

    const { field, reverse } = extractSort(firstSort, fields);
    lodashSortBy(items, field);
    if (!reverse) {
        return;
    }
    items.reverse();
};
