import React from "react";
import { statuses } from "~/admin/constants";
import { PageListConfig } from "~/admin/config/pages";

export const CellStatus = () => {
    const { useTableCell, isFolderItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFolderItem(item)) {
        return <>{"-"}</>;
    }

    return (
        <>{`${statuses[item.data.status]}${item.data.version ? ` (v${item.data.version})` : ""}`}</>
    );
};
