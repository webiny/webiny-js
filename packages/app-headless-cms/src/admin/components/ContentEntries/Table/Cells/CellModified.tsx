import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellModified = () => {
    const { useTableCell } = ContentEntryListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    return <TimeAgo datetime={item.createdOn} />;
};
