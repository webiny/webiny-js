import React from "react";
import { PageListConfig } from "~/admin/config/pages";

export const CellAuthor = () => {
    const { useTableRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.createdBy.displayName}</>;
};
