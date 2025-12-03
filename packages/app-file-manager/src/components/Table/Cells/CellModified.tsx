import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

export const CellModified = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.savedOn) {
        return <>{"-"}</>;
    }

    return <TimeAgo datetime={row.data.savedOn} />;
};
