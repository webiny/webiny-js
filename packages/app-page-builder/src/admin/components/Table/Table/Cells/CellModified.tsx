import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { PageListConfig } from "~/admin/config/pages";

export const CellModified = () => {
    const { useTableCell, isPbPageItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isPbPageItem(item)) {
        return <>{item.data.createdOn}</>;
    }

    return <TimeAgo datetime={item.createdOn} />;
};
