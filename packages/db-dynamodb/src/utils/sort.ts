import lodashOrderBy from "lodash/orderBy";
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
    if (fieldPlugin && fieldPlugin.isSortable() === false) {
        throw new WebinyError(`Cannot sort by given field: "${field}".`, "UNSUPPORTED_SORT_ERROR", {
            fields,
            field
        });
    }

    return {
        field,
        reverse: order.toUpperCase() === "DESC"
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
    const { items, sort: initialSort = [], fields } = params;
    if (items.length <= 1) {
        return items;
    } else if (initialSort.length === 0) {
        initialSort.push("createdOn_DESC");
    }

    const info: Sorters = {
        sorters: [],
        orders: []
    };

    for (const sort of initialSort) {
        if (!sort) {
            continue;
        }
        const { field, reverse } = extractSort(sort, fields);
        const fieldPlugin = fields.find(f => f.getField() === field);
        const path = fieldPlugin ? fieldPlugin.getPath() : field;

        info.sorters.push(path);
        info.orders.push(reverse === true ? "desc" : "asc");
    }

    return lodashOrderBy(items, info.sorters, info.orders);
};
