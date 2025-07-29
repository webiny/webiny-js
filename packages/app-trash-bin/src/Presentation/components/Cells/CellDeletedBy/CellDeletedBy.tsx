import React from "react";
import { TrashBinListConfig } from "~/Presentation/configs";

export const CellDeletedBy = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.deletedBy) {
        return <>{"-"}</>;
    }

    return <>{row.deletedBy.displayName}</>;
};
