import React from "react";
import { Heading, Separator } from "@webiny/admin-ui";

export interface SidebarSectionProps {
    grow?: boolean;
    maxHeight?: string;
    scrollable?: boolean;
    children: React.ReactNode;
}

const SidebarSection = ({ grow, maxHeight, scrollable, children }: SidebarSectionProps) => {
    const style: React.CSSProperties = {};
    if (maxHeight) {
        style.maxHeight = maxHeight;
    }

    const classes = [
        grow ? "flex-1" : undefined,
        scrollable !== false ? "overflow-y-scroll" : undefined
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes} style={style}>
            {children}
        </div>
    );
};

export interface ListViewSidebarProps {
    title?: string;
    children: React.ReactNode;
}

const ListViewSidebar = ({ title, children }: ListViewSidebarProps) => {
    return (
        <div className={"flex flex-col h-main-content"}>
            {title ? (
                <>
                    <div className={"py-sm px-md"}>
                        <Heading level={5}>{title}</Heading>
                    </div>
                    <Separator />
                </>
            ) : null}
            {children}
        </div>
    );
};

ListViewSidebar.Section = SidebarSection;

export { ListViewSidebar };
