import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { TrashBinListConfig } from "~/configs";

export const CellDeletedOn = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.deletedOn} />;
};
