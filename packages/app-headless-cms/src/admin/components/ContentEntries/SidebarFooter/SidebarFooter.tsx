import React from "react";
import { TrashBin } from "~/admin/components/ContentEntries/TrashBin/index.js";
import { makeDecoratable } from "@webiny/react-composition";

export interface ISidebarFooterProps {
    children?: React.ReactNode;
}

export const SidebarFooter = makeDecoratable(({ children }: ISidebarFooterProps) => {
    return (
        <div className={"px-xs py-sm bg-neutral-base"}>
            <TrashBin />
            {children}
        </div>
    );
});
