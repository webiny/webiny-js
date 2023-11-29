import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

export const CellModified = () => {
    const { useTableCell } = FileManagerViewConfig.Browser.Table.Column;
    const { item } = useTableCell();

    return <TimeAgo datetime={item.createdOn} />;
};
