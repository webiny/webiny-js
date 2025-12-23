import React from "react";
import { cn } from "~/utils.js";
import { ScrollArea } from "~/ScrollArea/index.js";
import { useSidebar } from "./SidebarProvider.js";

const SidebarContent = ({ className, children, ...props }: React.ComponentProps<"div">) => {
    const { state } = useSidebar();
    const isExpanded = state === "expanded";

    if (isExpanded) {
        // Extract dir prop to avoid type conflict with ScrollArea
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { dir, ...restProps } = props;
        return (
            <ScrollArea
                data-sidebar="content"
                className={cn("flex text-neutral-primary min-h-0 flex-1 flex-col gap-2", className)}
                {...restProps}
            >
                {children}
            </ScrollArea>
        );
    }

    return (
        <div
            {...props}
            data-sidebar="content"
            className={cn(
                "flex text-neutral-primary min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden group-data-[state=collapsed]:overflow-hidden",
                className
            )}
        >
            {children}
        </div>
    );
};

export { SidebarContent };
