import React from "react";
import { SchedulerListConfig } from "~/Presentation/configs";
import { makeDecoratable } from "@webiny/react-composition";

export interface ICellScheduledOnLabelProps {
    dateTime: Date | undefined;
}

export const CellScheduledOnLabel = makeDecoratable(
    "Scheduler.CellScheduledOnLabel",
    ({ dateTime }: ICellScheduledOnLabelProps) => {
        if (!dateTime) {
            return <>Missing publish or unpublish date.</>;
        }

        return <>{dateTime.toLocaleString()}</>;
    }
);

export const CellScheduledOn = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <CellScheduledOnLabel dateTime={row.data.publishOn || row.data.unpublishOn} />;
};
