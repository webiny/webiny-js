import React from "react";

interface SidebarRowProps {
    label: React.ReactNode;
    children: React.ReactNode;
}

export const SidebarRow = ({ label, children }: SidebarRowProps) => {
    return (
        <div className={"flex items-center gap-sm"}>
            <div className={"w-[90px] shrink-0 text-sm text-neutral-strong"}>{label}</div>
            <div className={"flex-1"}>{children}</div>
        </div>
    );
};
