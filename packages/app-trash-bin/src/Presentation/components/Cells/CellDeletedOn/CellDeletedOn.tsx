import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { TrashBinListConfig } from "~/Presentation/configs";

export const CellDeletedOn = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <TimeAgo datetime={row.deletedOn} />;
};
