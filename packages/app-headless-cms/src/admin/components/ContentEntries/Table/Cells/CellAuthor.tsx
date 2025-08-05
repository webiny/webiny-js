import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellAuthor = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.createdBy.displayName}</>;
};
