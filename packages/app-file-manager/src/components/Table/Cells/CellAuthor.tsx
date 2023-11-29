import React from "react";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellAuthor = () => {
    const { useTableCell } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();

    return <>{item.createdBy.displayName}</>;
};
