import orderBy from "lodash/orderBy";

import { ListSearchRecordsSort } from "~/types";

export const validateOrGetDefaultDbSort = (
    initial?: ListSearchRecordsSort
): ListSearchRecordsSort => {
    if (!Array.isArray(initial) || initial.length === 0) {
        return ["savedOn_DESC"];
    }

    return initial;
};

interface IRecord {
    id: string;
}

export const sortTableItems = (
    records: IRecord[],
    sort?: ListSearchRecordsSort,
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
