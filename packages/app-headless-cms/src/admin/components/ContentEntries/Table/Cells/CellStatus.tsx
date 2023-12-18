import React from "react";
import { statuses } from "~/admin/constants";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellStatus = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    return (
        <>{`${statuses[row.meta.status]}${row.meta.version ? ` (v${row.meta.version})` : ""}`}</>
    );
};
