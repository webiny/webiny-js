import React from "react";
import { statuses } from "~/admin/constants";
import { useTableCell } from "~/admin/hooks/useTableCell";

export const CellStatus = () => {
    const { item, isPbPageItem } = useTableCell();

    if (isPbPageItem(item)) {
        return <>{`${statuses[item.status]}${item.version ? ` (v${item.version})` : ""}`}</>;
    }

    return <>{"-"}</>;
};
