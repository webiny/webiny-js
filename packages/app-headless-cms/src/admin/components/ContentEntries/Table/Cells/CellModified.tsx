import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellModified = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.savedOn} />;
};
