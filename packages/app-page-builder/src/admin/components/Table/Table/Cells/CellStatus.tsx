import React from "react";
import { statuses } from "~/admin/constants";
import { PageListConfig } from "~/admin/config/pages";

export const CellStatus = () => {
    const { useTableCell, isPbPageItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isPbPageItem(item)) {
        return <>{`${statuses[item.status]}${item.version ? ` (v${item.version})` : ""}`}</>;
    }

    return <>{"-"}</>;
};
