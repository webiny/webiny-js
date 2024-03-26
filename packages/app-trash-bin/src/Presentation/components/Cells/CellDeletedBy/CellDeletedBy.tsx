import React from "react";
import { TrashBinListConfig } from "~/Configs";

export const CellDeletedBy = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.deletedBy.displayName}</>;
};
