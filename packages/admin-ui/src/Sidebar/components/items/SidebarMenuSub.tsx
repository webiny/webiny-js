import React from "react";
import { cn } from "~/utils.js";
import { SidebarMenuProvider, useSidebarMenu } from "./SidebarMenuProvider.js";

interface SidebarMenuSubProps extends React.HTMLAttributes<HTMLUListElement> {
    parentIcon?: React.ReactNode;
}

const SidebarMenuSub = ({ className, parentIcon, ...props }: SidebarMenuSubProps) => {
    const parentSidebarMenu = useSidebarMenu();

    return (
        <SidebarMenuProvider level={parentSidebarMenu.nextLevel} parentIcon={parentIcon}>
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
