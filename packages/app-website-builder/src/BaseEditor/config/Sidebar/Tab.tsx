import React from "react";
import { ScrollArea, SegmentedControl } from "@webiny/admin-ui";

export interface TabProps {
    name: string;
    label: string;
    icon?: React.ReactElement;
    element: React.JSX.Element;
    disabled?: boolean;
    visible?: boolean;
}

export const Tab = ({ name, label, icon, disabled, element, visible }: TabProps) => {
    return (
        <SegmentedControl.Tabs.Tab
            value={name}
            trigger={label}
            icon={icon}
            disabled={disabled}
            visible={visible}
            // Height is the viewport minus the header and the editor's top bar + tab header
            // (var(--spacing-header) is the admin header; 65px covers the top bar and tab strip
            // above the sidebar content). Fixed height lets the ScrollArea scroll its content.
            content={
                <ScrollArea className={"h-[calc(100vh-var(--spacing-header)-65px)]"}>
                    {element}
                </ScrollArea>
            }
        />
    );
};
