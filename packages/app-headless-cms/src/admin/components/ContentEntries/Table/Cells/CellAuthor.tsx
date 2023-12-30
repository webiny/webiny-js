import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellAuthor = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{row.createdBy.displayName}</>;
    }

    return <>{row.entryCreatedBy.displayName}</>;
};
