import lodashOrderBy from "lodash/orderBy";
import WebinyError from "@webiny/error";
import { FieldPlugin } from "~/plugins/definitions/FieldPlugin";

interface Info {
    sorters: string[];
    orders: (boolean | "asc" | "desc")[];
}

interface Response {
    reverse: boolean;
    field: string;
}

const extractSort = (sortBy: string, fields: FieldPlugin[]): Response => {
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
    const isSortable = fieldPlugin ? fieldPlugin.isSortable() : true;
    if (isSortable === false) {
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
    sort?: string[];
    /**
     * Fields we can sort by.
     */
    fields?: FieldPlugin[];
}

export function sortItems<T = any>(params: Params<T>): T[] {
    const { items, sort: initialSort = [], fields = [] } = params;
    /**
     * Skip sorting if nothing was passed to sort by or nothing to sort.
     */
    if (items.length <= 1 || Array.isArray(initialSort) === false || initialSort.length === 0) {
        return items;
    }

    const info: Info = {
        sorters: [],
        orders: []
    };

    for (const sort of initialSort) {
        /**
         * Possibly empty array item was passed.
         */
        if (!sort) {
            continue;
        }
        const { field, reverse } = extractSort(sort, fields);
        const fieldPlugin = fields.find(f => f.getField() === field);
        const path = fieldPlugin ? fieldPlugin.getPath() : field;

        info.sorters.push(path);
        info.orders.push(reverse === true ? "desc" : "asc");
    }

    if (info.sorters.length === 0) {
        return items;
    }

    return lodashOrderBy(items, info.sorters, info.orders);
}
