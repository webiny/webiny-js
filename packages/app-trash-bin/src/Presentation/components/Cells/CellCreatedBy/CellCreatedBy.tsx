import React from "react";
import { TrashBinListConfig } from "~/Presentation/configs/index.js";

export const CellCreatedBy = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.data.createdBy.displayName}</>;
};
