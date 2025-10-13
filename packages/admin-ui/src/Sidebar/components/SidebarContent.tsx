import React from "react";
import { cn } from "~/utils.js";

const SidebarContent = ({ className, ...props }: React.ComponentProps<"div">) => {
    return (
        <div
            {...props}
            data-sidebar="content"
            className={cn(
                "flex text-neutral-primary min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden group-data-[state=collapsed]:overflow-hidden",
                className
            )}
        />
    );
};

export { SidebarContent };
