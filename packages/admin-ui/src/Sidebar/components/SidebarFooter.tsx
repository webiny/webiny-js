import React from "react";
import { Separator } from "~/Separator/index.js";

const SidebarFooter = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div data-sidebar="footer" {...props}>
            <div className={"px-sm pb-xs"}>
                <Separator className={"mb-px"} />
            </div>
            {children}
        </div>
    );
};

export { SidebarFooter };
