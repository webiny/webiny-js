import React from "react";
import { PageListConfig } from "~/configs/index.js";

export const CellAuthor = () => {
    const { useTableRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.createdBy.displayName}</>;
};
