import React from "react";
import bytes from "bytes";
import { useTableCell } from "~/hooks/useTableCell";

export const CellSize = () => {
    const { item, isFileItem } = useTableCell();

    if (isFileItem(item)) {
        return <>{bytes.format(item.size, { unitSeparator: " " })}</>;
    }

    return <>{"-"}</>;
};
