import React from "react";
import { TrashBin } from "~/admin/components/ContentEntries/TrashBin/index.js";
import { Scheduler } from "~/admin/components/ContentEntries/Scheduler/index.js";
import { makeDecoratable } from "@webiny/react-composition";
import { IsModelPublishable } from "~/exports/admin/cms.js";

export interface ISidebarFooterProps {
    children?: React.ReactNode;
}

export const SidebarFooter = makeDecoratable(({ children }: ISidebarFooterProps) => {
    return (
        <div className={"px-xs py-sm bg-neutral-base"}>
            <IsModelPublishable>
                <Scheduler />
            </IsModelPublishable>
            <TrashBin />
            {children}
        </div>
    );
});
