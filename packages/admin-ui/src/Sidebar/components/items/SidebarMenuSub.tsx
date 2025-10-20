import React from "react";
import { cn } from "~/utils.js";
import { SidebarMenuProvider, useSidebarMenu } from "./SidebarMenuProvider.js";

const SidebarMenuSub = ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => {
    const parentSidebarMenu = useSidebarMenu();

    return (
        <SidebarMenuProvider level={parentSidebarMenu.nextLevel}>
            <ul
                data-sidebar="menu-sub"
                className={cn(
                    "flex min-w-0 flex-col gap-y-xs pt-xs",
                    "group-data-[state=collapsed]:hidden",
                    className
                )}
                {...props}
            />
        </SidebarMenuProvider>
    );
};

export { SidebarMenuSub };
