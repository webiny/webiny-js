import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellAuthor = () => {
    const { useTableCell } = ContentEntryListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    return <>{item.createdBy.displayName}</>;
};
