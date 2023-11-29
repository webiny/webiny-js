import React from "react";
import bytes from "bytes";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellSize = () => {
    const { useTableCell, isFileItem } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFileItem(item)) {
        return <>{bytes.format(item.size, { unitSeparator: " " })}</>;
    }

    return <>{"-"}</>;
};
