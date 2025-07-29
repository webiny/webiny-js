import React from "react";
import { TrashBinListConfig } from "~/Presentation/configs";

export const CellCreatedBy = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.createdBy.displayName}</>;
};
