import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellCreated = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.createdOn) {
        return <>{"-"}</>;
    }

    return <TimeAgo datetime={row.createdOn} />;
};
