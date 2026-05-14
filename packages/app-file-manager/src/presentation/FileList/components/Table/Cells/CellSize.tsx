import React from "react";
import bytes from "bytes";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const CellSize = () => {
    const { useTableRow, isFolderRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    return <>{bytes.format(row.data.size, { unitSeparator: " " })}</>;
};
