import React from "react";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

export const CellAuthor = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.data.createdBy.displayName}</>;
};
