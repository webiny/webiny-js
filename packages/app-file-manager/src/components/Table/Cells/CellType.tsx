import React from "react";
import { useTableCell } from "~/hooks/useTableCell";

export const CellType = () => {
    const { item, isFileItem } = useTableCell();

    if (isFileItem(item)) {
        return <>{item.type}</>;
    }

    return <>{"-"}</>;
};
