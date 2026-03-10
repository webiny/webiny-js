import React from "react";
import { Sorting } from "@webiny/app-utils";
import type { WbSchedulerInternalProps } from "~/Presentation/WbScheduler/index.js";
import { WbScheduler } from "../WbScheduler/WbScheduler.js";
import { useWbSchedulerListConfig } from "~/Presentation/configs/index.js";

export type WbSchedulerRendererProps = Omit<WbSchedulerInternalProps, "sorting" | "title"> & {
    title?: string;
};

export const WbSchedulerRenderer = ({
    title = "Scheduler",
    ...props
}: WbSchedulerRendererProps) => {
    const { browser } = useWbSchedulerListConfig();

    if (!browser.table.sorting?.length) {
        return null;
    }

    return (
        <WbScheduler
            {...props}
            title={title}
            sorting={browser.table.sorting.map(sort => Sorting.create(sort))}
        />
    );
};
