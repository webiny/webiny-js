import React from "react";
import { WbSchedulerListConfig } from "~/Presentation/configs/index.js";

export const CellScheduledBy = () => {
    const { useTableRow } = WbSchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <>{row.data.scheduledBy?.displayName || "unknown"}</>;
};
