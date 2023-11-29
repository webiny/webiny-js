import React from "react";
import { useTableCell } from "~/admin/views/contentEntries/hooks";

export const CellAuthor = () => {
    const { item } = useTableCell();

    return <>{item.createdBy.displayName}</>;
};
