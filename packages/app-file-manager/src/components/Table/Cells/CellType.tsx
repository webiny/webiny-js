import React from "react";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellType = () => {
    const { useTableCell, isFolderItem } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFolderItem(item)) {
        return <>{"-"}</>;
    }

    return <>{item.type}</>;
};
