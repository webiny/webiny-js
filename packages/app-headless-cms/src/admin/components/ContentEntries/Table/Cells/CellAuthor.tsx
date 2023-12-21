import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellAuthor = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.createdBy.displayName}</>;
};
