import React from "react";
import { PageListConfig } from "~/presentation/pages/PageList/configs/index.js";

export const CellAuthor = () => {
    const { useTableRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.data.createdBy.displayName}</>;
};
