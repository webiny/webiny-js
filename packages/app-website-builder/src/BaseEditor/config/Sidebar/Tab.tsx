import React from "react";
import { FillViewportHeight, ScrollArea, SegmentedControl } from "@webiny/admin-ui";

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
            // Same pattern as the Insert panel: FillViewportHeight sizes the region to the space
            // from its own top edge down to the viewport bottom (no hardcoded offsets), and the
            // ScrollArea scrolls the content within it.
            content={
                <FillViewportHeight>
                    <ScrollArea className={"h-full"}>{element}</ScrollArea>
                </FillViewportHeight>
            }
        />
    );
};
