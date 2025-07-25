import React from "react";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import { SchedulerListConfig } from "~/Presentation/configs";

export const CellScheduledOn = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    const dateTime = row.publishOn || row.unpublishOn;
    if (!dateTime) {
        return <>Missing publish or unpublish date.</>;
    }

    return <TimeAgo datetime={dateTime} />;
};
