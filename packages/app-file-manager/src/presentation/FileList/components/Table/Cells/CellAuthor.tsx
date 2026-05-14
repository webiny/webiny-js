import React from "react";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const CellAuthor = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.data.createdBy.displayName}</>;
};
