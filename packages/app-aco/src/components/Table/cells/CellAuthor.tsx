import React, { useContext } from "react";
import { TableRowContext } from "../useTableRow.js";

export const CellAuthor = () => {
    const context = useContext(TableRowContext);
    if (!context) {
        return null;
    }
    return <>{context.row.data.createdBy.displayName}</>;
};
