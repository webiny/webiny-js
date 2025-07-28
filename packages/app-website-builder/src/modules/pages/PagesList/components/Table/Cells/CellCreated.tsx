import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { PageListConfig } from "~/configs/index.js";

export const CellCreated = () => {
    const { useTableRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.createdOn} />;
};
