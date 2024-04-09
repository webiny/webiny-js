import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { PageListConfig } from "~/admin/config/pages";

export const CellModified = () => {
    const { useTableRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.savedOn} />;
};
