import React from "react";
import { SchedulerListConfig } from "~/Presentation/configs/index.js";

export const CellScheduledBy = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.data.scheduledBy?.displayName || "unknown"}</>;
};
