import React from "react";
import { Icon } from "~/Icon/index.js";

export interface DragCursorProps {
    label: string;
    icon?: React.ReactNode;
    isOverSlot?: boolean;
}

export const DragCursor = ({ label, icon, isOverSlot = false }: DragCursorProps) => {
    const containerClass = isOverSlot
        ? "flex items-center gap-xs px-sm rounded-md border-2 border-accent-default bg-primary-subtle shadow-lg"
        : "flex items-center gap-xs px-sm rounded-md border-2 border-dotted border-accent-default bg-neutral-subtle shadow-lg";

    return (
        <div className={containerClass} style={{ height: 28 }}>
            {icon && <Icon icon={icon} label={label} color={"neutral-strong"} size={"sm"} />}
            <span className={"text-sm font-medium whitespace-nowrap text-neutral-primary"}>
                {label}
            </span>
        </div>
    );
};
