import React from "react";
import { WbSchedulerListConfig } from "~/Presentation/configs/index.js";
import { makeDecoratable } from "@webiny/react-composition";

export interface ICellScheduledOnLabelProps {
    dateTime: Date | undefined;
}

export const CellScheduledOnLabel = makeDecoratable(
    "WbScheduler.CellScheduledOnLabel",
    ({ dateTime }: ICellScheduledOnLabelProps) => {
        if (!dateTime) {
            return <>Missing publish or unpublish date.</>;
        }

        return <>{dateTime.toLocaleString()}</>;
    }
);

export const CellScheduledOn = () => {
    const { useTableRow } = WbSchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    return <CellScheduledOnLabel dateTime={row.data.publishOn || row.data.unpublishOn} />;
};
