import React from "react";
import { SchedulerListConfig } from "~/Presentation/configs";

export const CellScheduledBy = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.scheduledBy?.displayName || "unknown"}</>;
};
