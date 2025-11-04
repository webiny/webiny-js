import React from "react";
import { TrashBin } from "~/admin/components/ContentEntries/TrashBin/index.js";
import { Scheduler } from "~/admin/components/ContentEntries/Scheduler/index.js";

export const SidebarFooter = () => {
    return (
        <div className={"px-xs py-sm bg-neutral-base"}>
            <Scheduler />
            <TrashBin />
        </div>
    );
};
