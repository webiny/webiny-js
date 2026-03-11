import React from "react";
import { Sorting } from "@webiny/app-utils";
import type { SchedulerProps } from "~/Presentation/index.js";
import { Scheduler } from "../Scheduler/index.js";
import { useSchedulerListConfig } from "~/Presentation/configs/index.js";

export type SchedulerRendererProps = Omit<SchedulerProps, "render"> & {
    onClose: () => void;
};

export const SchedulerRenderer = ({ title = "Scheduler", ...props }: SchedulerRendererProps) => {
    const { browser } = useSchedulerListConfig();

    if (!browser.table.sorting?.length) {
        return null;
    }

    return (
        <Scheduler
            {...props}
            title={title}
            sorting={browser.table.sorting.map(sort => Sorting.create(sort))}
        />
    );
};
