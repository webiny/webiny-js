import React from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { TrashBinListConfig } from "../../configs/index.js";

export const CellDeletedOn = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (!row.data.deletedOn) {
        return <>{"-"}</>;
    }

    return <TimeAgo datetime={row.data.deletedOn} />;
};
