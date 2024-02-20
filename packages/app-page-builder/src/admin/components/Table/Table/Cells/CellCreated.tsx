import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { PageListConfig } from "~/admin/config/pages";

export const CellCreated = () => {
    const { useTableRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.createdOn} />;
};
