import React from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { Sorting } from "@webiny/app-utils";
import { SchedulerProps } from "~/Presentation";
import { Scheduler } from "../Scheduler";

export type SchedulerRendererProps = Omit<SchedulerProps, "render"> & {
    onClose: () => void;
};

export const SchedulerRenderer = ({ title = "Scheduler", ...props }: SchedulerRendererProps) => {
    const { table } = useAcoConfig();

    if (!table.sorting?.length) {
        return null;
    }

    return (
        <Scheduler
            {...props}
            title={title}
            sorting={table.sorting.map(sort => Sorting.create(sort))}
        />
    );
};
