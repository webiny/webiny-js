import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

export const CellAuthor = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.data.createdBy.displayName}</>;
};
