import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellCreated = () => {
    const { useTableRow } = FileManagerViewConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.createdOn} />;
};
