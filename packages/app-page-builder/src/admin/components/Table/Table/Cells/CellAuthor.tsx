import React from "react";
import { PageListConfig } from "~/admin/config/pages";

export const CellAuthor = () => {
    const { useTableCell } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    return <>{item.createdBy.displayName}</>;
};
