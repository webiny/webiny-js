import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

export const CellModified = () => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.savedOn) {
        return <>{"-"}</>;
    }

    return <TimeAgo datetime={row.data.savedOn} />;
};
