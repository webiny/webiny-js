import React from "react";
import { statuses } from "~/admin/constants";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";

export const CellStatus = () => {
    const { useTableCell, isEntryItem } = ContentEntryListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isEntryItem(item)) {
        return (
            <>{`${statuses[item.meta.status]}${
                item.meta.version ? ` (v${item.meta.version})` : ""
            }`}</>
        );
    }

    return <>{"-"}</>;
};
