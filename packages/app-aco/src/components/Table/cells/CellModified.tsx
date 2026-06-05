import React, { useContext } from "react";
import { TimeAgo } from "@webiny/admin-ui";
import { TableRowContext } from "../useTableRow.js";

export const CellModified = () => {
    const context = useContext(TableRowContext);
    if (!context) {
        return null;
    }
    return <TimeAgo datetime={context.row.data.savedOn} />;
};
