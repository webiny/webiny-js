import React from "react";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellType = () => {
    const { useTableCell, isFileItem } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFileItem(item)) {
        return <>{item.type}</>;
    }

    return <>{"-"}</>;
};
