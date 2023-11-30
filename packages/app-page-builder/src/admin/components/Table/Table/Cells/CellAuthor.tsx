import React from "react";
import { PageListConfig } from "~/admin/config/pages";

export const CellAuthor = () => {
    const { useTableCell, isFolderItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFolderItem(item)) {
        return <>{item.createdBy.displayName}</>;
    }

    return <>{item.data.createdBy.displayName}</>;
};
