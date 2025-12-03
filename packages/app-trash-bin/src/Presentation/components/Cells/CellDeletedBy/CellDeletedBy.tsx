import React from "react";
import { TrashBinListConfig } from "~/Presentation/configs/index.js";

export const CellDeletedBy = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.deletedBy) {
        return <>{"-"}</>;
    }

    return <>{row.data.deletedBy.displayName}</>;
};
