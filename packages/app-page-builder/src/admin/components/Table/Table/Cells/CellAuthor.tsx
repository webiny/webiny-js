import React from "react";
import { PageListConfig } from "~/admin/config/pages";

export const CellAuthor = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{row.createdBy.displayName}</>;
    }

    return <>{row.data.createdBy.displayName}</>;
};
