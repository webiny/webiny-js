import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { useTableCell } from "~/hooks/useTableCell";

export const CellModified = () => {
    const { item } = useTableCell();

    return <TimeAgo datetime={item.createdOn} />;
};
