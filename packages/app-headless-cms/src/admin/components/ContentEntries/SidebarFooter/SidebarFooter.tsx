import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { CmsTrashBin } from "~/presentation/contentEntries/trashBin/CmsTrashBin.js";

export interface ISidebarFooterProps {
    children?: React.ReactNode;
}

export const SidebarFooter = makeDecoratable(({ children }: ISidebarFooterProps) => {
    return (
        <div className={"px-xs py-sm bg-neutral-base"}>
            {children}
            <CmsTrashBin />
        </div>
    );
});
