import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { PageListConfig } from "~/admin/config/pages";

export const CellModified = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <TimeAgo datetime={row.savedOn} />;
    }

    return <TimeAgo datetime={row.data.savedOn} />;
};
