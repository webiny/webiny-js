import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { PageListConfig } from "~/admin/config/pages";

export const CellModified = () => {
    const { useTableCell, isFolderItem } = PageListConfig.Browser.Table.Column;
    const { item } = useTableCell();

    if (isFolderItem(item)) {
        return <TimeAgo datetime={item.createdOn} />;
    }

    return <TimeAgo datetime={item.data.createdOn} />;
};
