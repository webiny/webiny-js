import orderBy from "lodash/orderBy";

import { ListDbSort, ListTableSort, ListTableSortDirection } from "~/types";

export const validateOrGetDefaultDbSort = (initial?: ListDbSort): ListDbSort => {
    if (!Array.isArray(initial) || initial.length === 0) {
        return ["savedOn_DESC"];
    }

    return initial;
};

export const sortTableItems = (records: any[], sort?: ListDbSort): any[] => {
    const dbSorting = validateOrGetDefaultDbSort(sort);
    const fields = [] as ListTableSort["fields"];
    const orders = [] as ListTableSort["orders"];

    for (const sort of dbSorting) {
        const [field, order] = sort.split("_");
        fields.push(field);
        orders.push(order.toLowerCase() as ListTableSortDirection);
    }

    return orderBy(records, fields, orders);
};
