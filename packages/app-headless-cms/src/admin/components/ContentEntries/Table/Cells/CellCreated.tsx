import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo/index.js";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

export const CellCreated = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.createdOn) {
        return <>{"-"}</>;
    }

    return <TimeAgo datetime={row.data.createdOn} />;
};
