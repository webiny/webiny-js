import React from "react";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellAuthor = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.createdBy) {
        return <>{"-"}</>;
    }

    return <>{row.createdBy.displayName}</>;
};
