import React from "react";
import { PageListConfig } from "~/admin/config/pages";

export const CellAuthor = () => {
    const { useTableCell, isPbPageItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isPbPageItem(item)) {
        return <>{item.data.createdBy.displayName}</>;
    }

    return <>{item.createdBy.displayName}</>;
};
