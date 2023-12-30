import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellModified = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <TimeAgo datetime={row.savedOn} />;
    }

    return <TimeAgo datetime={row.entrySavedOn} />;
};
