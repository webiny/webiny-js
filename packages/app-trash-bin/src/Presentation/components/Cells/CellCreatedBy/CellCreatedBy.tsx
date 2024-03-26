import React from "react";
import { TrashBinListConfig } from "~/Configs";

export const CellCreatedBy = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.createdBy.displayName}</>;
};
