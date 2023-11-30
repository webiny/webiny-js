import React from "react";
import bytes from "bytes";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellSize = () => {
    const { useTableCell, isFolderItem } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFolderItem(item)) {
        return <>{"-"}</>;
    }

    return <>{bytes.format(item.size, { unitSeparator: " " })}</>;
};
