import orderBy from "lodash/orderBy";

import { ListDbSort, ListTableSort, ListTableSortDirection } from "~/types";

export const validateOrGetDefaultDbSort = (initial?: ListDbSort): ListDbSort => {
    if (!initial || Object.keys(initial).length === 0) {
        return { savedOn: "DESC" } as unknown as ListDbSort;
    }

    return initial;
};

export const sortTableItems = (records: any[], sort?: ListDbSort): any[] => {
    const dbSorting = validateOrGetDefaultDbSort(sort);
    const fields = [] as ListTableSort["fields"];
    const orders = [] as ListTableSort["orders"];

    for (const [field, order] of Object.entries(dbSorting)) {
        fields.push(field);
        orders.push(order.toLowerCase() as ListTableSortDirection);
    }

    return orderBy(records, fields, orders);
};
