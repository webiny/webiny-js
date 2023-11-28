import React from "react";
import { useTableCell } from "~/admin/hooks/useTableCell";

export const CellAuthor = () => {
    const { item } = useTableCell();

    return <>{item.createdBy.displayName}</>;
};
