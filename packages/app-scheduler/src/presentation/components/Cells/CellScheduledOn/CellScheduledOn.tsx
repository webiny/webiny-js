import React from "react";
import { SchedulerListConfig } from "~/presentation/configs/index.js";
import { makeDecoratable } from "@webiny/react-composition";
import { useDateFormatter } from "@webiny/app-admin";

export interface ICellScheduledOnLabelProps {
    dateTime: Date | undefined;
}

export const CellScheduledOnLabel = makeDecoratable(
    "Scheduler.CellScheduledOnLabel",
    ({ dateTime }: ICellScheduledOnLabelProps) => {
        const dateFormatter = useDateFormatter();
        if (!dateTime) {
            return <>Missing publish or unpublish date.</>;
        }

        return <>{dateFormatter.format(dateTime)}</>;
    }
);

export const CellScheduledOn = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <CellScheduledOnLabel dateTime={row.data.publishOn || row.data.unpublishOn} />;
};
