import orderBy from "lodash/orderBy";

import { ListSort, ListSortItem } from "~/types";
import { Sorting } from "@webiny/ui/DataTable";

export const validateOrGetDefaultDbSort = (initial?: ListSort): ListSort => {
    if (!Array.isArray(initial) || initial.length === 0) {
        return ["createdOn_DESC"];
    }

    return initial;
};

interface IRecord {
    id: string;
}

export const sortTableItems = (
    records: IRecord[],
    sort?: ListSort,
    mapKeys: Record<string, string> = {}
): any[] => {
    const dbSorting = validateOrGetDefaultDbSort(sort);
    const fields: string[] = [];
    const orders: (boolean | "asc" | "desc")[] = [];

    for (const sort of dbSorting) {
        const [field, order] = sort.split("_");
        const mappedKey = mapKeys[field] ?? field;
        fields.push(mappedKey);
        orders.push(order.toLowerCase() as "asc" | "desc");
    }

    return orderBy(records, fields, orders);
};

export const createSort = (sorting?: Sorting): ListSort | undefined => {
    if (!sorting?.length) {
        return undefined;
    }
    return sorting.reduce<ListSort>((items, item) => {
        const sort = `${item.id}_${item.desc ? "DESC" : "ASC"}` as ListSortItem;
        if (items.includes(sort)) {
            return items;
        }
        items.push(sort);
        return items;
    }, []);
};
