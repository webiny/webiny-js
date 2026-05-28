import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const CellCreated = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.data.createdOn} />;
};
