import lodashSortBy from "lodash.sortby";
import WebinyError from "@webiny/error";
import { FieldPlugin } from "~/plugins/definitions/FieldPlugin";

interface Sorters {
    sorters: string[];
    orders: string[];
}

interface ExtractSortResult {
    reverse: boolean;
    field: string;
}
const extractSort = (sortBy: string, fields: FieldPlugin[]): ExtractSortResult => {
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
    }
    const fieldPlugin = fields.find(f => f.getField() === field);
    if (!fieldPlugin || fieldPlugin.isSortable() === false) {
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
    /**
     * The items we are sorting.
     */
    items: T[];
    /**
     * Sort options. For example: ["id_ASC"]
     */
    sort: string[];
    /**
     * Fields we can sort by.
     */
    fields: FieldPlugin[];
}
export const sortItems = <T extends any = any>(params: Params<T>): T[] => {
    const { items, sort = [], fields } = params;
    if (items.length <= 1) {
        return items;
    } else if (sort.length === 0) {
        sort.push("createdOn_DESC");
    }
    const [firstSort] = sort;
    if (!firstSort) {
        throw new WebinyError("Empty sort array item.", "SORT_ERROR", {
            sort
        });
    }

    const initialSorters: Sorters = {
        sorters: [],
        orders: []
    };
    const info = sort.reduce((collection, s) => {
        const { field, reverse } = extractSort(s, fields);
        const fieldPlugin = fields.find(f => f.getField() === field);
        const path = fieldPlugin ? fieldPlugin.getPath() : field;

        collection.sorters.push(path);
        collection.orders.push(reverse === true ? "desc" : "asc");
        return collection;
    }, initialSorters as Sorters);

    return lodashSortBy(items, info.sorters, info.orders);
};
