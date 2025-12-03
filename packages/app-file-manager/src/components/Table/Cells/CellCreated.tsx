import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";

export const CellCreated = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.createdOn) {
        return <>{"-"}</>;
    }

    return <TimeAgo datetime={row.data.createdOn} />;
};
