import lodashSortBy from "lodash.sortby";
import WebinyError from "@webiny/error";
import { FieldPathPlugin } from "~/plugins/definitions/FieldPathPlugin";
import { ContextInterface } from "@webiny/handler/types";

interface ExtractSortResult {
    reverse: boolean;
    field: string;
}
const extractSort = (sortBy: string, fields: string[]): ExtractSortResult => {
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

    if (!field) {
        throw new WebinyError("Sorting field does not exist.", "SORTING_FIELD_ERROR", {
            field,
            order,
            fields
        });
    } else if (fields.includes(field) === false) {
        throw new WebinyError(`Cannot sort by given field: "${field}".`, "UNSUPPORTED_SORT_ERROR", {
            fields,
            field
        });
    }

    return {
        field,
        reverse: order === "DESC"
    };
};

interface Params<T> {
    context: ContextInterface;
    items: T[];
    sort: string[];
    fields: string[];
}
export const sortItems = <T extends any = any>(params: Params<T>): T[] => {
    const { context, items, sort = [], fields } = params;
    if (items.length <= 1) {
        return items;
    } else if (sort.length === 0) {
        sort.push("createdOn_DESC");
    } else if (sort.length > 1) {
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

    const { field, reverse } = extractSort(firstSort, fields);

    const fieldPathPlugin = context.plugins
        .byType<FieldPathPlugin>(FieldPathPlugin.type)
        .find(plugin => plugin.canCreate(field));
    const path = fieldPathPlugin ? fieldPathPlugin.createPath(field) : field;

    const sortedItems = lodashSortBy(items, path);
    if (!reverse) {
        return sortedItems;
    }
    return sortedItems.reverse();
};
