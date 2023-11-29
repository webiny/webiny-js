import React from "react";
import { statuses } from "~/admin/constants";
import { useTableCell } from "~/admin/views/contentEntries/hooks";

export const CellStatus = () => {
    const { item, isEntryItem } = useTableCell();

    if (isEntryItem(item)) {
        return (
            <>{`${statuses[item.meta.status]}${
                item.meta.version ? ` (v${item.meta.version})` : ""
            }`}</>
        );
    }

    return <>{"-"}</>;
};
